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

    // Check for today's commit status
    const todayISO = currentDate.toISOString().split('T')[0];
    let isStreakBroken = !commitDates.has(todayISO);

    // Count streak
    while (commitDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // SVG styling
    const emoji = isStreakBroken ? "⚠️" : "🔥";
    const color = isStreakBroken ? "#B0B0B0" : "#1e90ff";

    const svg = `
      <svg fill="none" viewBox="0 0 500 100" width="500" height="100" xmlns="http://www.w3.org/2000/svg">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>
              @keyframes glow {
                0%, 100% { color: ${color}; }
                50% { color: #ff4500; }
              }
              h1 {
                font-family: 'Inter', sans-serif;
                margin: 0;
                font-size: 3.5em;
                font-weight: bold;
                text-align: center;
                color: ${color};
                animation: glow 2s ease-in-out infinite;
              }
            </style>
            <h1>${streak}/365 ${emoji}</h1>
          </div>
        </foreignObject>
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