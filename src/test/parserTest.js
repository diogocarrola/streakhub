const assert = require('assert');
const { fetchContributionsFromGithub } = require('../contributionsScraper');

async function test() {
  // A very basic smoke-test that fetchContributionsFromGithub returns an array for a known public user
  // NOTE: This will make a network request; keep it as a manual test when running locally.
  try {
    const days = await fetchContributionsFromGithub('octocat');
    assert(Array.isArray(days), 'Expected array of days');
    assert(days.length > 0, 'Expected at least one day returned');
    assert(days[0].date && typeof days[0].contributionCount === 'number', 'Day objects must have date and contributionCount');
    console.log('Parser smoke test passed.');
    process.exit(0);
  } catch (err) {
    console.error('Parser smoke test failed:', err.message || err);
    process.exit(2);
  }
}

test();
