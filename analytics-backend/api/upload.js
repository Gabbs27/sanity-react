const { requireAdmin } = require('./_utils/auth');
const { applyCors } = require('./_utils/ga4');
const { getSanityClient } = require('./_utils/sanity');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        req.destroy();
        reject(new Error('File too large (>5MB)'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const mime = req.headers['x-file-type'];
  const filename = req.headers['x-file-name'] || 'upload.bin';

  if (!mime || !ALLOWED_MIME.includes(mime)) {
    return res.status(400).json({ error: `Invalid or missing MIME (allowed: ${ALLOWED_MIME.join(', ')})` });
  }

  try {
    const buffer = await readBody(req);
    const client = getSanityClient();
    const asset = await client.assets.upload('image', buffer, {
      filename,
      contentType: mime,
    });
    return res.status(201).json({
      _id: asset._id,
      url: asset.url,
    });
  } catch (err) {
    console.error('upload handler error:', err);
    const status = err.message?.includes('too large') ? 413 : 500;
    return res.status(status).json({ error: 'Upload failed', message: err.message });
  }
};

// Disable Vercel's default JSON body parser so we can read the raw stream
module.exports.config = { api: { bodyParser: false } };
