const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 * 60 }); // Cache for 1 hour

exports.generateWidget = async (req, res) => {
  const username = req.params.username;

  // Check cache first to improve performance
  const cachedStreak = cache.get(username);
  if (cachedStreak) {
    return res.send(cachedStreak);
  }

  try {
    // Fetch user's public events (including commits) from GitHub
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

    // Handle if today has commits and count the streak
    let isStreakBroken = false;

    // Check for today's commit status
    const todayISO = currentDate.toISOString().split('T')[0];
    const lastCommitDate = [...commitDates].pop(); // Latest commit date

    if (!commitDates.has(todayISO)) {
      // No commit today; show grey color and ⚠️ emoji
      isStreakBroken = true;
    } else {
      // Check for streak from past days
      while (commitDates.has(currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    // If there are no commits today, check the last commit date
    if (isStreakBroken && lastCommitDate) {
      const lastCommit = new Date(lastCommitDate);
      while (currentDate > lastCommit) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    // Determine the emoji and color based on streak status
    const emoji = isStreakBroken ? "⚠️" : "🔥";
    const color = isStreakBroken ? "#B0B0B0" : "#1e90ff"; // Grey if broken, blue if active

    // Generate the SVG widget
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

    // Cache the result for future requests
    cache.set(username, svg);

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Unable to fetch streak data' });
  }
};