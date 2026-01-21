const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/***
 * 404 Not Found handler
 */
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        correlationId: req.correlationId
    });
}

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
    // log error
    logger.error('Error occurred', {
        correlationId: req.correlationId,
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name
        },
        path: req.path,
        method: req.method,
        user: req.user ? req.user.id : 'anonymous'
    })

    // Operational error (known error)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            correlationId: req.correlationId,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }

    // GrapphQL errors
    if (err.extensions) {
        return res.status(err.extensions.code || 500).json({
            success: false,
            message: err.message,
            correlationId: req.correlationId,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        })
    }

    // unknow error - dont leak errors details in production
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;

    res.status(statusCode).json({
        success: false,
        message,
        correlationId: req.correlationId,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = {
    notFound,
    errorHandler
}