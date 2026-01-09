const mongoose = require('mongoose');

/**
 * CQRS Read Model for Appointments
 * Optimized for fast schedule queries and availability checks
 */
const appointmentReadViewSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Patient Information (denormalized)
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      index: true,
    },
    patientEmail: {
      type: String,
    },
    
    // Doctor Information (denormalized)
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
      index: true,
    },
    doctorSpecialization: {
      type: String,
      index: true,
    },
    
    // Appointment Details (denormalized)
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    
    // Status
    status: {
      type: String,
      required: true,
      index: true,
    },
    
    // Type
    type: {
      type: String,
      index: true,
    },
    
    // Billing
    invoiceId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      index: true,
    },
    
    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
appointmentReadViewSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentReadViewSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentReadViewSchema.index({ appointmentDate: 1, startTime: 1, status: 1 });
appointmentReadViewSchema.index({ doctorId: 1, appointmentDate: 1, startTime: 1 });

/**
 * Update read view from Appointment model
 */
appointmentReadViewSchema.statics.updateFromAppointment = async function (appointment) {
  const appointmentId = appointment._id.toString();
  
  await this.findOneAndUpdate(
    { appointmentId },
    {
      appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      doctorSpecialization: appointment.doctorSpecialization,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      duration: appointment.duration,
      status: appointment.status,
      type: appointment.type,
      invoiceId: appointment.invoiceId,
      paymentStatus: appointment.paymentStatus,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );
};

/**
 * Find appointments by doctor and date (optimized query)
 */
appointmentReadViewSchema.statics.findByDoctorAndDate = function (doctorId, date, status = null) {
  const query = {
    doctorId,
    appointmentDate: date,
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ startTime: 1 })
    .lean();
};

/**
 * Find available time slots for doctor on date
 */
appointmentReadViewSchema.statics.findAvailableSlots = async function (doctorId, date, slotDuration = 30) {
  // Get all appointments for the doctor on this date
  const appointments = await this.find({
    doctorId,
    appointmentDate: date,
    status: { $in: ['pending', 'confirmed'] },
  }).sort({ startTime: 1 }).lean();
  
  // This would typically be combined with Doctor Service availability
  // For now, return the booked slots
  return appointments.map(apt => ({
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: 'booked',
  }));
};

const AppointmentReadView = mongoose.model('AppointmentReadView', appointmentReadViewSchema);

module.exports = AppointmentReadView;

