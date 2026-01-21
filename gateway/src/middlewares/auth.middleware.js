const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const { AuthenticationError } = require('../utils/errors')
const logger = require('../utils/logger');

/***
 * Authentication middleware - Verify JWT token
 * Attaches user info to request object if token is valid
 */
const authenticate = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);
        if (!token) {
            throw new AuthenticationError('No token provided');
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            roles: decoded.roles || []
        }

        // Attach correlation ID for logging
        req.user.correlationId = req.correlationId;

        next();
    } catch (error) {
        logger.warn(`Authentication failed: ${error.message}`, {
            correlationId: req.correlationId,
            path: req.path,
        })

        if (error instanceof AuthenticationError) {
            return res.status(401).json({
                success: false,
                message: error.message,
                correlationId: req.correlationId
            });
        }
        next(error);
    }
}

/**
 * Optional authentication - Does not fail if no token provided
 * Useful for public endpoints that can work with or without auth
 * 
 */
const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);
        if (token) {
            const decoded = verifyAccessToken(token);
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                roles: decoded.roles || [],
                correlationId: req.correlationId
            }
        }
        next();
    } catch (error) {
        // if token is invalid, just continue without user
        logger.debug(`Optional authentication failed: ${error.message}`, {
            correlationId: req.correlationId,
        });
        next();
    }
};


module.exports = {
    authenticate,
    optionalAuthenticate
}