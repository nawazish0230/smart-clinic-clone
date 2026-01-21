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

// Event types
const EVENT_TYPES = {
  DOCTOR_CREATED: 'DoctorCreated',
  DOCTOR_UPDATED: 'DoctorUpdated',
  DOCTOR_DELETED: 'DoctorDeleted',
  SCHEDULE_UPDATED: 'ScheduleUpdated',
  SCHEDULE_SLOT_ADDED: 'ScheduleSlotAdded',
  SCHEDULE_SLOT_REMOVED: 'ScheduleSlotRemoved',
  DOCTOR_UNAVAILABLE: 'DoctorUnavailable',
  DOCTOR_AVAILABLE: 'DoctorAvailable',
  SPECIALIZATION_ADDED: 'SpecializationAdded',
  SPECIALIZATION_REMOVED: 'SpecializationRemoved',
};

/**
 * Initialize Kafka producer
 */
const initializeProducer = async () => {
  try {
    await producer.connect();
    logger.info('✅ Kafka producer connected');
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
 */
const publishEvent = async (eventType, eventData) => {
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
      topic: 'doctor-events',
      messages: [
        {
          key: eventData.doctorId || eventData.id || 'unknown',
          value: JSON.stringify(event),
          headers: {
            eventType: eventType,
            service: config.serviceName,
          },
        },
      ],
    });

    logger.info(`Event published: ${eventType} for doctor ${eventData.doctorId || eventData.id}`);
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

