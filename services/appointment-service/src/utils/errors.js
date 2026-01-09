/**
 * Custom error classes for appointment service
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied. Insufficient permissions.') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(serviceName = 'Service') {
    super(`${serviceName} is currently unavailable`, 503);
    this.name = 'ServiceUnavailableError';
  }
}

class SagaError extends AppError {
  constructor(message, compensationData = null) {
    super(message, 500);
    this.name = 'SagaError';
    this.compensationData = compensationData;
  }
}

class TimeoutError extends AppError {
  constructor(message = 'Request timeout') {
    super(message, 504);
    this.name = 'TimeoutError';
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
  SagaError,
  TimeoutError,
};

