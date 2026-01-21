const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Appointment Service API',
      version: '1.0.0',
      description: 'Appointment Management Service API Documentation',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3003',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            patientId: { type: 'string' },
            patientName: { type: 'string' },
            doctorId: { type: 'string' },
            doctorName: { type: 'string' },
            appointmentDate: { type: 'string', format: 'date' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            duration: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'],
            },
            type: {
              type: 'string',
              enum: ['consultation', 'follow_up', 'checkup', 'emergency', 'surgery', 'other'],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

