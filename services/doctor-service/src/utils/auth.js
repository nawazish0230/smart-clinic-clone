const axios = require('axios');
const config = require('../config');
const { AuthenticationError } = require('./errors');

/**
 * Validate JWT token with Auth Service
 * @param {String} token - JWT token
 * @returns {Object} Decoded user information
 */
const validateToken = async (token) => {
  try {
    const response = await axios.get(`${config.authServiceUrl}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    }

    throw new AuthenticationError('Invalid token');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new AuthenticationError('Invalid or expired token');
    }
    if (error.code === 'ECONNREFUSED') {
      throw new AuthenticationError('Auth service unavailable');
    }
    throw new AuthenticationError(error.message || 'Token validation failed');
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

module.exports = {
  validateToken,
  extractTokenFromHeader,
};

