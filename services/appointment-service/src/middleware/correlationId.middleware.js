const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to inject correlation ID for distributed tracing
 */
const correlationIdMiddleware = (req, res, next) => {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Attach to request
  req.correlationId = correlationId;
  
  // Add to response header
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

module.exports = correlationIdMiddleware;

