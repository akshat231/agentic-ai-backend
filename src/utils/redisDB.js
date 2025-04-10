const Redis = require('ioredis');
const logger = require('./logger');

// Use environment variable or fallback for local dev
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

module.exports = redis;
