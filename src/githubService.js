const fetch = require('node-fetch');

/**
 * Fetch public commit activity for a GitHub user and calculate current streak.
 * @param {string} username - GitHub username
 * @returns {Promise<{streak: string}>} - Current streak string like '10/365 🔥'
 */
async function getUserCommitStreak(username) {
  try {
    // Fetch public events for the user (max 300 events, 10 pages of 30 events)
    let events = [];
    for (let page = 1; page <= 10; page++) {
      const response = await fetch(`https://api.github.com/users/${username}/events/public?page=${page}&per_page=30`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const pageEvents = await response.json();
      if (pageEvents.length === 0) break;
      events = events.concat(pageEvents);
    }

    // Extract commit dates from PushEvent types
    const commitDatesSet = new Set();
    events.forEach(event => {
      if (event.type === 'PushEvent') {
        event.payload.commits.forEach(commit => {
          // Use event created_at date as commit date (UTC)
          const date = new Date(event.created_at).toISOString().slice(0, 10);
          commitDatesSet.add(date);
        });
      }
    });

    // Convert set to array and sort descending
    const commitDates = Array.from(commitDatesSet).sort((a, b) => (a < b ? 1 : -1));

    // Calculate current streak of consecutive days with commits
    let streak = 0;
    let today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < commitDates.length; i++) {
      const commitDate = new Date(commitDates[i] + 'T00:00:00Z');
      const diffDays = Math.floor((today - commitDate) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return { streak: `${streak} days` };
  } catch (error) {
    console.error('Error fetching GitHub commit streak:', error);
    return { streak: 'N/A' };
  }
}

module.exports = { getUserCommitStreak };
