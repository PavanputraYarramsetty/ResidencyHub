const { redisClient, isRedisAvailable } = require('../config/redis');
const { logger } = require('../utils/logger');

// Standard TTL defaults (in seconds)
const TTL = {
  ROOMS: 60,
  FLOORS: 60,
  CATEGORIES: 600,       // 10 minutes
  CUSTOMER_SEARCH: 30,  // 30 seconds
  DASHBOARD_STATS: 30,  // 30 seconds
  REVENUE: 120,         // 2 minutes
};

/**
 * Retrieve cached JSON value
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function getCache(key) {
  if (!isRedisAvailable()) return null;

  try {
    const raw = await redisClient.get(key);
    if (!raw) {
      logger.info(`Redis cache MISS: ${key}`);
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      logger.info(`Redis cache HIT: ${key}`);
      return parsed;
    } catch (parseErr) {
      logger.warn(`Redis corrupted JSON for key ${key}, removing entry.`);
      await redisClient.del(key).catch(() => {});
      return null;
    }
  } catch (err) {
    logger.warn(`Redis getCache error (${key}): ${err.message}`);
    return null;
  }
}

/**
 * Set cached JSON value with TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 * @returns {Promise<boolean>}
 */
async function setCache(key, value, ttlSeconds = 60) {
  if (!isRedisAvailable() || value === undefined) return false;

  try {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, { EX: ttlSeconds });
    logger.info(`Redis cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (err) {
    logger.warn(`Redis setCache error (${key}): ${err.message}`);
    return false;
  }
}

/**
 * Delete a specific cache key
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function deleteCache(key) {
  if (!isRedisAvailable()) return false;

  try {
    const result = await redisClient.del(key);
    if (result > 0) {
      logger.info(`Redis cache invalidated: ${key}`);
    }
    return true;
  } catch (err) {
    logger.warn(`Redis deleteCache error (${key}): ${err.message}`);
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - e.g. "residency:xxx:rooms*"
 * @returns {Promise<number>} Number of keys deleted
 */
async function deletePattern(pattern) {
  if (!isRedisAvailable()) return 0;

  try {
    const keysToDelete = [];
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keysToDelete.push(key);
    }

    if (keysToDelete.length > 0) {
      const deletedCount = await redisClient.del(keysToDelete);
      logger.info(`Redis cache invalidated pattern: ${pattern} (${deletedCount} key(s))`);
      return deletedCount;
    }

    return 0;
  } catch (err) {
    logger.warn(`Redis deletePattern error (${pattern}): ${err.message}`);
    return 0;
  }
}

// ==========================================
// RESIDENCY-SCOPED INVALIDATION HELPERS
// ==========================================

async function invalidateRoomsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:rooms*`),
    deletePattern(`residency:${residency_id}:dashboard*`),
  ]);
}

async function invalidateFloorsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:floors*`),
    deletePattern(`residency:${residency_id}:rooms*`),
    deletePattern(`residency:${residency_id}:dashboard*`),
  ]);
}

async function invalidateCategoriesCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:room_categories*`),
    deletePattern(`residency:${residency_id}:rooms*`),
  ]);
}

async function invalidateBookingsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:rooms*`),
    deletePattern(`residency:${residency_id}:dashboard*`),
    deletePattern(`residency:${residency_id}:revenue*`),
  ]);
}

async function invalidateCustomerSearchCache(residency_id) {
  if (!residency_id) return;
  await deletePattern(`residency:${residency_id}:customers:search*`);
}

async function invalidateRevenueCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:revenue*`),
    deletePattern(`residency:${residency_id}:dashboard*`),
  ]);
}

module.exports = {
  TTL,
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  invalidateRoomsCache,
  invalidateFloorsCache,
  invalidateCategoriesCache,
  invalidateBookingsCache,
  invalidateCustomerSearchCache,
  invalidateRevenueCache,
};
