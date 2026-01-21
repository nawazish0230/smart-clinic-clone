const mongoose = require('mongoose');

// Doctor status enum
const DOCTOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  SUSPENDED: 'suspended',
};

// Schedule slot status
const SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
};

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, default: 'USA', trim: true },
}, { _id: false });

const qualificationSchema = new mongoose.Schema({
  degree: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  country: { type: String, trim: true },
}, { _id: false });

const licenseSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, trim: true, unique: true },
  issuingAuthority: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  state: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const scheduleSlotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true },   // Format: "HH:mm"
  status: {
    type: String,
    enum: Object.values(SLOT_STATUS),
    default: SLOT_STATUS.AVAILABLE,
  },
  appointmentId: { type: String, default: null }, // Link to appointment if booked
}, { _id: false });

const weeklyScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0, // Sunday
    max: 6, // Saturday
  },
  isAvailable: { type: Boolean, default: true },
  startTime: { type: String }, // Format: "HH:mm"
  endTime: { type: String },   // Format: "HH:mm"
  breakStartTime: { type: String }, // Optional break
  breakEndTime: { type: String },
}, { _id: false });

const doctorSchema = new mongoose.Schema(
  {
    // Link to Auth Service user ID
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    
    // Address
    address: {
      type: addressSchema,
    },
    
    // Professional Information
    specializations: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    qualifications: [qualificationSchema],
    licenses: [licenseSchema],
    yearsOfExperience: {
      type: Number,
      min: 0,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    
    // Schedule
    weeklySchedule: [weeklyScheduleSchema],
    availabilitySlots: [scheduleSlotSchema],
    
    // Status
    status: {
      type: String,
      enum: Object.values(DOCTOR_STATUS),
      default: DOCTOR_STATUS.ACTIVE,
    },
    
    // Metadata
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastActiveDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
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
doctorSchema.index({ email: 1 });
doctorSchema.index({ userId: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ lastName: 1, firstName: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'address.city': 1 });
doctorSchema.index({ 'availabilitySlots.date': 1, 'availabilitySlots.status': 1 });
doctorSchema.index({ registrationDate: -1 });

// Text search index for specializations and name
doctorSchema.index({
  firstName: 'text',
  lastName: 'text',
  specializations: 'text',
  bio: 'text',
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method to add specialization
doctorSchema.methods.addSpecialization = function (specialization) {
  const normalized = specialization.toLowerCase().trim();
  if (!this.specializations.includes(normalized)) {
    this.specializations.push(normalized);
  }
  return this;
};

// Instance method to remove specialization
doctorSchema.methods.removeSpecialization = function (specialization) {
  const normalized = specialization.toLowerCase().trim();
  this.specializations = this.specializations.filter(s => s !== normalized);
  return this;
};

// Instance method to add availability slot
doctorSchema.methods.addAvailabilitySlot = function (slot) {
  this.availabilitySlots.push(slot);
  return this;
};

// Instance method to update slot status
doctorSchema.methods.updateSlotStatus = function (slotId, status, appointmentId = null) {
  const slot = this.availabilitySlots.id(slotId);
  if (slot) {
    slot.status = status;
    if (appointmentId) {
      slot.appointmentId = appointmentId;
    }
  }
  return this;
};

// Static method to find by userId
doctorSchema.statics.findByUserId = function (userId) {
  return this.findOne({ userId });
};

// Static method to find by email
doctorSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by specialization
doctorSchema.statics.findBySpecialization = function (specialization) {
  return this.find({
    specializations: { $in: [specialization.toLowerCase()] },
    status: DOCTOR_STATUS.ACTIVE,
  });
};

// Static method to find available doctors for date/time
doctorSchema.statics.findAvailable = function (date, startTime, endTime) {
  return this.find({
    status: DOCTOR_STATUS.ACTIVE,
    'availabilitySlots.date': date,
    'availabilitySlots.startTime': startTime,
    'availabilitySlots.endTime': endTime,
    'availabilitySlots.status': SLOT_STATUS.AVAILABLE,
  });
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = {
  Doctor,
  DOCTOR_STATUS,
  SLOT_STATUS,
};

