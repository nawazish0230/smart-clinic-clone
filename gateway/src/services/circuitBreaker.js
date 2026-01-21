const CircuitBreaker = require('opossum');
const config = requie('../config');
const logger = require('../utils/logger');
const { CircuitBreakerOpneError } = require('../utils/errors');
const { serviceName, requestTimeout } = require('../config');
const { error } = require('winston');

/**
 * Create a circuit breaker for a service
 */
const createCircuitBreaker = (serviceName, options = {}) => {
    const defaultOptions = {
        timeout: options.timeout || config.circuitBreaker.timeout,
        errorThresholdPercentage: options.errorThresholdPercentage || config.circuitBreaker.errorThresholdPercentage,
        requestTimeout: options.requestTimeout || config.circuitBreaker.requestTimeout,
        enabled: config.circuitBreaker.enabled
    };

    const breaker = new CircuitBreaker(async (fn, ...args) => {
        return await fn(...args);
    }, defaultOptions);

    // Event handler
    breaker.on('open', () => {
        logger.warn(`Circuit breaker opened for service: ${serviceName}`,{
            serviceName: serviceName,
            state: 'open'
        });
    });

     breaker.on('halfOpen', () => {
        logger.warn(`Circuit breaker half-open for service: ${serviceName}`,{
            serviceName: serviceName,
            state: 'halfOpen'
        });
    });

     breaker.on('close', () => {
        logger.warn(`Circuit breaker closed for service: ${serviceName}`,{
            serviceName: serviceName,
            state: 'close'
        });
    });

     breaker.on('failure', (error) => {
        logger.warn(`Circuit breaker failure for service: ${serviceName}`,{
            serviceName: serviceName,
            error: error.message
        });
    });

     breaker.on('reject', () => {
        logger.warn(`Circuit breaker rejected for service: ${serviceName}`,{
            serviceName: serviceName,
            state: 'open'
        });
    });
    return breaker;
}




/***
 * Execute function with circuit breaker
 */
const executeWithCircuitBreaker = async (breaker, fn, ...args) => {
    try{
        if(!config.circuitBreaker.enabled){
            return await fn(...args);
        }
        return await breaker.fire(fn, ...args);
    }catch(error){
        if(error.name === 'CircuitBreakerOpenError'){
            throw new CircuitBreakerOpneError();
        }
        throw error;
    }
};

module.exports ={
    createCircuitBreaker,
    executeWithCircuitBreaker   
}