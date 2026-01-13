require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');

const app = express();
// Limit JSON and URL-encoded payload sizes to mitigate memory/DoS attacks (qs parsing risks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Basic security hardening
app.use(helmet());
// Fallback CSP header (helmet will cover common headers, this ensures a strict baseline for the widget)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; object-src 'none';");
  next();
});

// Simple rate limiter to mitigate abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Allow CORS from your GitHub Pages domain
app.use(cors({
  origin: 'https://diogocarrola.github.io'
}));

app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});