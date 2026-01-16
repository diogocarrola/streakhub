const axios = require('axios');

// Fetch and parse GitHub "contributions" SVG for a public user
// Returns array of { date: 'YYYY-MM-DD', contributionCount: Number }
async function fetchContributionsFromGithub(username) {
  // GitHub contributions page for a user
  const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`;
  const res = await axios.get(url, {
    headers: {
      'User-Agent': 'StreakHub-Scraper',
      Accept: 'text/html'
    },
    timeout: 10000
  });

  const html = res.data;
  // Find all rects with data-date and data-count
  // Example: <rect class="day" width="10" height="10" x="14" y="0" fill="#ebedf0" data-count="0" data-date="2025-01-01"/>
  const dayRegex = /<rect[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-count="(\d+)"[^>]*>/g;
  const days = [];
  let match;
  while ((match = dayRegex.exec(html)) !== null) {
    days.push({ date: match[1], contributionCount: parseInt(match[2], 10) });
  }

  // Fallback: some SVGs may use <g> or <rect .../>, regex handles both as long as attributes contain data-date/data-count
  if (!days.length) {
    throw new Error('Could not parse contribution SVG for user — maybe GitHub blocked the request or the structure changed.');
  }

  // Sort by date ascending
  days.sort((a, b) => new Date(a.date) - new Date(b.date));
  return days;
}

module.exports = { fetchContributionsFromGithub };
