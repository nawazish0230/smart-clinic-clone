const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');
const { Schema } = require('mongoose');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: `${config.serviceName} API Documentation`,
            version: '1.0.0',
            description: `API documentation for ${config.serviceName}`,
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api`,
                description: 'Local server'
            },
            {
                url: `https://api.example.com/${config.serviceName}`,
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes:{
                bearerAuth:{
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
                }
            },
            screens: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User Id',
                            example: '60d0fe4f5311236168a109ca'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to the api docs
}

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;