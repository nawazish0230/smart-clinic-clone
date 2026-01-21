const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt'); 
const {AuthenticationError} = require('../utils/errors');

/**
 * Authentication middleware - Verify JWT access token
 */
const authenticate = (req, res, next) => {
    try{
        // Extract token from authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if(!token){
            throw new AuthenticationError('No token provided');
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attact user info to request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            roles: decoded.roles
        }

        next();
    }catch(error){
        if(error instanceof AuthenticationError || error.message.includes('token')){
            return res.status(401).json({
                error: false,
                message: error.message
            });
        }
        next(error);
    }
}

module.exports = {
    authenticate
};