const axios = require('axios');

async function getContributionCalendar(username) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection(from: "2025-01-01T00:00:00Z") {
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
    { query, variables: { login: username } },
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'StreakHub'
      }
    }
  );

  // Flatten the days array
  const weeks = response.data.data.user.contributionsCollection.contributionCalendar.weeks;
  const days = weeks.flatMap(week => week.contributionDays);

  return days;
}

module.exports = { getContributionCalendar };