const CircuitBreaker = require('opossum');
const config = require('../config');
const logger = require('./logger');

/**
 * Create a circuit breaker for a service
 */
const createCircuitBreaker = (serviceName, options = {}) => {
  const defaultOptions = {
    timeout: options.timeout || config.circuitBreaker.timeout,
    errorThresholdPercentage: options.errorThresholdPercentage || config.circuitBreaker.errorThresholdPercentage,
    resetTimeout: options.resetTimeout || config.circuitBreaker.resetTimeout,
    enabled: config.circuitBreaker.enabled,
  };

  const breaker = new CircuitBreaker(async (fn, ...args) => {
    return await fn(...args);
  }, defaultOptions);

  // Event handlers
  breaker.on('open', () => {
    logger.warn(`Circuit breaker opened for ${serviceName}`, {
      service: serviceName,
      state: 'open',
    });
  });

  breaker.on('halfOpen', () => {
    logger.info(`Circuit breaker half-open for ${serviceName}`, {
      service: serviceName,
      state: 'halfOpen',
    });
  });

  breaker.on('close', () => {
    logger.info(`Circuit breaker closed for ${serviceName}`, {
      service: serviceName,
      state: 'close',
    });
  });

  breaker.on('failure', (error) => {
    logger.error(`Circuit breaker failure for ${serviceName}`, {
      service: serviceName,
      error: error.message,
    });
  });

  return breaker;
};

/**
 * Execute function with circuit breaker
 */
const executeWithCircuitBreaker = async (breaker, fn, ...args) => {
  try {
    if (!config.circuitBreaker.enabled) {
      return await fn(...args);
    }

    return await breaker.fire(fn, ...args);
  } catch (error) {
    if (error.name === 'CircuitBreakerOpenError') {
      throw new Error(`Service unavailable: Circuit breaker is open`);
    }
    throw error;
  }
};

module.exports = {
  createCircuitBreaker,
  executeWithCircuitBreaker,
};

