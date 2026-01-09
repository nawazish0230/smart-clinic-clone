const { validateToken, extractTokenFromHeader } = require('../utils/auth');

/**
 * Create GraphQL context
 */
const createContext = async ({ req }) => {
  const context = {
    req,
    correlationId: req.headers['x-correlation-id'] || null,
  };

  // Extract and validate token if provided
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const user = await validateToken(token);
      context.user = {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      };
    } catch (error) {
      // If token is invalid, context.user will be undefined
      // Resolvers will handle authentication errors
    }
  }

  return context;
};

module.exports = createContext;

