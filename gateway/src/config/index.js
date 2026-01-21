const { parse } = require('dotenv');
const CircuitBreaker = require('opossum');

require('dotenv').config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'api-gateway',

    // Service URLs (Service Discovery - can be replace with Consul/Kubernetes)
    services: {
        auth: {
            url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
            timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT, 10) || 5000,
            healthCheck: '/health'
        },
        patient: {
            url: process.env.PATIENT_SERVICE_URL || 'http://localhost:3002',
            timeout: parseInt(process.env.PATIENT_SERVICE_TIMEOUT, 10) || 5000,
            healthCheck: '/health'
        }
    },

    // Security
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtPublicKey: process.env.JWT_PUBLIC_KEY, // For RS256 (optional)

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    },

    // Circuit Breaker
    circuitBreaker: {
        timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 3000, // If our function takes longer than 3 seconds, trigger a failure
        errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 50, // When 50% of requests fail, trip the circuit
        resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000, // After 30 seconds, try again.
        enabled: process.env.CIRCUIT_BREAKER_ENABLED !== 'false' // Enable or disable circuit breaker
    },

    // Caching
    cache: {
        ttl: parseInt(process.env.CACHE_TTL) || 300, // Cache Time-To-Live in seconds (5 minutes)
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600, // Check period in seconds (10 minutes)
        enabled: process.env.CACHE_ENABLED !== 'false' // Enable or disable caching
    },

    // GraphQL
    graphql: {
        introspection: process.env.GRAPHQL_INTROSPECTION !== 'false', // Enable or disable introspection
        playground: process.env.GRAPHQL_PLAYGROUND !== 'false' && process.env.NODE_ENV !== 'production', // Enable or disable playground
        queryDepthLimit: parseInt(process.env.GRAPHQL_QUERY_DEPTH_LIMIT) || 10, // Max query depth
        queryComplexityLimit: parseInt(process.env.GRAPHQL_QUERY_COMPLEXITY_LIMIT) || 1000 // Max query complexity
    },


    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'json', // json or simple


    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || '*', // Allow all origins by default
        credentials: process.env.CORS_CREDENTIALS === 'true' // Allow credentials
    },


    // Request Timeout
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000 // 30 seconds
}