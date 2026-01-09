const mongoose = require('mongoose');

// Appointment status enum
const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

// Appointment type enum
const APPOINTMENT_TYPE = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow_up',
  CHECKUP: 'checkup',
  EMERGENCY: 'emergency',
  SURGERY: 'surgery',
  OTHER: 'other',
};

const appointmentSchema = new mongoose.Schema(
  {
    // Patient Information
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      trim: true,
    },
    patientPhone: {
      type: String,
      trim: true,
    },
    
    // Doctor Information
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    doctorSpecialization: {
      type: String,
      trim: true,
    },
    
    // Appointment Details
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
    },
    duration: {
      type: Number,
      required: true,
      min: 15, // Minimum 15 minutes
      default: 30, // Default 30 minutes
    },
    
    // Slot Information (from Doctor Service)
    slotId: {
      type: String,
      index: true,
    },
    
    // Appointment Type
    type: {
      type: String,
      enum: Object.values(APPOINTMENT_TYPE),
      default: APPOINTMENT_TYPE.CONSULTATION,
    },
    
    // Reason/Notes
    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    
    // Status
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    
    // Billing Information
    invoiceId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'cancelled'],
      default: 'pending',
    },
    
    // Saga State (for distributed transaction management)
    sagaId: {
      type: String,
      index: true,
    },
    sagaState: {
      type: String,
      enum: ['started', 'doctor_checked', 'slot_reserved', 'invoice_created', 'completed', 'compensating', 'compensated', 'failed'],
    },
    compensationData: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Metadata
    createdBy: {
      type: String, // User ID who created the appointment
      index: true,
    },
    cancelledBy: {
      type: String, // User ID who cancelled
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    confirmedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for faster queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ sagaId: 1 });
appointmentSchema.index({ invoiceId: 1 });

// Compound indexes
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function () {
  if (!this.appointmentDate || !this.startTime) return null;
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Instance method to confirm appointment
appointmentSchema.methods.confirm = function () {
  this.status = APPOINTMENT_STATUS.CONFIRMED;
  this.confirmedAt = new Date();
  return this;
};

// Instance method to cancel appointment
appointmentSchema.methods.cancel = function (userId, reason) {
  this.status = APPOINTMENT_STATUS.CANCELLED;
  this.cancelledBy = userId;
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this;
};

// Instance method to complete appointment
appointmentSchema.methods.complete = function () {
  this.status = APPOINTMENT_STATUS.COMPLETED;
  this.completedAt = new Date();
  return this;
};

// Static method to find by patient ID
appointmentSchema.statics.findByPatientId = function (patientId, filters = {}) {
  const query = { patientId, ...filters };
  return this.find(query).sort({ appointmentDate: -1 });
};

// Static method to find by doctor ID
appointmentSchema.statics.findByDoctorId = function (doctorId, filters = {}) {
  const query = { doctorId, ...filters };
  return this.find(query).sort({ appointmentDate: -1 });
};

// Static method to find by date range
appointmentSchema.statics.findByDateRange = function (startDate, endDate, filters = {}) {
  return this.find({
    appointmentDate: {
      $gte: startDate,
      $lte: endDate,
    },
    ...filters,
  }).sort({ appointmentDate: 1, startTime: 1 });
};

// Static method to find conflicting appointments
appointmentSchema.statics.findConflicting = function (doctorId, date, startTime, endTime, excludeId = null) {
  const query = {
    doctorId,
    appointmentDate: date,
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    $or: [
      {
        startTime: { $gte: startTime, $lt: endTime },
      },
      {
        endTime: { $gt: startTime, $lte: endTime },
      },
      {
        startTime: { $lte: startTime },
        endTime: { $gte: endTime },
      },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return this.find(query);
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = {
  Appointment,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPE,
};

