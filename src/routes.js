const express = require('express');
const router = express.Router();

const { getUserCommitStreak } = require('./githubService');
const widgetController = require('./widgetController');

// Get the commit streak data for a specific GitHub user
router.get('/streak/:username', async (req, res) => {
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
router.get('/widget/:username', widgetController.generateWidget);

module.exports = router;