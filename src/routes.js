const express = require('express');
const passport = require('./auth');
const User = require('./models/User');
const router = express.Router();

// User registration route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please provide username, email, and password' });
    }
    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Sample route for tracking challenges
router.post('/challenges', (req, res) => {
    // Logic for tracking challenges
    res.status(200).json({ message: 'Challenge tracked successfully!' });
});

// Sample route for fetching streak stats
router.get('/streaks/:userId', (req, res) => {
    const userId = req.params.userId;
    // Logic for fetching streak stats for the user
    res.status(200).json({ userId, streak: '100/365 🔥' });
});

// GitHub OAuth routes
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

module.exports = router;
