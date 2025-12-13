const { getCorrelationId, setCorrerlationId } = require('../utils/correlationId');

/***
 * Middleware to add correlation ID to each request and response
 * Ensure all requests have a unique correlation ID for distributed tracing
 * 
 */
const correlationIdMiddleware = (req, res, next) => {
    const correlationId = getCorrelationId(req);

    // Attach to request object for use on controller/services
    req.correlationId = correlationId;

    // Set in response headers
    setCorrerlationId(res, correlationId);
    
    next();
}

module.exports = correlationIdMiddleware;