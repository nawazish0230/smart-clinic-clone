require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'appointment-service',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment_db',

  // Auth Service (for token validation)
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',

  // External Services (for Saga pattern)
  patientServiceUrl: process.env.PATIENT_SERVICE_URL || 'http://localhost:3002',
  doctorServiceUrl: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3004',

  // Service Timeouts
  patientServiceTimeout: parseInt(process.env.PATIENT_SERVICE_TIMEOUT) || 5000,
  doctorServiceTimeout: parseInt(process.env.DOCTOR_SERVICE_TIMEOUT) || 5000,
 

  // Kafka
  kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',
  kafkaConsumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'appointment-service-group',


  // Circuit Breaker
  circuitBreaker: {
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 5000,
    errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 50,
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000,
    enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

