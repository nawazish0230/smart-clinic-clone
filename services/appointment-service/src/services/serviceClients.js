const axios = require('axios');
const config = require('../config');
const logger = require('./logger');
const { createCircuitBreaker, executeWithCircuitBreaker } = require('../utils/circuitBreaker');
const { ServiceUnavailableError, TimeoutError } = require('../utils/errors');

/**
 * Service client with circuit breaker and timeout
 */
class ServiceClient {
  constructor(serviceName, serviceUrl, timeout) {
    this.serviceName = serviceName;
    this.baseURL = serviceUrl;
    this.timeout = timeout;

    // Create circuit breaker for this service
    this.circuitBreaker = createCircuitBreaker(serviceName, { timeout });

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for correlation ID
    this.client.interceptors.request.use((requestConfig) => {
      if (requestConfig.metadata?.correlationId) {
        requestConfig.headers['X-Correlation-ID'] = requestConfig.metadata.correlationId;
      }
      return requestConfig;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Service call successful: ${serviceName}`, {
          service: serviceName,
          method: response.config.method,
          url: response.config.url,
          status: response.status,
        });
        return response;
      },
      (error) => {
        logger.error(`Service call failed: ${serviceName}`, {
          service: serviceName,
          method: error.config?.method,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make HTTP request with circuit breaker
   */
  async request(method, path, data = null, options = {}) {
    const requestConfig = {
      method,
      url: path,
      data,
      metadata: {
        correlationId: options.correlationId,
      },
    };

    const executeRequest = async () => {
      try {
        const response = await this.client.request(requestConfig);
        return response.data;
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          throw new TimeoutError(`Request to ${this.serviceName} timed out`);
        }
        if (error.response) {
          // Service responded with error status
          throw error;
        }
        // Network error or service unavailable
        throw new ServiceUnavailableError(this.serviceName);
      }
    };

    return await executeWithCircuitBreaker(this.circuitBreaker, executeRequest);
  }

  /**
   * GET request
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
   * PATCH request
   */
  async patch(path, data, options = {}) {
    return this.request('PATCH', path, data, options);
  }

  /**
   * DELETE request
   */
  async delete(path, options = {}) {
    return this.request('DELETE', path, null, options);
  }
}

/**
 * Create service clients for all external services
 */
const createServiceClients = () => {
  return {
    patient: new ServiceClient(
      'patient-service',
      config.patientServiceUrl,
      config.patientServiceTimeout
    ),
    doctor: new ServiceClient(
      'doctor-service',
      config.doctorServiceUrl,
      config.doctorServiceTimeout
    )
  };
};

module.exports = {
  ServiceClient,
  createServiceClients,
};

