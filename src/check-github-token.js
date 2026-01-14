// Small script to validate a GitHub token by querying the viewer
const axios = require('axios');

async function main() {
  const token = process.env.STREAKHUB_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('No token found in STREAKHUB_GITHUB_TOKEN or GITHUB_TOKEN');
    process.exit(1);
  }

  const query = `query { viewer { login } }`;
  try {
    const res = await axios.post('https://api.github.com/graphql', { query }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'StreakHub-Token-Checker'
      }
    });
    if (res.data && res.data.data && res.data.data.viewer) {
      console.log('Token ok. Viewer:', res.data.data.viewer.login);
      process.exit(0);
    }
    console.error('Invalid response from GitHub API', res.data);
    process.exit(2);
  } catch (err) {
    console.error('Error validating token:', err.message || err);
    process.exit(3);
  }
}

main();
