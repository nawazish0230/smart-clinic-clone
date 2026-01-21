const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { createCircuitBreaker, executeWithCircuitBreaker } = require('./circuitBreaker');
const { ServiceUnavailableError, TimeoutError } = require('../utils/errors');


/**
 * Service client with circuit breaker and timeout handling
 */
class ServiceClient {
    constructor(serviceName, serviceConfig) {
        this.serviceName = serviceName;
        this.baseURL = serviceConfig.url;
        this.timeout = serviceConfig.timeout || config.requestTimeout;
        this.healthCheck = serviceConfig.healthCheck;

        // Create circuit breaker for this service
        this.circuitBreaker = createCircuitBreaker(serviceName, {
            timeout: serviceConfig.timeout
        });

        // Create axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor for correlation ID
        this.client.interceptors.request.use((config) => {
            if (config.metadata?.correlationId) {
                config.headers['X-Correlation-ID'] = config.metadata.correlationId;
            }
            return config;
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`Service call successful: ${serviceName}`, {
                    service: serviceName,
                    method: response.config.method,
                    url: response.config.url,
                    status: response.status,
                    correlationId: response.config.headers['X-Correlation-ID']
                });
                return response;
            }
        );
    }

    /**
     * Make HTTP request with circuit breaker and timeout handling
     */
    async request(method, path, data = null, options = {}) {
        const requestConfig = {
            method,
            url: path,
            data,
            metadata: {
                correlationId: options.correlationId || null
            },
        };

        const executeRequest = async () => {
            try {
                const response = await this.client(requestConfig);
                return response.data;
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    throw new TimeoutError(`Request to ${this.serviceName} timed out`)
                }
                if (error.response) {
                    // Service responded with error status
                    throw error;
                }
                // Network error or service unavailble
                throw new ServiceUnavailableError(`Service ${this.serviceName} is unavailable`);
            }
        };
        return await executeWithCircuitBreaker(this.circuitBreaker, executeRequest);
    }

    /**
     * Get request
     */
    async get(path, options = {}) {
        return this.request('GET', path, null, options);
    }

    /**
     * POST request
     */
    async post(path, data, options = {}) {
        return this.request('POST', path, data, options);
    }

    /**
     * PUT request
     */
    async put(path, data, options = {}) {
        return this.request('PUT', path, data, options);
    }

    /**
     * DELETE request
     */
    async delete(path, options = {}) {
        return this.request('DELETE', path, null, options);
    }

    /**
     * PATCH request
     */
    async patch(path, data, options = {}) {
        return this.request('PATCH', path, data, options);
    }

    /**
     * Check service health
     */
    async healthCheck() {
        try {
            const response = await this.client.get(this.healthCheck, {
                timeout: 3000
            });
            return response.status === 200;
        } catch (error) {
            logger.warn(`Health check failed for service: ${this.serviceName}`, {
                service: this.serviceName,
                error: error.message
            })
            return false;
        }
    }
}


/**
 * Create Service clients for all services
 */
const createServiceClients = () => {
    const clients = {};

    Object.keys(config.services).forEach((serviceName) => {
        clients[serviceName] = new ServiceClient(serviceName, config.services[serviceName]);
    });
    return clients;
};

module.exports = {
    ServiceClient,
    createServiceClients
}