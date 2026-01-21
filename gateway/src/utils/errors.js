/**
 * Custom Error Classes for Patient Service
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message || 'Validation Error', 400);
    }
}   

class AuthenticationError extends AppError {
    constructor(message) {
        super(message || 'Authentication Error', 401);
    }
}

class AuthorizationError extends AppError {
    constructor(message) {
        super(message || 'Authorization Error', 403);
    }
}

class NotFoundError extends AppError {
    constructor(message) {
        super(message || 'Resource Not Found', 404);
    }
}   

class ConflictError extends AppError {
    constructor(message) {
        super(message || 'Conflict Error', 409);
    }
}   

class ServiceUnavailableError extends AppError {
    constructor(message) {
        super(message || 'Service Unavailable', 503);
    }
}

class TimeoutError extends AppError {
    constructor(message) {
        super(message || 'Request Timeout', 504);
    }
}

class CircuitBreakerOpneError extends AppError {
    constructor(message) {
        super(message || 'Circuit Breaker Open', 503);
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    ServiceUnavailableError,
    TimeoutError,
    CircuitBreakerOpneError
}