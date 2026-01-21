const { createServiceClients } = require('../services/serviceClient')
const logger = require('../utils/logger');

/**
 * GraphQL Resolvers for API Gateway
 * These resolvers will be merged with remote schemas
 */
const createResolvers = (serviceClients) => {
    return {
        Query: {
            _empty: () => null,
        },
        Mutation: {
            _empty: () => null,
        }
    }
}
module.exports = createResolvers;