const { Appointment, APPOINTMENT_STATUS, APPOINTMENT_TYPE} = require('../models/Appointment');
const AppointmentReadView = require('../models/AppointmentReadView');
const AppointmentEvent = require('../models/AppointmentEvent');
const OutboxEvent = require('../models/OutboxEvent');
const {
    ValidationError,
    NotFoundError,
    ConflictError
} = require('../utils/errors');
const logger = require('../utils/logger');
const { publishEvent, EVENT_TYPES } = require('../utils/eventProducer');
const AppointmentBookingSaga = require('./sagaOrchestrator');
const {createServiceClient} = require('./serviceClients');

/**
 * Create a new appointment (with saga pattern)
 * @param {Object} appointmentData - Data for the new appointment
 * @param {string} correlationId - Correlation ID for tracing
 * @returns {Object} Created appointment
 */
const createAppointment = async (appointmentData, correlationId) => {
    const sagaOrchestrator = new AppointmentBookingSaga();

    // validate required fields
    const {patientId, doctorId, appointmentDate, startTime, endTime} = appointmentData;

    if(!patientId || !doctorId || !appointmentDate || !startTime || !endTime) {
        throw new ValidationError('Missing required appointment fields');
    }

    // fetch patient and doctor information
    const serviceClient = createServiceClient();

    let patient, doctor;
    try{
        const [patientResponse, doctorResponse] = await Promise.all([
            serviceClient.patient.get(`/api/patients/${patientId}`, {correlationId}),
            serviceClient.doctor.get(`/api/doctors/${doctorId}`, {correlationId})
        ]);

        patient = patientResponse.data;
        doctor = doctorResponse.data;
    }catch(error){
        logger.error('Failed to fetch patient or doctor', {
            patientId,
            doctorId,
            error: error.message,
        })
        throw new ValidationError('Invalid patientId or doctorId');
    }

    // check for conflicting appointments
    const date = new Date(appointmentDate);
    const conflicting = await Appointment.findConflicting(
        doctorId,
        date,
        startTime,
        endTime
    );

    if(conflicting.length > 0){
        throw new ConflictError('Conflicting appointment exists for the selected time slot');
    }

    // Prepare booking data for saga
    const bookingData = {
        ...appointmentData,
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientEmail: patient.email,
        patientPhone: patient.phone,
        doctorId,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        doctorSpecialization: doctor.specialization?.[0] || 'General',
        appointmentDate: date,
        amount: appointmentData.amount || doctor.consultationFee || 0,
    }

    // Execute saga (this will handle all distributed transaction steps)
    const sageResult = await sagaOrchestrator.execute(bookingData, correlationId);

    // Create appointment document (after sage completes successfully)
    const appointment = new Appointment({
        ...bookingData,
        sagaId: sageResult.sagaId,
        sagaStatus: 'completed',
        status: APPOINTMENT_STATUS.PENDING,
        type: appointmentData.type || APPOINTMENT_TYPE.CONSULTATION,
        duration: appointmentData.duration || 30,
        slotId: sageResult.slotId,
    });

    await appointment.save();
    logger.info(`Appointment created: ${appointment._id}`, {
        appointmentId: appointment._id.toString(),
        patientId,
        doctorId,
    })

    // Update read view (CQRS)
    await AppointmentReadView.updateFormAppointment(appointment);

    // Store event (Event sourcing)
    await AppointmentEvent.createEvent(
        EVENT_TYPES.APPOINTMENT_CREATED,
        appointment, {
            triggeredBy: appointmentData.createdBy || 'system',
            correlationId,
            sagaId: sageResult.sagaId,
        }
    );

    // publish event (via outbox pattern)
    await OutboxEvent.createEvent(
        EVENT_TYPES.APPOINTMENT_CREATED,
        {
            appointmentId: appointment._id.toString(),
            patientId,
            doctorId,
            appointmentDate: appointment.appointmentDate,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
        }
    )
    return appointment; 
}