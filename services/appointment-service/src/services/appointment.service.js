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

/**
 * 
 */