const { applyCors } = require('../_utils/ga4');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName } = req.body || {};
  if (!email || !EMAIL_RE.test(String(email))) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;
  if (!apiKey || !formId) {
    console.error('ConvertKit env vars missing');
    return res.status(500).json({ error: 'Newsletter service not configured' });
  }

  try {
    const ckRes = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          ...(firstName ? { first_name: firstName } : {}),
        }),
      }
    );
    const data = await ckRes.json();
    if (!ckRes.ok) {
      console.error('ConvertKit subscribe error:', data);
      return res.status(502).json({ error: 'Newsletter provider error' });
    }
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('subscribe handler error:', err);
    return res.status(500).json({ error: 'Failed to subscribe', message: err.message });
  }
};
