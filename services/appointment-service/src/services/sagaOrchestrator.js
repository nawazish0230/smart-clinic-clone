const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const config = require('../config');
const { createServiceClients } = require('./serviceClients');
const { publishEvent, EVENT_TYPES } = require('../utils/eventProducer');
const { SagaError } = require('../utils/errors');
const OutboxEvent = require('../models/OutboxEvent');

/**
 * Saga Orchestrator for Appointment Booking
 * Coordinates distributed transaction across multiple services
 */
class AppointmentBookingSaga {
    constructor() {
        this.serviceClients = createServiceClients();
    }

    /**
     * Execute appointment booking saga
     * @params {Object} bookingData - Data required for booking appointment
     * @params {string} correlationId - Correlation ID for tracing
     * @return {Object} created appointment details
     */
    async execute(bookingData, correlationId) {
        const sagaId = uuidv4();
        const comensationSteps = [];

        logger.info(`Starting appointment booking sage: ${sagaId}, {
            sagaId,
            correlationId,
            bookingData: {
            partientId: bookingData.patientId,
            doctrId: bookingData.doctorId,
            date: bookingData.appointmentDate
            }
        }`);
        try {
            // Step 1: Check Doctor Availability
            logger.info(`Saga ${sagaId}: Step 1 - Checking doctor availability`);
            const doctorAvaliable = await this.checkDoctorAvaliability(
                bookingData.doctorId,
                bookingData.appointmentDate,
                bookingData.startTime,
                bookingData.endTime,
                correlationId
            );

            if (!doctorAvaliable) {
                throw new SagaError('Doctor is not available for the requested time slot', null);
            }

            comensationSteps.push({
                step: 'doctor_availability_check',
                compensate: () => this.compensateDoctorAvailabilityCheck(bookingData, sagaId)
            })

            // Publish Event
            await this.publishSageEvent(EVENT_TYPES.DOCTOR_AVAILABILITY_CHECKED, {
                sageId,
                doctorId: bookingData.doctorId,
                date: bookingData.appointmentDate,
                startTime: bookingData.startTime,
                endTime: bookingData.endTime
            }, correlationId);

            // Step 2: Reserve Slot in Doctor Service
            logger.info(`Saga ${sagaId}: Step 2 - Reserving slot in doctor service`);
            const slotReserved = await this.reserveSlot(
                bookingData.doctorId,
                bookingData.appointmentDate,
                bookingData.startTime,
                bookingData.endTime,
                sageId,
                correlationId
            );

            comensationSteps.push({
                step: 'slot_reserved',
                slotId: slotReserved.slotId,
                compensate: () => this.compensateSlotReservation(
                    bookingData.doctorId,
                    slotReservatioin.slotId,
                    sageId,
                    correlationId
                )
            })

            // publish event
            await this.publishSageEvent(EVENT_TYPES.SLOT_RESERVED, {
                sageId,
                doctorId: bookingData.doctorId,
                slotId: slotReservation.slotId
            }, correlationId);

            // Step 3: Create Appointment (local) - will be created in service layer
            logger.info(`Saga ${sagaId}: Step 3 - Preparing appointment creation`);
            // Appoitment will ve created after saga completes
            // Store slot info for appointment creation
            const appointmentData = {
                ...bookingData,
                slotId: slotReserved.slotId,
                sagaId,
                sagaState: 'slot_reserved'
            };

            comensationSteps.push({
                step: 'appointment_created',
                appointmentData,
                compensate: () => this.compensateAppointmentCreation(
                    null,  // will be set after appointment is created,
                    sagaId,
                    correlationId
                )
            })

            // Step 4: Create invoice in billing service (optional - if amount > 0)


        } catch (error) {
            logger.error(`Sage ${sagaId}: Failed`, {
                sageId,
                error: error.message,
                compensationSteps: compensationSteps.length
            });

            // compensate all completed steps (in reverse order)
            await this.compensate(compensationSteps, sagaId, correlationId);

            // Publish saga failed event
            await this.publishSageEvent(EVENT_TYPES.APPOINTMENT_BOOKING_FAILED, {
                sagaId,
                error: error.message
            }, correlationId);

            throw new SagaError(`Appointment booking failed: ${error.message}`, {
                sageId,
                compensationSteps: compensationSteps.length
            });
        }
    }

    /**
     * Check doctor availability
     */
    async checkDoctorAvaliability(doctorId, date, startTime, endTime, correlationId) {
        try {
            const response = await this.serviceClients.doctor.get(
                `/api/doctors/available?date=${date.toISOString().split('T')[0]}&startTime=${startTime}&endTime=${endTime}`, { correlationId },
            );

            // check if doctor is in the available list
            const availableDoctors = response.data || [];
            return availableDoctors.some(doc => doc.id === doctorId || doc._id === doctorId);
        } catch (error) {
            logger.error('Failed to check doctor availability', {
                doctorId,
                error: error.message,
            })
            throw error;
        }
    }

    /**
     * Reserve slot in doctor service
     */
    async reserveSlot(doctorId, date, startTime, endTime, sagaId, correlationId) {
        try {
            // First, get dictor to find slot
            const doctorResponse = await this.serviceClients.doctor.get(
                `/api/doctors/${doctorId}`, { correlationId },
            );

            // Find matching slot
            const doctor = doctorResponse.data;
            const slot = doctor.availabilitySlots?.find(
                s => s.date === date.toISOString().split('T')[0] && s.startTime === startTime && s.endTime === endTime && s.status === 'available'
            )

            if (!slot) {
                throw new Error('slot not found or not available');
            }

            // Update slot status to reserved
            const updateResponse = await this.serviceClients.doctor.patch(
                `/api/doctors/${doctorId}/availability/${slot._id || slot.id}`,
                {
                    status: 'booked',
                    appointmentId: sagaId,  // Temporary, will updated with actual appointmentId
                },
                { correlationId }
            );

            return {
                slotId: slot._id || slot.id,
                doctorId
            }
        } catch (error) {
            logger.error('Failed to reserve slot', {
                doctorId,
                error: error.message,
            })
            throw error;
        }
    }

    /**
     * Create appointment (local operation)
     * Note: This is called from the service layer, not directyly
     */
    async createAppointment(bookingData, sagaId, correlationId) {
        // This method is a place holder - actual appoitment creation
        // happens in the service layer after saga completes
        return {
            sageId,
            sageDate: 'slot_reserved',
        }
    }

    /**
     * Create invoive in billing service - skip
     */

    /**
     * Compensate all steps
     */
    async compensate(compensationSteps, sagaId, correlationId) {
        logger.info(`Saga ${sageId}: Starting compensation`, {
            sagaId,
            steps: compensationSteps.length
        });

        // Execute compensation in reverse order
        for (let i = compensationSteps.length - 1; i >= 0; i--) {
            const step = compensationSteps[i];
            try {
                logger.info(`Saga ${sagaId}: Compensating step ${step.step}`);
                await step.compensate();
            } catch (error) {
                logger.error(`Saga ${sagaId}: Compensation failed for step ${step.step}`, {
                    error: error.message
                });
                // continue with other compensations even if one fails
            }
        }
        // publish compensation event
        await this.publishSageEvent(EVENT_TYPES.APPOINTMENT_BOOKING_COMPENSATED, {
            sagaId,
            stepsCompensated: compensationSteps.length
        }, correlationId);
    }

    /**
     * Compensation methods
     */
    async compensateDoctorAvailabilityCheck(bookingData, sagaId) {
        // No compenation needed - just a check
        logger.info(`Saga ${sagaId}: No compensation needed for doctor availability check`);
    }

    async compensateSlotReservation(doctorId, slotId, sagaId, correlationId) {
        try {
            await this.serviceClients.doctor.patch(
                `/api/doctors/${doctorId}/availability/${slotId}`,
                { status: 'available', appointmentId: null },
                { correlationId }
            );
            logger.info(`Saga ${sagaId}: Slot reservation compensated for slot ${slotId}`);
        } catch (error) {
            logger.error(`Saga ${sagaId}: Failed to compensate slot reservation for slot ${slotId}`, {
                error: error.message
            });
        }
    }

    async compensateAppointmentCreation(appointmentData, sagaId, correlationId) {
        // Appointment will be deleted or marked as cancelled
        // This is handled in the service layer
        logger.info(`Saga ${sagaId}: Compensate appointment creation`);
    }

    /**
     * Publish saga event (with outbox pattern)
     */
    async publishSageEvent(eventType, eventData, correlationId) {
        try{
            // Store in outbox first (transactional outbox pattern)
            await OutboxEvent.createEvent(eventType, {
                ...eventData,
                correlationId,
                service: config.serviceName,
                timestamp: new Date().toISOString()
            });

            // publish immediately (background process with retry if fails)
            await publishEvent(eventType, eventData);
        }catch(error){
            logger.error(`Failed to publish saga event: ${eventType}`, {
                error: error.message,
            });
            // Dont throw - event publishing failure should't break the saga
        }
    }
}

module.exports = AppointmentBookingSaga;