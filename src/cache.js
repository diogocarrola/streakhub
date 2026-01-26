// Simple cache module with in-memory fallback and optional Redis support
// Exports: get(key), set(key, value, ttlSeconds)

const DEFAULT_TTL = 60 * 60; // 1 hour

let redisClient = null;
try {
  const redis = require('redis');
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(() => {
      // connection errors handled gracefully; we'll fallback to memory
      redisClient = null;
    });
  }
} catch (err) {
  // redis not installed or unavailable; continue with in-memory cache
  redisClient = null;
}

const memoryCache = new Map();

function setMemory(key, value, ttlSeconds = DEFAULT_TTL) {
  const expires = Date.now() + ttlSeconds * 1000;
  memoryCache.set(key, { value, expires });
}

function getMemory(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSeconds = DEFAULT_TTL) {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch (err) {
      // ignore and fallback
    }
  }
  setMemory(key, value, ttlSeconds);
}

async function get(key) {
  if (redisClient) {
    try {
      const r = await redisClient.get(key);
      if (r) return JSON.parse(r);
    } catch (err) {
      // fallback
    }
  }
  return getMemory(key);
}

async function deleteKey(key) {
  if (redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      // fallback
    }
  }
  memoryCache.delete(key);
}

module.exports = { get, set, delete: deleteKey };
