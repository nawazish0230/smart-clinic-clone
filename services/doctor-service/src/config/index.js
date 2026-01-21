require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'doctor-service',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_db',

  // Auth Service (for token validation)
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',

  // Kafka
  kafkaBrokers: process.env.KAFKA_BROKERS || 'localhost:9092',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

