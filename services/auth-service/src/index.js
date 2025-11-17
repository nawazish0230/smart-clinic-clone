// import module
const express = require('express');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

// connect with dataabase
const connectDatabase = require('./config/database');


// initialize the express app
const app = express();

// middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// import auth routes
const authRoutes = require('./routes/auth.route');

// use auth routes
app.use('/api/auth', authRoutes);

// 404 not found handler
app.use(notFoundHandler);

// global error handler
app.use(errorHandler);

// start the server
const startServer = async () => {
    try{
        // connect to database
        await connectDatabase();

        // start listing
        const PORT = config.port;
        app.listen(PORT, () => {
            logger.info(`${config.serviceName} is running on port ${PORT}`);
        })
    }catch(error){
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1)
    }
}

// handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error(`Unhandled Promise Rejection: ${error.message}`);
    process.exit(1);
});

// handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});


// statt the server
startServer();
