/**
 * RBAC Middleware - Check if user has required role(s)
 * @param {...String} roles - Required roles
 * @returns {Function} Express middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: userRoles,
      });
    }

    next();
  };
};

/**
 * Require doctor or admin role
 */
const requireDoctorOrAdmin = requireRole('doctor', 'admin');

/**
 * Require clinician or admin role (healthcare providers only)
 */
const requireClinician = requireRole('doctor', 'clinician', 'admin');

/**
 * Require admin role
 */
const requireAdmin = requireRole('admin');

module.exports = {
  requireRole,
  requireDoctorOrAdmin,
  requireClinician,
  requireAdmin,
};

