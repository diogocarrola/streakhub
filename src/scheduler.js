const { getContributionCalendar } = require('./githubService');
const cache = require('./cache');

// Track which users have active widgets (simple in-memory set for now)
const activeUsers = new Set();

// Mark a user as having an active widget
function markUserActive(username) {
  activeUsers.add(username);
}

// Poll contributions for active users every 30 minutes
async function schedulePollHotUsers() {
  const pollIntervalMs = 30 * 60 * 1000; // 30 minutes

  setInterval(async () => {
    if (activeUsers.size === 0) return;

    console.log(`[Scheduler] Polling ${activeUsers.size} active users for fresh data`);

    const pollPromises = Array.from(activeUsers).map(async (username) => {
      try {
        // Fetch fresh data from GitHub
        const days = await getContributionCalendar(username);

        // Store in a "raw data" cache with longer TTL (so widgets can use it)
        const cacheKey = `contributions:${username}`;
        await cache.set(cacheKey, days, 60 * 30); // 30 min TTL

        // Invalidate all widget SVG caches for this user (force regeneration)
        await invalidateWidgetCache(username);

        console.log(`[Scheduler] Updated contributions for @${username}`);
      } catch (error) {
        console.error(`[Scheduler] Failed to poll @${username}:`, error.message);
      }
    });

    await Promise.all(pollPromises);
  }, pollIntervalMs);

  console.log('[Scheduler] Hot user polling started (every 30 minutes)');
}

// Invalidate all widget SVGs for a user
async function invalidateWidgetCache(username) {
  const themes = ['duolingo', 'dark', 'neon', 'minimal'];
  const graces = [0, 1, 2];
  const timezones = ['UTC', 'Americas/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

  const invalidatePromises = [];
  for (const theme of themes) {
    for (const grace of graces) {
      for (const tz of timezones) {
        const key = `widget:${username}:${theme}:grace:${grace}:tz:${tz}`;
        invalidatePromises.push(cache.delete(key).catch(() => {}));
      }
    }
  }

  await Promise.all(invalidatePromises);
}

module.exports = { schedulePollHotUsers, markUserActive };
