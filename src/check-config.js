// Simple config checker for required environment variables
const required = [
  'STREAKHUB_GITHUB_TOKEN'
];

const missing = required.filter(r => !process.env[r]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('\nQuick fix: create a Personal Access Token and set it in your deployment environment as STREAKHUB_GITHUB_TOKEN\nSee README for detailed steps.');
  process.exit(1);
}

console.log('All required env vars are set: OK');
process.exit(0);
