const { Kafka } = require('kafkajs');
const logger = require('./logger');
const config = require('../config');

// Kafka client configuration
const kafka = new Kafka({
  clientId: config.serviceName,
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

// Create producer
const producer = kafka.producer();

// Event types for Appointment Service
const EVENT_TYPES = {
  // Appointment Events
  APPOINTMENT_CREATED: 'AppointmentCreated',
  APPOINTMENT_UPDATED: 'AppointmentUpdated',
  APPOINTMENT_CANCELLED: 'AppointmentCancelled',
  APPOINTMENT_RESCHEDULED: 'AppointmentRescheduled',
  APPOINTMENT_CONFIRMED: 'AppointmentConfirmed',
  APPOINTMENT_COMPLETED: 'AppointmentCompleted',
  
  // Saga Events (for choreography)
  APPOINTMENT_BOOKING_STARTED: 'AppointmentBookingStarted',
  DOCTOR_AVAILABILITY_CHECKED: 'DoctorAvailabilityChecked',
  SLOT_RESERVED: 'SlotReserved',
  INVOICE_CREATED: 'InvoiceCreated',
  APPOINTMENT_BOOKING_COMPLETED: 'AppointmentBookingCompleted',
  APPOINTMENT_BOOKING_FAILED: 'AppointmentBookingFailed',
  APPOINTMENT_BOOKING_COMPENSATED: 'AppointmentBookingCompensated',
};

/**
 * Initialize Kafka producer
 */
const initializeProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error(`Failed to connect Kafka producer: ${error.message}`);
    // Don't fail service startup if Kafka is unavailable
    // Service can still function without event publishing
  }
};

/**
 * Publish event to Kafka
 * @param {String} eventType - Event type
 * @param {Object} eventData - Event data
 * @param {String} topic - Kafka topic (default: appointment-events)
 */
const publishEvent = async (eventType, eventData, topic = 'appointment-events') => {
  try {
    if (!producer) {
      logger.warn('Kafka producer not initialized, skipping event publish');
      return;
    }

    const event = {
      type: eventType,
      service: config.serviceName,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    await producer.send({
      topic,
      messages: [
        {
          key: eventData.appointmentId || eventData.id || 'unknown',
          value: JSON.stringify(event),
          headers: {
            eventType: eventType,
            service: config.serviceName,
          },
        },
      ],
    });

    logger.info(`Event published: ${eventType} for appointment ${eventData.appointmentId || eventData.id}`);
  } catch (error) {
    logger.error(`Failed to publish event ${eventType}: ${error.message}`);
    // Don't throw error - event publishing failure shouldn't break the service
  }
};

/**
 * Shutdown Kafka producer
 */
const shutdownProducer = async () => {
  try {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  } catch (error) {
    logger.error(`Error disconnecting Kafka producer: ${error.message}`);
  }
};

module.exports = {
  initializeProducer,
  publishEvent,
  shutdownProducer,
  EVENT_TYPES,
};

