const { validateToken, extractTokenFromHeader } = require('../utils/auth')
const { AuthenticationError } = require('../utils/errors')

/**
 * Authentication middleware - Validates JWT token with Auth service
 */
const authenticate = async (req, res, next) => {
    try{
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader)

        if(!token){
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            })
        }

        // validate token with Auth service 
        const user = await validateToken(token)

        // attach the user info to request object
        req.user = {
            userId: user.id,
            email: user.email,
            roles: user.roles
        };
        next()
    }catch(error){
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token'
        })
    }
}