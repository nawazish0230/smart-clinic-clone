const {AuthorizationError} = require('../utils/errors');
const {USER_ROLES} = require('../models/User');


/***
 * RBAC middleware - Check if user has required roles
 * @param {Array} requiredRoles - Array of roles required to access the route
 * @returns Middleware function
 * 
 */
const requiredRole = (...roles) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({
                error: true,
                message: 'Authentication required'
            })
        }

        const userRoles = req.user.roles || [];
        const hasRole = roles.some((role) => userRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You do not have the required role to access this resource',
                required: roles,
                current: userRoles
            });
        }
        next();
    }
}



/**
 * RBAC middleare - check if user has any of the required roles
 * @param {Array} requiredRoles - Array of roles required to access the route
 * @returns Middleware function
 */
const requiredAnyRole = (...roles) => {
    return requiredRole(...roles);
}


/**
 * RBAC middleare - check if user has all of the required roles
 * @param {Array} requiredRoles - Array of roles required to access the route
 * @returns Middleware function
 */
const requiredAllRoles = (...roles) => {
    return (req, res, next) => {
        if(!req.user){
            return res.status(401).json({
                error: true,
                message: 'Authentication required'
            })
        }

        const userRoles = req.user.roles || [];
        const hasAllRoles = roles.every((role) => userRoles.includes(role));

        if (!hasAllRoles) {
            return res.status(403).json({
                error: true,
                message: 'Forbidden: You do not have all the required roles to access this resource',
                required: roles,
                current: userRoles
            });
        }
        next();
    }
}



/***
 * Predefined middleare for common roles
 */
const requiredAdmin = requiredRole(USER_ROLES.ADMIN);
const requiredDoctor = requiredRole(USER_ROLES.DOCTOR, USER_ROLES.CLINICIAN);
const requiredClinician = requiredRole(USER_ROLES.ADMIN, USER_ROLES.DOCTOR,  USER_ROLES.CLINICIAN);
const requiredPatient = requiredRole(USER_ROLES.PATIENT);

module.exports = {
    requiredRole,
    requiredAnyRole,
    requiredAllRoles,
    requiredAdmin,
    requiredDoctor,
    requiredClinician,
    requiredPatient
}