const { requireAdmin } = require('../_utils/auth');
const { applyCors } = require('../_utils/ga4');
const { getSanityClient } = require('../_utils/sanity');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const client = getSanityClient();

  try {
    if (req.method === 'GET') {
      const post = await client.fetch(
        `*[_type == "post" && _id == $id][0]{
          _id, title, slug, body, publishedAt,
          sponsored, affiliateDisclosure, tags,
          mainImage{asset->{_id, url}},
          "name": author->name
        }`,
        { id }
      );
      if (!post) return res.status(404).json({ error: 'Post not found' });
      return res.json({ post });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const patches = req.body || {};
      // Whitelist editable fields
      const allowed = ['title', 'slug', 'body', 'publishedAt', 'sponsored', 'affiliateDisclosure', 'mainImage', 'tags'];
      const set = {};
      for (const k of allowed) if (k in patches) set[k] = patches[k];
      const updated = await client.patch(id).set(set).commit();
      return res.json({ post: updated });
    }

    if (req.method === 'DELETE') {
      await client.delete(id);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('post[id] handler error:', err);
    return res.status(500).json({ error: 'Failed to handle post request', message: err.message });
  }
};
