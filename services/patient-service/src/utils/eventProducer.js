const { Kafka } = require('kafkajs');
const logger = require('./logger');
const config = require('../config');

// kafka client configuration
const kafka = new Kafka({
    clientId: config.serviceName,
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
})

// Create producer
const producer = kafka.producer();

// Event types
const EVENT_TYPES = {
    PATIENT_CREATED: 'PATIENT_CREATED',
    PATIENT_UPDATED: 'PATIENT_UPDATED',
    PATIENT_DELETED: 'PATIENT_DELETED',
    MEDICAL_HISTRORY_ADDED: 'MEDICAL_HISTORY_ADDED',
    ALLERGY_ADDED: 'ALLERGY_ADDED',
    MEDICATION_ADDED: 'MEDICATION_ADDED'
}

/**
 * Initialize Kafka producer
 */
const initializeProducer = async () => {
    try {
        await producer.connect();
        logger.info('Kafka Producer connected');
    } catch (error) {
        logger.error(`Failed to connect Kafka Producer: ${error.message}`);
        // Dont fail servicve startup if kafka is unavailable
        // service can still function without event publishing
    }
};

/**
 * Publish event to Kafka
 * @params {String} eventType - Type of event
 * @params {Object} eventData - Data associated with the event
 */
const publishEvent = async (eventType, eventData) => {
    try {
        if (!producer) {
            logger.warn('Kafka Producer is not initialized, skipping event publish');
            return;
        }

        const event = {
            type: eventType,
            service: config.serviceName,
            timestamp: new Date().toISOString(),
            data: eventData
        };

        await producer.send({
            topic: 'patient-events',
            messages: [
                {
                    key: eventData.patientId || eventData.id || 'unknown',
                    value: JSON.stringify(event),
                    headers: {
                        eventType: eventType,
                        service: config.serviceName
                    },
                },
            ]
        });

        logger.info(`Event published: ${eventType} for patientId: ${eventData.patientId || eventData.id || 'unknown'}`);

    } catch (error) {
        logger.error(`Failed to publish event ${eventType}: ${error.message}`);
    }
}

/**
 * Shutdown Kafka producer
 */
const shutdownProducer = async () => {
    try {
        await producer.disconnect();
        logger.info('Kafka Producer disconnected');
    } catch (error) {
        logger.error(`Failed to disconnect Kafka Producer: ${error.message}`);
    }
}

module.exports = {
    initializeProducer,
    publishEvent,
    shutdownProducer,
    EVENT_TYPES
}