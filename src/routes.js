const express = require('express');
const passport = require('./auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

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

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

const Challenge = require('./models/Challenge');
const authenticateToken = require('./middleware/auth');

// Route to create a new challenge
router.post('/challenges', authenticateToken, async (req, res) => {
    const { userId, name, startDate, durationDays } = req.body;
    if (!userId || !name || !startDate || !durationDays) {
        return res.status(400).json({ error: 'Please provide userId, name, startDate, and durationDays' });
    }
    try {
        const challenge = new Challenge({
            userId,
            name,
            startDate: new Date(startDate),
            durationDays,
            progressDays: 0,
            isActive: true,
        });
        await challenge.save();
        res.status(201).json({ message: 'Challenge created successfully!', challenge });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while creating challenge' });
    }
});

router.get('/challenges/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        const challenges = await Challenge.find({ userId });
        res.status(200).json({ challenges });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while fetching challenges' });
    }
});

// Protected route for fetching streak stats
router.get('/streaks/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    try {
        // Placeholder logic: fetch streak stats from DB or external API
        // For now, return dummy data
        res.status(200).json({ userId, streak: '100/365 🔥' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while fetching streak stats' });
    }
});

// GitHub OAuth routes
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/');
});

module.exports = router;
