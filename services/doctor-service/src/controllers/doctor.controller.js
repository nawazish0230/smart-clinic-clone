const doctorService = require('../services/doctor.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a new doctor
 */
const createDoctor = async (req, res, next) => {
  try {
    const doctorData = req.body;
    
    // If userId not provided and user is authenticated, use authenticated user's ID
    if (!doctorData.userId && req.user) {
      doctorData.userId = req.user.userId;
    }

    const doctor = await doctorService.createDoctor(doctorData);
    
    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor by ID
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.getDoctorById(id);
    
    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor by user ID
 */
const getDoctorByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const doctor = await doctorService.getDoctorByUserId(userId);
    
    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's doctor profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const doctor = await doctorService.getDoctorByUserId(req.user.userId);
    
    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all doctors with pagination
 */
const getAllDoctors = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const filters = {
      status: req.query.status,
      specialization: req.query.specialization,
      city: req.query.city,
      search: req.query.search,
      availableDate: req.query.availableDate,
      availableTime: req.query.availableTime,
    };

    // Use read view for availability queries
    const useReadView = !!(filters.availableDate || filters.availableTime);

    const result = await doctorService.getAllDoctors(filters, page, limit, useReadView);
    
    res.status(200).json({
      success: true,
      data: result.doctors,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const doctor = await doctorService.updateDoctor(id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete doctor (soft delete)
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await doctorService.deleteDoctor(id);
    
    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add specialization
 */
const addSpecialization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization } = req.body;
    
    if (!specialization) {
      throw new ValidationError('Specialization is required');
    }

    const doctor = await doctorService.addSpecialization(id, specialization);
    
    res.status(200).json({
      success: true,
      message: 'Specialization added successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove specialization
 */
const removeSpecialization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization } = req.body;
    
    if (!specialization) {
      throw new ValidationError('Specialization is required');
    }

    const doctor = await doctorService.removeSpecialization(id, specialization);
    
    res.status(200).json({
      success: true,
      message: 'Specialization removed successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add availability slot
 */
const addAvailabilitySlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slot = req.body;
    
    const doctor = await doctorService.addAvailabilitySlot(id, slot);
    
    res.status(200).json({
      success: true,
      message: 'Availability slot added successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update slot status
 */
const updateSlotStatus = async (req, res, next) => {
  try {
    const { id, slotId } = req.params;
    const { status, appointmentId } = req.body;
    
    if (!status) {
      throw new ValidationError('Status is required');
    }

    const doctor = await doctorService.updateSlotStatus(id, slotId, status, appointmentId);
    
    res.status(200).json({
      success: true,
      message: 'Slot status updated successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available doctors
 */
const getAvailableDoctors = async (req, res, next) => {
  try {
    const { date, startTime, endTime, specialization } = req.query;
    
    if (!date) {
      throw new ValidationError('Date is required');
    }

    const doctors = await doctorService.getAvailableDoctors(
      new Date(date),
      startTime,
      endTime,
      specialization
    );
    
    res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update weekly schedule
 */
const updateWeeklySchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weeklySchedule } = req.body;
    
    if (!weeklySchedule || !Array.isArray(weeklySchedule)) {
      throw new ValidationError('Weekly schedule must be an array');
    }

    const doctor = await doctorService.updateWeeklySchedule(id, weeklySchedule);
    
    res.status(200).json({
      success: true,
      message: 'Weekly schedule updated successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set doctor unavailable
 */
const setDoctorUnavailable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const doctor = await doctorService.setDoctorUnavailable(id, reason);
    
    res.status(200).json({
      success: true,
      message: 'Doctor set to unavailable',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDoctor,
  getDoctorById,
  getDoctorByUserId,
  getMyProfile,
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

