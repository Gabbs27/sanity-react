const { requireAdmin } = require('../_utils/auth');
const { applyCors } = require('../_utils/ga4');

/**
 * Admin-only newsletter stats endpoint.
 *
 * Returns total active subscribers + count subscribed in the last 7 days.
 * Uses MailerLite v3 API:
 *   - GET /subscribers?limit=1 returns paginated total via meta.total
 *   - GET /subscribers?filter[date_subscribed]=YYYY-MM-DD returns the
 *     count from that date forward.
 *
 * If MailerLite is not yet configured (free-tier signup pending account
 * approval, env vars missing) we return 0/0 so the dashboard widget
 * stays informative instead of erroring.
 */
module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    return res.json({ total: 0, weeklyDelta: 0, configured: false });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };

  try {
    // Total active subscribers
    const totalRes = await fetch(
      'https://connect.mailerlite.com/api/subscribers?limit=1&filter[status]=active',
      { headers }
    );
    const totalData = await totalRes.json().catch(() => ({}));
    if (!totalRes.ok) {
      console.error('MailerLite total error:', totalRes.status, totalData);
      return res.status(502).json({ error: 'Newsletter provider error' });
    }
    const total = totalData.meta?.total ?? 0;

    // Subscribers from the last 7 days
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD
    const weekRes = await fetch(
      `https://connect.mailerlite.com/api/subscribers?limit=1&filter[status]=active&filter[date_subscribed]=${sinceDate}`,
      { headers }
    );
    const weekData = await weekRes.json().catch(() => ({}));
    const weeklyDelta = weekRes.ok ? (weekData.meta?.total ?? 0) : 0;

    return res.json({ total, weeklyDelta, configured: true });
  } catch (err) {
    console.error('stats handler error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
};
