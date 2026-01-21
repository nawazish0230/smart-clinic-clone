const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError } = require('./errors');


/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}

/**
 * Verify JWT token access
 */

const verifyAccessToken = (token) => {
    try {
        const decode = jwt.verify(token, config.jwtSecret)
        return decode;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AuthenticationError('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AuthenticationError('Invalid token');
        }
        throw new AuthenticationError('Token verification failed');
    }
}


/**
 * Decode token without verification (for debugging)
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token)
    } catch (error) {
        return null;
    }
}


module.exports = {
    extractTokenFromHeader,
    verifyAccessToken,
    decodeToken
}   