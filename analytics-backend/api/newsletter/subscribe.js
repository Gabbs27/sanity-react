const { applyCors } = require('../_utils/ga4');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public newsletter subscribe endpoint.
 *
 * Forwards to MailerLite API v3 (https://developers.mailerlite.com).
 * If MAILERLITE_GROUP_ID is set, the subscriber is added to that group;
 * otherwise they land in the global subscriber list.
 *
 * MailerLite returns 200 for both new + already-subscribed emails, so
 * this endpoint always reports success unless the API itself rejects
 * the request (e.g. invalid email shape, account suspended).
 */
module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName } = req.body || {};
  if (!email || !EMAIL_RE.test(String(email))) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID; // optional
  if (!apiKey) {
    console.error('MAILERLITE_API_KEY not set');
    return res.status(500).json({ error: 'Newsletter service not configured' });
  }

  try {
    const payload = {
      email,
      ...(firstName ? { fields: { name: firstName } } : {}),
      ...(groupId ? { groups: [String(groupId)] } : {}),
    };

    const mlRes = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await mlRes.json().catch(() => ({}));
    if (!mlRes.ok) {
      console.error('MailerLite subscribe error:', mlRes.status, data);
      return res.status(502).json({ error: 'Newsletter provider error' });
    }
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('subscribe handler error:', err);
    return res.status(500).json({ error: 'Failed to subscribe', message: err.message });
  }
};
