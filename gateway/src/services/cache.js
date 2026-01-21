const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('../utils/logger');

/***
 * Cache service for API Gayeway
 * Used for caching service responses
 */
class CacheService {
    constructor() {
        this.cache = config.cache.enabled
            ? new NodeCache({
                stdTTL: config.cache.ttl,
                checkperiod: config.cache.checkPeriod,
                useClones: false
            }) : null;

        if (this.cache) {
            // Event handlers
            this.cache.on('set', (key, value) => {
                logger.debug('Cache set', { key });
            });

            this.cache.on('del', (key) => {
                logger.debug('Cache deleted', { key });
            });

            this.cache.on('expired', (key, value) => {
                logger.debug('Cache expired', { key });
            });
        }
    }

    /**
     * Get value from cache
     */
    get(key) {
        if (!this.cache) return null;
        return this.cache.get(key);
    }

    /**
     * Set value in cache
     */
    set(key, value, ttl = null) {
        if (!this.cache) return false;
        this.cache.set(key, value, ttl || config.cache.ttl);
    }


    /**
     * Delete value from cache
     */
    del(key) {
        if (!this.cache) return false;
        this.cache.del(key);
    }


    /**
     * clear all cache
     */
    flush() {
        if (!this.cache) return false;
        return this.cache.flushAll();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        if (!this.cache) return null;
        return this.cache.getStats();
    }

    /**
     * Generate cache key from request
     */
    generateKey(service, path, query = {}) {
        const queryString = Object.keys(query)
            .sort()
            .map((key) => `${key}=${query[key]}`)
            .join('&');
        return `${service}:${path}?${queryString ? `?${queryString}` : ''}`;
    }
}

// Singleton insdtance
const cacheService = new CacheService();

module.exports = cacheService;