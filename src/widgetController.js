const { getContributionCalendar } = require('./githubService');
const cache = require('./cache');
const themes = require('./themes');

// Helper: Get today's date in user's timezone (as YYYY-MM-DD string)
function getTodayStringInTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // en-CA gives YYYY-MM-DD format
}

exports.generateWidget = async (req, res) => {
  const username = req.params.username;
  const themeName = req.query.theme || 'duolingo';
  const grace = parseInt(req.query.grace || '0', 10) || 0;
  const userTimezone = req.query.tz || 'UTC'; // User's timezone; default UTC
  const cacheKey = `widget:${username}:${themeName}:grace:${grace}:tz:${userTimezone}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    return res.send(cached);
  }

  try {
    const days = await getContributionCalendar(username);

    // Get today's date in user's timezone
    const todayString = getTodayStringInTimezone(userTimezone);

    // Calculate streak backwards from today
    let streak = 0;
    let consecutiveMisses = 0;
    let todayHasCommit = false;

    // iterate backwards through days (most recent first)
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const dayDateString = day.date; // YYYY-MM-DD format

      if (dayDateString > todayString) continue; // Skip future dates

      if (dayDateString === todayString) {
        if (day.contributionCount > 0) {
          todayHasCommit = true;
          streak++;
          consecutiveMisses = 0;
        } else {
          consecutiveMisses++;
          if (consecutiveMisses > grace) break;
        }
        continue;
      }

      if (day.contributionCount > 0) {
        streak++;
        consecutiveMisses = 0;
      } else {
        consecutiveMisses++;
        if (consecutiveMisses > grace) break;
      }
    }

    const maxStreak = 1000;
    const percent = Math.min(100, Math.round((streak / maxStreak) * 100));

    const theme = themes[themeName] || themes.duolingo;
    const emoji = todayHasCommit ? '🔥' : '🥶';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="420" height="120" viewBox="0 0 420 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="120" rx="20" fill="${theme.bg}" />
        <g>
          <text x="40" y="55" font-size="32" font-family="Segoe UI, Arial, sans-serif" fill="${theme.text}" font-weight="bold">
            ${emoji} ${streak} day streak
          </text>
          <!-- progress bar background -->
          <rect x="40" y="70" width="340" height="18" rx="9" fill="#eee" />
          <!-- animated progress -->
          <rect x="40" y="70" width="0" height="18" rx="9" fill="${theme.bar}">
            <animate attributeName="width" from="0" to="${3.4 * percent}" dur="800ms" fill="freeze" />
          </rect>
          <text x="380" y="84" font-size="14" font-family="Segoe UI, Arial, sans-serif" fill="#888">${percent}%</text>
          <text x="40" y="105" font-size="14" font-family="Segoe UI, Arial, sans-serif" fill="#888">Calculated from public contributions</text>
        </g>
      </svg>`;

    // Cache the generated SVG for short period
    await cache.set(cacheKey, svg, 60 * 10); // 10 minutes

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.send(svg);
  } catch (error) {
    console.error('Widget error for', username, error.message || error);
    const safeUsername = String(username).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const errorSvg = `
      <svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="120" rx="20" fill="#ffeaea" />
        <text x="40" y="70" font-size="20" font-family="Segoe UI, Arial, sans-serif" fill="#d32f2f">
          Error: Could not fetch streak for ${safeUsername}
        </text>
      </svg>
    `;
    res.set('Content-Type', 'image/svg+xml');
    res.status(500).send(errorSvg);
  }
};