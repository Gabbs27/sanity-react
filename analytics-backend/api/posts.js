const { requireAdmin } = require('./_utils/auth');
const { applyCors } = require('./_utils/ga4');
const { getSanityClient } = require('./_utils/sanity');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;

  const client = getSanityClient();

  try {
    if (req.method === 'GET') {
      // List all posts, latest first
      const posts = await client.fetch(`
        *[_type == "post"] | order(publishedAt desc) {
          _id,
          title,
          slug,
          publishedAt,
          sponsored,
          affiliateDisclosure,
          tags,
          mainImage{asset->{_id, url}}
        }
      `);
      return res.json({ posts });
    }

    if (req.method === 'POST') {
      const { title, slug, body, mainImage, publishedAt, sponsored, affiliateDisclosure, tags, authorId } = req.body || {};
      if (!title || !slug?.current) {
        return res.status(400).json({ error: 'title and slug.current are required' });
      }
      const doc = {
        _type: 'post',
        title,
        slug,
        body: body || [],
        publishedAt: publishedAt || new Date().toISOString(),
        sponsored: !!sponsored,
        affiliateDisclosure: !!affiliateDisclosure,
        ...(Array.isArray(tags) && tags.length ? { tags: tags.filter((t) => typeof t === 'string' && t.trim()) } : {}),
        ...(mainImage ? { mainImage } : {}),
        ...(authorId ? { author: { _type: 'reference', _ref: authorId } } : {}),
      };
      const created = await client.create(doc);
      return res.status(201).json({ post: created });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('posts handler error:', err);
    return res.status(500).json({ error: 'Failed to handle posts request', message: err.message });
  }
};
