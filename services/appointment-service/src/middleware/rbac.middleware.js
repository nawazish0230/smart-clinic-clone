const { AuthorizationError } = require('../utils/errors');

/**
 * Role-Based Access Control middleware
 * @param {Array} allowedRoles - Array of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles || [];
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or has admin role
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('admin');

    // If admin, allow access
    if (isAdmin) {
      return next();
    }

    // Check if user owns the resource
    // This assumes the resource has been loaded and attached to req
    if (req.resource && req.resource[resourceUserIdField] === req.user.userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.',
    });
  };
};

module.exports = {
  authorize,
  authorizeOwnerOrAdmin,
};

