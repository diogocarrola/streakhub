const { getContributionCalendar } = require('./githubService');

exports.generateWidget = async (req, res) => {
  const username = req.params.username;
  try {
    const days = await getContributionCalendar(username);

    // Calculate streak from Jan 1, 2025
    let streak = 0;
    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const streakStart = new Date('2025-01-01T00:00:00Z');
    streakStart.setUTCHours(0, 0, 0, 0);

    // Find today's date in the array
    let foundToday = false;
    let todayHasCommit = false;

    // Go backwards from the last day in the array
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const dayDate = new Date(day.date);
      dayDate.setUTCHours(0, 0, 0, 0);
      
      if (dayDate < streakStart) break;

      if (dayDate.getTime() > today.getTime()) continue;

      if (dayDate.getTime() === today.getTime()) {
        foundToday = true;
        if (day.contributionCount > 0) {
          todayHasCommit = true;
          streak++;
        }
        // If today has no commit, don't break yet, keep counting streak for previous days
        continue;
      }

      // For previous days, streak only continues if there was a commit
      if (day.contributionCount > 0) {
        streak++;
      } else {
        break;
      }
    }

    // SVG styling
    const maxStreak = 365;
    const percent = Math.min(100, Math.round((streak / maxStreak) * 100));
    const emoji = todayHasCommit ? "🔥" : "🥶";
    const barColor = todayHasCommit ? "#ffb300" : "#b3e0ff";
    const bgColor = todayHasCommit ? "#fff3cd" : "#e3f2fd";
    const textColor = "#22223b";

    // Add cache-control headers to discourage caching
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const svg = `
      <svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="120" rx="20" fill="${bgColor}" />
        <text x="40" y="55" font-size="32" font-family="Segoe UI, Arial, sans-serif" fill="${textColor}" font-weight="bold">
          ${emoji} ${streak} day streak
        </text>
        <rect x="40" y="70" width="340" height="18" rx="9" fill="#eee" />
        <rect x="40" y="70" width="${3.4 * percent}" height="18" rx="9" fill="${barColor}" />
        <text x="380" y="84" font-size="14" font-family="Segoe UI, Arial, sans-serif" fill="#888">${percent}%</text>
        <text x="40" y="105" font-size="14" font-family="Segoe UI, Arial, sans-serif" fill="#888">Since Jan 1, 2025</text>
      </svg>
    `;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    const errorSvg = `
      <svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="420" height="120" rx="20" fill="#ffeaea" />
        <text x="40" y="70" font-size="24" font-family="Segoe UI, Arial, sans-serif" fill="#d32f2f">
          Error: Could not fetch streak for ${req.params.username}
        </text>
      </svg>
    `;
    res.set('Content-Type', 'image/svg+xml');
    res.status(500).send(errorSvg);
  }
};