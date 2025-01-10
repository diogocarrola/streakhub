const axios = require('axios');

// Widget function to show daily commit streak
exports.generateWidget = async (req, res) => {
  const username = req.params.username;

  try {
    // Fetch user events from the GitHub API
    const response = await axios.get(`https://api.github.com/users/${username}/events/public`, {
      headers: { 'User-Agent': 'StreakHub' },
    });

    const events = response.data;
    const commitDates = new Set();

    // Filter push events and extract commit dates
    events.forEach(event => {
      if (event.type === 'PushEvent') {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        commitDates.add(date);
      }
    });

    // Calculate streak
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    // Check consecutive days
    while (commitDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Generate SVG
    const svg = `
      <svg fill="none" viewBox="0 0 500 100" width="500" height="100" xmlns="http://www.w3.org/2000/svg">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>
              @keyframes glow {
                0%, 100% { color: #1e90ff; }
                50% { color: #ff4500; }
              }
              h1 {
                font-family: 'Inter', sans-serif;
                margin: 0;
                font-size: 3.5em;
                font-weight: bold;
                text-align: center;
                color: #1e90ff;
                animation: glow 2s ease-in-out infinite;
              }
            </style>
            <h1>${streak}/365 🔥</h1>
          </div>
        </foreignObject>
      </svg>
    `;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Unable to fetch streak data' });
  }
};