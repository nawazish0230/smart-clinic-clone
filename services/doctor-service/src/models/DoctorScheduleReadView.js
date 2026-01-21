const mongoose = require('mongoose');

/**
 * CQRS Read Model for Doctor Schedule
 * Optimized for fast availability queries and schedule searches
 */
const doctorScheduleReadViewSchema = new mongoose.Schema(
  {
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Doctor Basic Info (denormalized for fast queries)
    doctorName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    specializations: [{
      type: String,
      index: true,
    }],
    
    // Schedule Information (denormalized)
    nextAvailableSlot: {
      date: Date,
      startTime: String,
      endTime: String,
    },
    availableSlotsCount: {
      type: Number,
      default: 0,
    },
    bookedSlotsCount: {
      type: Number,
      default: 0,
    },
    
    // Weekly Schedule (denormalized)
    weeklySchedule: [{
      dayOfWeek: Number,
      isAvailable: Boolean,
      startTime: String,
      endTime: String,
    }],
    
    // Availability by date range (for quick queries)
    availabilityDates: [{
      date: Date,
      availableSlots: Number,
      bookedSlots: Number,
    }],
    
    // Status
    status: {
      type: String,
      index: true,
    },
    
    // Metadata
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
doctorScheduleReadViewSchema.index({ specializations: 1, status: 1, 'nextAvailableSlot.date': 1 });
doctorScheduleReadViewSchema.index({ 'availabilityDates.date': 1, status: 1 });
doctorScheduleReadViewSchema.index({ doctorName: 'text', specializations: 'text' });

/**
 * Update read view from Doctor model
 */
doctorScheduleReadViewSchema.statics.updateFromDoctor = async function (doctor) {
  const doctorId = doctor._id.toString();
  
  // Calculate next available slot
  const availableSlots = doctor.availabilitySlots.filter(
    slot => slot.status === 'available' && new Date(slot.date) >= new Date()
  );
  
  let nextAvailableSlot = null;
  if (availableSlots.length > 0) {
    const sortedSlots = availableSlots.sort((a, b) => 
      new Date(a.date) - new Date(b.date) || a.startTime.localeCompare(b.startTime)
    );
    nextAvailableSlot = {
      date: sortedSlots[0].date,
      startTime: sortedSlots[0].startTime,
      endTime: sortedSlots[0].endTime,
    };
  }
  
  // Count slots
  const availableSlotsCount = doctor.availabilitySlots.filter(
    slot => slot.status === 'available'
  ).length;
  
  const bookedSlotsCount = doctor.availabilitySlots.filter(
    slot => slot.status === 'booked'
  ).length;
  
  // Group availability by date
  const availabilityDates = [];
  const slotsByDate = {};
  
  doctor.availabilitySlots.forEach(slot => {
    const dateKey = new Date(slot.date).toISOString().split('T')[0];
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = { available: 0, booked: 0 };
    }
    if (slot.status === 'available') {
      slotsByDate[dateKey].available++;
    } else if (slot.status === 'booked') {
      slotsByDate[dateKey].booked++;
    }
  });
  
  Object.keys(slotsByDate).forEach(date => {
    availabilityDates.push({
      date: new Date(date),
      availableSlots: slotsByDate[date].available,
      bookedSlots: slotsByDate[date].booked,
    });
  });
  
  // Update or create read view
  await this.findOneAndUpdate(
    { doctorId },
    {
      doctorId,
      userId: doctor.userId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      email: doctor.email,
      specializations: doctor.specializations,
      nextAvailableSlot,
      availableSlotsCount,
      bookedSlotsCount,
      weeklySchedule: doctor.weeklySchedule,
      availabilityDates,
      status: doctor.status,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true }
  );
};

/**
 * Find available doctors for date/time (optimized query)
 */
doctorScheduleReadViewSchema.statics.findAvailableDoctors = function (date, specialization = null) {
  const query = {
    status: 'active',
    'availabilityDates.date': date,
    'availabilityDates.availableSlots': { $gt: 0 },
  };
  
  if (specialization) {
    query.specializations = { $in: [specialization.toLowerCase()] };
  }
  
  return this.find(query)
    .sort({ 'nextAvailableSlot.date': 1 })
    .lean();
};

const DoctorScheduleReadView = mongoose.model('DoctorScheduleReadView', doctorScheduleReadViewSchema);

module.exports = DoctorScheduleReadView;

