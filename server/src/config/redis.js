const { createClient } = require('redis');
const { logger } = require('../utils/logger');

const redisUrl = process.env.REDIS_URL;
let redisClient = null;
let isReady = false;

if (redisUrl && redisUrl.trim()) {
  try {
    redisClient = createClient({
      url: redisUrl.trim(),
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn(`Redis reconnection limit reached (${retries} attempts). Retrying every 10s...`);
            return 10000;
          }
          const delay = Math.min(retries * 500, 3000);
          return delay;
        },
        connectTimeout: 5000,
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      isReady = true;
      logger.success('Redis connected & ready for caching');
    });

    redisClient.on('reconnecting', () => {
      isReady = false;
      logger.info('Redis reconnecting...');
    });

    redisClient.on('end', () => {
      isReady = false;
      logger.warn('Redis connection closed');
    });

    redisClient.on('error', (err) => {
      isReady = false;
      logger.warn(`Redis notice: ${err.message || err}`);
    });

    // Initiate non-blocking connection
    redisClient.connect().catch((err) => {
      isReady = false;
      logger.warn(`Redis initial connection failed (${err.message}). Caching disabled, falling back to Supabase.`);
    });
  } catch (err) {
    logger.warn(`Failed to initialize Redis client (${err.message}). Caching disabled.`);
    redisClient = null;
    isReady = false;
  }
} else {
  logger.info('REDIS_URL not configured. Redis caching disabled — using Supabase directly.');
}

function isRedisAvailable() {
  return Boolean(redisClient && isReady && redisClient.isOpen);
}

module.exports = {
  redisClient,
  isRedisAvailable,
};
