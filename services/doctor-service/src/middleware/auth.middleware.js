const { validateToken, extractTokenFromHeader } = require('../utils/auth');
const { AuthenticationError } = require('../utils/errors');

/**
 * Authentication middleware - Validates JWT token with Auth Service
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    // Validate token with Auth Service
    const user = await validateToken(token);

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};

/**
 * Optional authentication - Doesn't fail if no token provided
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const user = await validateToken(token);
      req.user = {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};

