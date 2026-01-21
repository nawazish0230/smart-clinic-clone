const logger = require('../utils/logger');

/***
 * Request logging middleware
 * Logs all incoming requests with correlation ID
 */

const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.http('Incoming request', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.id : 'anonymous'
    });

    // log request response when finished
    req.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? 'error': res.statusCode >= 400 ? 'warn' : 'info';

        logger[logLevel]('Request completed', {
            correlationId: req.correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            user: req.user ? req.user.id : 'anonymous'
        });
    });

    next();
}

module.exports = requestLogger;