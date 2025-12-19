const express = require('express');
const router = express.Router();

// middlewares and utilities
const config = require('../config');
const logger = require('../utils/logger');

const { createProxyMiddleware } = require('http-proxy-middleware');
const {authenticate, optionalAuthenticate} = require('../middlewares/auth.middleware')
const { generalRateLimiter, authRateLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * Proxy configuration factory
 */
const createProxyConfig = (target, pathRewrite = {}) => ({
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req) => {
        // Formward correaltion Id
        if(req.correlationId){
            proxyReq.setHeader('X-Correlation-ID', req.correlationId);
        }

        // formward user info if available
        if(req.user){
            proxyReq.setHeader('X-User-Id', req.user.userId);
            proxyReq.setHeader('X-User-Email', req.user.email);
        }

        logger.debug('Proxting request', {
            target,
            path: req.path,
            method: req.method,
            correlationId: req.correlationId,
        });
    },
    onProxyRes: (proxyRes, req) => {
        logger.debug('Proxy response received', {
            target,
            path: req.path,
            statusCode: proxyRes.statusCode,
            correlationId: req.correlationId,
        });
    },
    onError: (err, req, res) => {
        logger.error('Proxy error', {
            target,
            path: req.path,
            error: err.message,
            correlationId: req.correlationId,
        });

        res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
            correlationId: req.correlationId,
        })
    },
    timeout: config.requestTimeout
})

/**
 * Auth Service Proxy
 */
router.use('/api/auth',
    authRateLimiter, // stricter rate limiting for auth endpoints
    createProxyMiddleware(createProxyConfig(config.services.auth.url, {
        '^/api/auth': '/api/auth', // keep the path as is
    }))
 );


 /**
  * Patient Service Proxy
  */
 router.use('/api/patients',
    authenticate,  // all patient endpoints require authentication
    generalRateLimiter,
    createProxyMiddleware(createProxyConfig(config.services.patient.url, {
        '^/api/patients': '/api/patients', 
    }))
 );

 

 module.exports = router;