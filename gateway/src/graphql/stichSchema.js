const { stitchSchemas } = require('@graphql-tools/stitch');
const { introspectSchema, wrapSchema } = require('@graphql-tools/wrap');
const { print } = require('graphql');
const fetch = require('cross-fetch');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Create executor for remote GraphQL service
 */
const createExecutor = (serviceUrl, graphqlEndpoint) => {
    return async ({ document, variables, context }) => {
        const query = print(document);
        const headers = {
            'Content-Type': 'application/json',
        };

        // Forward authorization header
        if (context?.req?.headers?.authorization) {
            headers['Authorization'] = context.req.headers.authorization;
        }

        // Forward correlation ID 
        if (context?.correlationId) {
            headers['X-Correlation-ID'] = context.correlationId;
        }

        try {
            const response = await fetch(`${serviceUrl}${graphqlEndpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, variables })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            logger.error('GraphQL executor error', {
                serviceUrl,
                error: error.message
            });
            throw error;
        }
    }
}

/**
 * Stitch remote GraphQL schemas from services
 *  - Discover which service expose GraphQL
 * - Introspect them dynamically
 * - Wrap them with executors
 * - Stitch them into one unified schema
 * - never crash the gateway if a service is down
 */
const stitchRemoteSchemas = async () => {
    const serviceSubSchemas = [];

    try {
        // Patient Service GraphQl Schema
        if (config.services.patient.url && config.services.patient.graphqlEndpoint) {
            try {
                const executor = createExecutor(
                    config.services.patient.url,
                    config.services.patient.graphqlEndpoint
                );
                const schema = await introspectSchema(executor);
                const patientSubSchema = wrapSchema({
                    schema,
                    executor
                })

                serviceSubSchemas.push(patientSubSchema);
                logger.info('Patient Service GraphQL schema stitched successfully');
            } catch (error) {
                logger.error('Failed to stitch Patient Service GraphQL schema', {
                    error: error.message
                });
            }
        }
        // Add more services as they implement GraphQl
        // Example for Appoinmtment Service
        // if(config.services.appointmentUrl) {....}

        // Stitch all schemas together
        if (serviceSubSchemas.length > 0) {
            const stitchedSchema = stitchSchemas({
                subschemas: serviceSubSchemas
            });

            logger.info(`Successfully stitched ${serviceSubSchemas.length} GraphQl Schema(s)`);
            return stitchedSchema;
        }
        logger.warn('No remote GraphQL schemas stitched');
        return null;
    } catch (error) {
        logger.error('Error during stitching remote GraphQL schemas', {
            error: error.message
        });
        return null;
    }
}

module.exports = {
    stitchRemoteSchemas
};