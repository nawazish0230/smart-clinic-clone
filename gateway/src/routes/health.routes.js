const express = require('express');
const router = express.Router();

const { createServiceClients } = require('../services/serviceClient');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    res.status(200).json({
        status: 'healthy',
        serice: config.serviceName,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});


/**
 * Readineess check endpoint
 * Checks if gateway is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
    try {
        // check if critical service are availble
        const serviceClients = createServiceClients();
        const criticalServices = ['auth', 'patient'];
        const healthChecks = await Promise.allSettled(
            criticalServices.map((serviceName) => {
                serviceClients[serviceName].healthCheck();
            })
        );
        const allHealthy = healthChecks.every((result) => result.status === 'fulfilled' && result.value === true);

        if (allHealthy) {
            res.status(200).json({
                status: 'ready',
                serice: config.serviceName,
                timestamp: new Date().toISOString(),
                services: {
                    auth: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
                    patient: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
                }
            })
        } else {
            res.status(503).json({
                status: 'not ready',
                service: config.serviceName,
                timestamp: new Date().toISOString(),
                services: {
                    auth: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
                    patient: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
                }
            });
        }
    } catch (error) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'not ready',
            service: config.serviceName,
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
})


/**
 * Service status endpoint
 * Return status of all services
 **/
router.get('/status', async (req, res) => {
    try {
        const serviceClients = createServiceClients();
        const services = Object.keys(config.services);
        const statusChecks = await Promise.allSettled(
            services.map(async (serviceName) => {
                const isHealthy = await serviceClients[serviceName].healthCheck();
                return {
                    name: serviceName,
                    healthy: isHealthy,
                    url: config.services[serviceName].url
                };
            })
        );
        const servicesStatus = statusChecks.map((result) => 
            result.status === 'fulfilled' ? result.value : { name: 'unknown', healthy: false });

        res.status(200).json({
            status: 'ok',
            serice: config.serviceName,
            timestamp: new Date().toISOString(),
            services: servicesStatus
        });

    } catch (error) {
        logger.error('Status check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            service: config.serviceName,
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
})

module.exports = router;