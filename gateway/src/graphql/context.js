const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Create GraphQL context
 * Extracts user from JWT token and add to context
 */
const createContext = async ({ req }) => {
    const context = {
        correlationId: req.correlationId,
        user: null
    };

    try {
        const authHeader = req.headers.authorization || '';
        const token = extractTokenFromHeader(authHeader);
        if(token){
            const decoded = verifyAccessToken(token);
            context.user = {
                userId: decoded.userId,
                email: decoded.email,
                roles: decoded.roles
            }
        }
    } catch (error) {
        // Token verification failed - user will be null
        logger.debug('GraphQL context: Token verification failed', {
            correlationId: req.correlationId,
            error: error.message
        });
    }
    return context;
}

module.exports = createContext;