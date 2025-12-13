const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/***
 * General rate limiter for all API requests
 */
const generalRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // e.g., 15 minutes
    max: config.rateLimit.max, // e.g., 100 requests per windowMs
    message: {
        success: false,
        message: config.rateLimit.message,
    },
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            path: req.path
        }),
        res.status(429).json({
            success: false,
            message: config.rateLimit.message,
            correlationId: req.correlationId
        });
    }
})

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brure force attacks on login/register routes
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // e.g., 15 minutes
    max: 5, // e.g., 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again later.',
    },
   skipSuccessfulRequests: true, // Only count failed requests
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            path: req.path
        }),
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again 15 mints.',
            correlationId: req.correlationId
        });
    }
})



/**
 * GraphQL rate limiter
 * more lenient to allow complex queries/mutations
 */
const qraphqlRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // e.g., 15 minutes
    max: config.rateLimit.max * 5, // allow more request for Graphql
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    handler: (req, res) => {
        logger.warn('GraphQL rate limit exceeded', {
            correlationId: req.correlationId,
            ip: req.ip,
            path: req.path
        }),
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            correlationId: req.correlationId
        });
    }
})

module.exports = {
    generalRateLimiter,
    authRateLimiter,
    qraphqlRateLimiter
};