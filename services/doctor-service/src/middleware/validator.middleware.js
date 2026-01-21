const { body, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation middleware - Check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new ValidationError(errorMessages.join(', '));
  }
  
  next();
};

/**
 * Doctor creation validation rules
 */
const validateCreateDoctor = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('userId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('User ID must not be empty'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('specializations.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Specialization must not be empty'),
  validate,
];

/**
 * Doctor update validation rules
 */
const validateUpdateDoctor = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  validate,
];

/**
 * Query parameters validation for listing doctors
 */
const validateGetDoctors = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'on_leave', 'suspended'])
    .withMessage('Invalid status value'),
  query('specialization')
    .optional()
    .trim(),
  validate,
];

/**
 * Availability slot validation
 */
const validateAvailabilitySlot = [
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('startTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  body('endTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  validate,
];

module.exports = {
  validate,
  validateCreateDoctor,
  validateUpdateDoctor,
  validateGetDoctors,
  validateAvailabilitySlot,
};

