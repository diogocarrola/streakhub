const axios = require('axios');

// Fetch contribution calendar from GitHub GraphQL API (real-time data)
async function getContributionCalendar(username) {
  const token = process.env.STREAKHUB_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GitHub token. Please set STREAKHUB_GITHUB_TOKEN or GITHUB_TOKEN in your environment.');
  }

  // Query last 365 days of contributions
  const fromDate = new Date();
  fromDate.setUTCDate(fromDate.getUTCDate() - 365);
  fromDate.setUTCHours(0, 0, 0, 0);

  const query = `
    query($login: String!, $from: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://api.github.com/graphql',
      { query, variables: { login: username, from: fromDate.toISOString() } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'StreakHub'
        },
        timeout: 10000
      }
    );

    if (response.data.errors) {
      throw new Error(`GitHub API error: ${response.data.errors.map(e => e.message).join(', ')}`);
    }

    if (!response.data?.data?.user) {
      throw new Error('User not found or invalid response from GitHub API');
    }

    const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks || [];
    const days = weeks.flatMap(week => week.contributionDays || []);

    return days;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('GitHub API request timed out; try again later');
    }
    throw error;
  }
}

// Alias for backward compatibility
async function getUserCommitStreak(username) {
  return getContributionCalendar(username);
}

module.exports = { getContributionCalendar, getUserCommitStreak };