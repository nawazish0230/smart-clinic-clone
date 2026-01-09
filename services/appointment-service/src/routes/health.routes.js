const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'appointment-service',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness check endpoint
 */
router.get('/ready', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    const isReady = mongoState === 1; // 1 = connected

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        service: 'appointment-service',
        checks: {
          mongodb: 'connected',
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'appointment-service',
        checks: {
          mongodb: 'disconnected',
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'appointment-service',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness check endpoint
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    service: 'appointment-service',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

