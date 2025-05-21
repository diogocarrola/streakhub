const axios = require('axios');

exports.generateWidget = async (req, res) => {
  const username = req.params.username;
  try {
    // Fetch user's public events (commits) from GitHub
    const response = await axios.get(`https://api.github.com/users/${username}/events/public`, {
      headers: { 'User-Agent': 'StreakHub' },
    });

    const events = response.data;
    const commitDates = new Set();
    events.forEach(event => {
      if (event.type === 'PushEvent') {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        commitDates.add(date);
      }
    });

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    // Set the minimum date for streak counting (Jan 1, 2025)
    const minDate = new Date('2025-01-01');

    // Check for today's commit status
    const todayISO = currentDate.toISOString().split('T')[0];
    let isStreakBroken = !commitDates.has(todayISO);

    // Count streak
    while (
      commitDates.has(currentDate.toISOString().split('T')[0]) &&
      currentDate >= minDate
    ) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // SVG styling
    const maxStreak = 365;
    const percent = Math.min(100, Math.round((streak / maxStreak) * 100));
    const emoji = isStreakBroken ? "🥶" : "🔥";
    const barColor = isStreakBroken ? "#bdbdbd" : "#ffb300";
    const bgColor = "#fffbe6";
    const textColor = "#22223b";

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
    // Always return SVG, even on error
    const errorSvg = `
      <svg fill="none" viewBox="0 0 500 100" width="500" height="100" xmlns="http://www.w3.org/2000/svg">
        <text x="20" y="60" font-size="32" fill="red">User not found or error</text>
      </svg>
    `;
    res.set('Content-Type', 'image/svg+xml');
    res.status(404).send(errorSvg);
  }
};