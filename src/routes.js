const express = require('express');
const router = express.Router();

const { getUserCommitStreak } = require('./githubService');
const widgetController = require('./widgetController');

// Validate GitHub username: allowed characters (alphanumeric + hyphen), 1-39 chars
const usernameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;
function validateUsername(req, res, next) {
  const username = req.params.username;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Invalid GitHub username' });
  }
  next();
}

// Get the commit streak data for a specific GitHub user
router.get('/streak/:username', validateUsername, async (req, res) => {
    const { username } = req.params;
    try {
        const streakData = await getUserCommitStreak(username);
        res.status(200).json(streakData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while fetching streak data' });
    }
});

// SVG widget for GitHub username
router.get('/widget/:username', validateUsername, widgetController.generateWidget);

module.exports = router;