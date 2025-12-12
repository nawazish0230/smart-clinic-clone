const { validateToken, extractTokenFromHeader } = require('../utils/auth');
/**
 * Create GraphQL context with autenticated user
 */
const createContext = async ({ req }) => {
    try {
        const authHeader = req.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const user = await validateToken(token);
            return {
                user: {
                    userId: user.id,
                    email: user.email,
                    roles: user.roles
                }
            }
        }
        return { user: null }
    } catch (err) {
        return { user: null }
    }
}

module.exports = createContext;