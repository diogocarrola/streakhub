const crypto = require('crypto');
const cache = require('./cache');

// Verify GitHub webhook signature (HMAC-SHA256)
function verifyWebhookSignature(payload, signature) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.warn('WEBHOOK_SECRET not set; skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const digest = `sha256=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

// Handle GitHub push webhook to invalidate cache for updated users
async function handlePushWebhook(req, res) {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'] || '';
    const payload = req.rawBody || JSON.stringify(req.body); // rawBody must be set in server.js middleware

    if (!verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { repository, pusher } = req.body;
    if (!repository || !pusher) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Extract GitHub username from pusher or repository owner
    const githubUsername = (pusher && pusher.name) || (repository && repository.owner && repository.owner.login);
    if (!githubUsername) {
      return res.status(400).json({ error: 'Could not extract username' });
    }

    // Invalidate cache for this user across all themes/timezones
    await invalidateUserCache(githubUsername);

    console.log(`[Webhook] Invalidated cache for user: ${githubUsername}`);
    return res.status(200).json({ ok: true, user: githubUsername });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Invalidate all cache entries for a user
async function invalidateUserCache(username) {
  // Get all themes and common timezone values
  const themes = ['duolingo', 'dark', 'neon', 'minimal'];
  const graces = [0, 1, 2];
  const timezones = ['UTC', 'Americas/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'auto'];

  const invalidatePromises = [];
  for (const theme of themes) {
    for (const grace of graces) {
      for (const tz of timezones) {
        const key = `widget:${username}:${theme}:grace:${grace}:tz:${tz}`;
        invalidatePromises.push(cache.delete(key).catch(() => {})); // silently ignore missing keys
      }
    }
  }

  await Promise.all(invalidatePromises);
}

module.exports = { handlePushWebhook, verifyWebhookSignature, invalidateUserCache };
