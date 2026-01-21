require('dotenv').config();


module.exports = {
    // Server
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    serviceName: process.env.SERVICE_NAME || 'auth-service',

    // MongoDB
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_db',

    // JWT
    jwtSecret: process.eventNames.JWT_SECRET || 'your-super-scret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefershSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-jwt-key',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Security

    // Logging
}