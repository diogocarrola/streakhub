const express = require('express');
const { generateWidget } = require('./widgetController');

const router = express.Router();

// Route to generate the SVG widget
router.get('/widget/:username', generateWidget);

module.exports = router;