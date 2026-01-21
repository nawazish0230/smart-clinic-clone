const { v4: uuidv4 } = require('uuid');

/**
 * Generate correction ID for request tracking
 */
const generateCorrelationId = () => {
    return uuidv4();
}


/**
 * Get correlation Id from request hearders or generate new one
 */
const getCorrelationId = (req) => {
    return req.headers['x-correlation-id'] || req.headers['correlation-id'] || generateCorrelationId();
}

/***
 * Set correlation Id in response headers
 */
const setCorrerlationId = (res, correlationId) => {
    res.setHeader('X-Correlation-Id', correlationId);
}

module.exports = {
    generateCorrelationId,
    getCorrelationId,
    setCorrerlationId
}