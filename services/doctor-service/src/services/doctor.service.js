const { Doctor, DOCTOR_STATUS, SLOT_STATUS } = require('../models/Doctor');
const DoctorScheduleReadView = require('../models/DoctorScheduleReadView');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const { publishEvent, EVENT_TYPES } = require('../utils/eventProducer');

/**
 * Create a new doctor
 * @param {Object} doctorData - Doctor data
 * @returns {Object} Created doctor
 */
const createDoctor = async (doctorData) => {
  const { userId, email } = doctorData;

  // Check if doctor already exists with userId
  if (userId) {
    const existingByUserId = await Doctor.findByUserId(userId);
    if (existingByUserId) {
      throw new ConflictError('Doctor with this user ID already exists');
    }
  }

  // Check if doctor already exists with email
  if (email) {
    const existingByEmail = await Doctor.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictError('Doctor with this email already exists');
    }
  }

  const doctor = new Doctor({
    ...doctorData,
    email: email ? email.toLowerCase() : undefined,
    status: DOCTOR_STATUS.ACTIVE,
  });

  await doctor.save();
  logger.info(`Doctor created: ${doctor.email} (${doctor._id})`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.DOCTOR_CREATED, {
    doctorId: doctor._id.toString(),
    userId: doctor.userId,
    email: doctor.email,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    specializations: doctor.specializations,
  });

  return doctor;
};

/**
 * Get doctor by ID
 * @param {String} doctorId - Doctor ID
 * @returns {Object} Doctor
 */
const getDoctorById = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  return doctor;
};

/**
 * Get doctor by user ID
 * @param {String} userId - User ID from Auth Service
 * @returns {Object} Doctor
 */
const getDoctorByUserId = async (userId) => {
  const doctor = await Doctor.findByUserId(userId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  return doctor;
};

/**
 * Get doctor by email
 * @param {String} email - Doctor email
 * @returns {Object} Doctor
 */
const getDoctorByEmail = async (email) => {
  const doctor = await Doctor.findByEmail(email);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  return doctor;
};

/**
 * Get all doctors with pagination and filters (CQRS - using read view for availability queries)
 * @param {Object} filters - Filter options
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @param {Boolean} useReadView - Use read-optimized view (default: true for availability queries)
 * @returns {Object} Paginated doctors
 */
const getAllDoctors = async (filters = {}, page = 1, limit = 10, useReadView = false) => {
  const query = {};

  // Apply filters
  if (filters.status) {
    query.status = filters.status;
  } else {
    query.status = DOCTOR_STATUS.ACTIVE; // Default to active
  }

  if (filters.specialization) {
    query.specializations = { $in: [filters.specialization.toLowerCase()] };
  }

  if (filters.city) {
    query['address.city'] = new RegExp(filters.city, 'i');
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  // Use read view for availability queries
  if (useReadView && (filters.availableDate || filters.availableTime)) {
    const readViewQuery = {
      status: 'active',
    };

    if (filters.specialization) {
      readViewQuery.specializations = { $in: [filters.specialization.toLowerCase()] };
    }

    if (filters.availableDate) {
      readViewQuery['availabilityDates.date'] = new Date(filters.availableDate);
      readViewQuery['availabilityDates.availableSlots'] = { $gt: 0 };
    }

    const skip = (page - 1) * limit;
    const [readViews, total] = await Promise.all([
      DoctorScheduleReadView.find(readViewQuery)
        .sort({ 'nextAvailableSlot.date': 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DoctorScheduleReadView.countDocuments(readViewQuery),
    ]);

    // Fetch full doctor data
    const doctorIds = readViews.map(rv => rv.doctorId);
    const doctors = await Doctor.find({ _id: { $in: doctorIds } });

    return {
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Fallback to write model
  const skip = (page - 1) * limit;
  const [doctors, total] = await Promise.all([
    Doctor.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(query),
  ]);

  return {
    doctors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update doctor
 * @param {String} doctorId - Doctor ID
 * @param {Object} updateData - Update data
 * @returns {Object} Updated doctor
 */
const updateDoctor = async (doctorId, updateData) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  // Handle email update separately to check for conflicts
  if (updateData.email && updateData.email !== doctor.email) {
    const existingByEmail = await Doctor.findByEmail(updateData.email);
    if (existingByEmail && existingByEmail._id.toString() !== doctorId) {
      throw new ConflictError('Doctor with this email already exists');
    }
    updateData.email = updateData.email.toLowerCase();
  }

  Object.assign(doctor, updateData);
  await doctor.save();

  logger.info(`Doctor updated: ${doctor.email} (${doctorId})`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.DOCTOR_UPDATED, {
    doctorId: doctor._id.toString(),
    userId: doctor.userId,
    email: doctor.email,
    updatedFields: Object.keys(updateData),
  });

  return doctor;
};

/**
 * Delete doctor (soft delete by setting status to inactive)
 * @param {String} doctorId - Doctor ID
 */
const deleteDoctor = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.status = DOCTOR_STATUS.INACTIVE;
  await doctor.save();

  logger.info(`Doctor deleted (inactivated): ${doctor.email} (${doctorId})`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.DOCTOR_DELETED, {
    doctorId: doctor._id.toString(),
    userId: doctor.userId,
    email: doctor.email,
  });
};

/**
 * Add specialization
 * @param {String} doctorId - Doctor ID
 * @param {String} specialization - Specialization name
 * @returns {Object} Updated doctor
 */
const addSpecialization = async (doctorId, specialization) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.addSpecialization(specialization);
  await doctor.save();

  logger.info(`Specialization added to doctor: ${doctorId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.SPECIALIZATION_ADDED, {
    doctorId: doctor._id.toString(),
    specialization: specialization.toLowerCase(),
  });

  return doctor;
};

/**
 * Remove specialization
 * @param {String} doctorId - Doctor ID
 * @param {String} specialization - Specialization name
 * @returns {Object} Updated doctor
 */
const removeSpecialization = async (doctorId, specialization) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.removeSpecialization(specialization);
  await doctor.save();

  logger.info(`Specialization removed from doctor: ${doctorId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.SPECIALIZATION_REMOVED, {
    doctorId: doctor._id.toString(),
    specialization: specialization.toLowerCase(),
  });

  return doctor;
};

/**
 * Add availability slot
 * @param {String} doctorId - Doctor ID
 * @param {Object} slot - Availability slot
 * @returns {Object} Updated doctor
 */
const addAvailabilitySlot = async (doctorId, slot) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.addAvailabilitySlot({
    ...slot,
    status: SLOT_STATUS.AVAILABLE,
  });
  await doctor.save();

  logger.info(`Availability slot added to doctor: ${doctorId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.SCHEDULE_SLOT_ADDED, {
    doctorId: doctor._id.toString(),
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
  });

  // Publish schedule updated event
  await publishEvent(EVENT_TYPES.SCHEDULE_UPDATED, {
    doctorId: doctor._id.toString(),
  });

  return doctor;
};

/**
 * Update slot status (e.g., when booking appointment)
 * @param {String} doctorId - Doctor ID
 * @param {String} slotId - Slot ID
 * @param {String} status - New status
 * @param {String} appointmentId - Appointment ID (if booking)
 * @returns {Object} Updated doctor
 */
const updateSlotStatus = async (doctorId, slotId, status, appointmentId = null) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.updateSlotStatus(slotId, status, appointmentId);
  await doctor.save();

  logger.info(`Slot status updated for doctor: ${doctorId}, slot: ${slotId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event based on status
  if (status === SLOT_STATUS.BOOKED) {
    await publishEvent(EVENT_TYPES.SCHEDULE_UPDATED, {
      doctorId: doctor._id.toString(),
      slotId,
      appointmentId,
    });
  } else if (status === SLOT_STATUS.AVAILABLE) {
    await publishEvent(EVENT_TYPES.DOCTOR_AVAILABLE, {
      doctorId: doctor._id.toString(),
      slotId,
    });
  }

  return doctor;
};

/**
 * Get available doctors for date/time (CQRS - optimized query)
 * @param {Date} date - Date
 * @param {String} startTime - Start time (HH:mm)
 * @param {String} endTime - End time (HH:mm)
 * @param {String} specialization - Optional specialization filter
 * @returns {Array} Available doctors
 */
const getAvailableDoctors = async (date, startTime, endTime, specialization = null) => {
  // Use read view for fast query
  const readViews = await DoctorScheduleReadView.findAvailableDoctors(date, specialization);
  
  // Filter by time if provided
  let doctors = [];
  if (startTime && endTime) {
    // Need to check actual slots for time matching
    const doctorIds = readViews.map(rv => rv.doctorId);
    doctors = await Doctor.find({
      _id: { $in: doctorIds },
      'availabilitySlots.date': date,
      'availabilitySlots.startTime': startTime,
      'availabilitySlots.endTime': endTime,
      'availabilitySlots.status': SLOT_STATUS.AVAILABLE,
    });
  } else {
    // Just return doctors with availability on that date
    const doctorIds = readViews.map(rv => rv.doctorId);
    doctors = await Doctor.find({ _id: { $in: doctorIds } });
  }

  return doctors;
};

/**
 * Update weekly schedule
 * @param {String} doctorId - Doctor ID
 * @param {Array} weeklySchedule - Weekly schedule array
 * @returns {Object} Updated doctor
 */
const updateWeeklySchedule = async (doctorId, weeklySchedule) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.weeklySchedule = weeklySchedule;
  await doctor.save();

  logger.info(`Weekly schedule updated for doctor: ${doctorId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.SCHEDULE_UPDATED, {
    doctorId: doctor._id.toString(),
  });

  return doctor;
};

/**
 * Set doctor unavailable
 * @param {String} doctorId - Doctor ID
 * @param {String} reason - Reason for unavailability
 * @returns {Object} Updated doctor
 */
const setDoctorUnavailable = async (doctorId, reason) => {
  const doctor = await Doctor.findById(doctorId);
  
  if (!doctor) {
    throw new NotFoundError('Doctor');
  }

  doctor.status = DOCTOR_STATUS.ON_LEAVE;
  if (reason) {
    doctor.notes = reason;
  }
  await doctor.save();

  logger.info(`Doctor set to unavailable: ${doctorId}`);

  // Update read view (CQRS)
  await DoctorScheduleReadView.updateFromDoctor(doctor);

  // Publish event (Event-Driven)
  await publishEvent(EVENT_TYPES.DOCTOR_UNAVAILABLE, {
    doctorId: doctor._id.toString(),
    reason,
  });

  return doctor;
};

module.exports = {
  createDoctor,
  getDoctorById,
  getDoctorByUserId,
  getDoctorByEmail,
  getAllDoctors,
  updateDoctor,
  deleteDoctor,
  addSpecialization,
  removeSpecialization,
  addAvailabilitySlot,
  updateSlotStatus,
  getAvailableDoctors,
  updateWeeklySchedule,
  setDoctorUnavailable,
};

