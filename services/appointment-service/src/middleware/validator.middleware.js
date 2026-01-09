const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

/**
 * Validation rules for creating appointment
 */
const createAppointmentRules = [
  require('express-validator').body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isString()
    .withMessage('Patient ID must be a string'),
  
  require('express-validator').body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isString()
    .withMessage('Doctor ID must be a string'),
  
  require('express-validator').body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required')
    .isISO8601()
    .withMessage('Appointment date must be a valid date'),
  
  require('express-validator').body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  
  require('express-validator').body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  
  require('express-validator').body('duration')
    .optional()
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),
  
  require('express-validator').body('type')
    .optional()
    .isIn(['consultation', 'follow_up', 'checkup', 'emergency', 'surgery', 'other'])
    .withMessage('Invalid appointment type'),
];

/**
 * Validation rules for updating appointment
 */
const updateAppointmentRules = [
  require('express-validator').body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Appointment date must be a valid date'),
  
  require('express-validator').body('startTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  
  require('express-validator').body('endTime')
    .optional()
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  
  require('express-validator').body('reason')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
];

module.exports = {
  validate,
  createAppointmentRules,
  updateAppointmentRules,
};

