const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');
require('dotenv').config();

// config and logger
const config = require('./config');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

// kafka import
const {initializeProducer, shutdownProducer} = require('./utils/eventProducer');

// import routes
const patientRoutes = require('./routes/patient.routes');
const healthRoutes = require('./routes/health.routes');

// import middleware
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// create express app
const app = express();

// security middleare
app.use(helmet());
app.use(cors());

// body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/health', healthRoutes);   
app.use('/api/patients', patientRoutes);

// handle 404 errors
//app.use(notFound);

// error handler (must be last)
//app.use(errorHandler);

// start server
const startServer = async () => {
    try{
        // connect to database
        await connectDatabase();

        // Initialize Kafka producer (Event-Driven)
        await initializeProducer();

        // start listening
        const PORT = config.port;
        app.listen(PORT, () => {
            logger.info(`patient service running on port ${PORT}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            logger.info(`Kafka: ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
            
        })
    }catch(error){
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await shutdownProducer();
    process.exit(0);
})

// handle unhandled promise rejection
process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    process.exit(1);
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
})

// start the server
startServer();
module.exports = app;