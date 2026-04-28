const { requireAdmin } = require('../_utils/auth');
const { applyCors } = require('../_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Newsletter service not configured' });
  }

  try {
    // Total subscribers — fetch the first page just to read pagination total.
    const totalRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${apiKey}&per_page=1`
    );
    const totalData = await totalRes.json();
    const total = totalData.total_subscribers ?? 0;

    // Subscribers from the last 7 days.
    const sinceISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${apiKey}&from=${encodeURIComponent(sinceISO)}&per_page=1`
    );
    const weekData = await weekRes.json();
    const weeklyDelta = weekData.total_subscribers ?? 0;

    return res.json({ total, weeklyDelta });
  } catch (err) {
    console.error('stats handler error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
};
