const { logger } = require('../utils/logger');

// In-memory cache map
const memoryCache = new Map();

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
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

/**
 * Set cached JSON value with TTL
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds
 * @returns {Promise<boolean>}
 */
async function setCache(key, value, ttlSeconds = 60) {
  if (value === undefined) return false;
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

/**
 * Delete a specific cache key
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function deleteCache(key) {
  return memoryCache.delete(key);
}

/**
 * Delete all keys matching a prefix/pattern
 * @param {string} pattern
 * @returns {Promise<number>} Number of keys deleted
 */
async function deletePattern(pattern) {
  const cleanPrefix = pattern.replace(/\*/g, '');
  let count = 0;
  for (const key of memoryCache.keys()) {
    if (key.startsWith(cleanPrefix) || key.includes(cleanPrefix)) {
      memoryCache.delete(key);
      count++;
    }
  }
  return count;
}

// ==========================================
// RESIDENCY-SCOPED INVALIDATION HELPERS
// ==========================================

async function invalidateRoomsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:floors`),
    deletePattern(`residency:${residency_id}:room`),
    deletePattern(`residency:${residency_id}:dashboard`),
  ]);
}

async function invalidateFloorsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:floors`),
    deletePattern(`residency:${residency_id}:room`),
    deletePattern(`residency:${residency_id}:dashboard`),
  ]);
}

async function invalidateCategoriesCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:floors`),
    deletePattern(`residency:${residency_id}:room_categories`),
    deletePattern(`residency:${residency_id}:room`),
  ]);
}

async function invalidateBookingsCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:floors`),
    deletePattern(`residency:${residency_id}:room`),
    deletePattern(`residency:${residency_id}:dashboard`),
    deletePattern(`residency:${residency_id}:revenue`),
  ]);
}

async function invalidateCustomerSearchCache(residency_id) {
  if (!residency_id) return;
  await deletePattern(`residency:${residency_id}:customers:search`);
}

async function invalidateRevenueCache(residency_id) {
  if (!residency_id) return;
  await Promise.all([
    deletePattern(`residency:${residency_id}:revenue`),
    deletePattern(`residency:${residency_id}:dashboard`),
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
