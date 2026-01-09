const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('express-async-errors');
require('dotenv').config();

const { ApolloServer } = require('apollo-server-express');
const config = require('./config');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { initializeProducer, shutdownProducer } = require('./utils/eventProducer');

// Import GraphQL
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const createContext = require('./graphql/context');

// Import routes
const doctorRoutes = require('./routes/doctor.routes');
const healthRoutes = require('./routes/health.routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Smart Clinic - Doctor Service API',
}));

// GraphQL Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  introspection: config.nodeEnv !== 'production',
  playground: config.nodeEnv !== 'production',
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/doctors', doctorRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Kafka producer (Event-Driven)
    await initializeProducer();

    // Start Apollo Server
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, path: '/graphql' });

    // Start listening
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`🚀 Doctor Service running on port ${PORT}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`📝 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🔷 GraphQL Playground: http://localhost:${PORT}/graphql`);
      logger.info(`🔗 Auth Service: ${config.authServiceUrl}`);
      logger.info(`📡 Kafka: ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await shutdownProducer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await shutdownProducer();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

