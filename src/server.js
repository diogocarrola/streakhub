try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available in this environment; proceed without loading .env
}
const express = require('express');
const cors = require('cors');
// Optional security middleware; when not installed we'll continue with safe defaults
let helmet;
try {
  helmet = require('helmet');
} catch (e) {
  helmet = null;
}
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  rateLimit = null;
}
const routes = require('./routes');
const { schedulePollHotUsers } = require('./scheduler');

const app = express();
// Limit JSON and URL-encoded payload sizes; capture raw body for webhook signature verification
app.use(express.json({ 
  limit: '10kb',
  verify: (req, res, buf, encoding) => {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Basic security hardening (optional when packages are present)
if (helmet && typeof helmet === 'function') {
  app.use(helmet());
} else {
  // helmet not installed; we'll apply a minimal CSP fallback below
}
// Fallback CSP header (ensure a strict baseline for the widget even when helmet isn't installed)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; object-src 'none';");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Rate limiter (optional)
if (rateLimit && typeof rateLimit === 'function') {
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
} else {
  // rate limiter not available — keep application functional but consider adding one in production
}

// Allow CORS from your GitHub Pages domain and localhost
app.use(cors({
  origin: ['https://diogocarrola.github.io', 'http://localhost:3000', 'http://localhost:3001']
}));

app.use('/', routes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start background scheduler for hot user polling
  schedulePollHotUsers();
});