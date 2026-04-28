const { applyCors } = require('./_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};
