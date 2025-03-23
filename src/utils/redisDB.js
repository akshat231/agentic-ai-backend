const Redis = require('ioredis');
const logger = require('./logger');

// Connect to Redis running on localhost:6379
const redis = new Redis(); 

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});

module.exports = redis;
