// Shared Bearer auth check for admin endpoints.
// Returns true when the request is authorized; otherwise sends a 401 and returns false.
// Caller pattern:
//   if (!requireAdmin(req, res)) return;

function requireAdmin(req, res) {
  const auth = req.headers.authorization || '';
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server misconfigured: ADMIN_TOKEN not set' });
    return false;
  }
  if (auth !== `Bearer ${token}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { requireAdmin };
