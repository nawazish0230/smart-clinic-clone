const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');
require('dotenv').config();

const config = require('./config');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');

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

        // start listening
        const PORT = config.port;
        app.listen(PORT, () => {
            logger.info(`patient service running on port ${PORT}`);
            logger.info(`Environment: ${config.nodeEnv}`);
            
        })
    }catch(error){
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;