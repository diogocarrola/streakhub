const axios = require('axios');

async function getContributionCalendar(username) {
  // Prefer an explicit project token name to avoid confusion in deployment environments
  const token = process.env.STREAKHUB_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GitHub token. Please set STREAKHUB_GITHUB_TOKEN or GITHUB_TOKEN in your environment (see README for steps).');
  }

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

  const response = await axios.post(
    'https://api.github.com/graphql',
    { query, variables: { login: username, from: fromDate.toISOString() } },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'StreakHub'
      }
    }
  );

  // Basic response validation
  if (!response.data || !response.data.data || !response.data.data.user) {
    throw new Error('Invalid response from GitHub API');
  }

  // Flatten the days array
  const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks;
  const days = weeks.flatMap(week => week.contributionDays);

  return days;
}

module.exports = { getContributionCalendar };