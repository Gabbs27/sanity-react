# Slice 3 — Custom Post Editor with BlockNote

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the need to leave the portfolio domain to publish blog posts. After this slice, the author can list, create, edit, and publish posts entirely from `/admin/escribir` using a Notion-style block editor (BlockNote), with images uploaded directly to Sanity assets.

**Architecture:**
- **Backend** (Vercel Functions, already deployed at `analytics-backend-seven.vercel.app`): three new endpoints — `/api/posts` (list + create), `/api/posts/[id]` (get/update/delete), `/api/upload` (multipart image proxy to Sanity assets). All require `Authorization: Bearer ADMIN_TOKEN`. The Sanity write token lives only in Vercel env (`SANITY_WRITE_TOKEN`).
- **Frontend**: new admin section under `/admin/*` wrapping the existing dashboard. New routes: `/admin/posts` (list), `/admin/escribir` (new post), `/admin/escribir/:id` (edit). All gated by the existing `AuthContext`.
- **Editor**: BlockNote (`@blocknote/react` + `@blocknote/mantine`). On save, BlockNote's JSON gets mapped to Sanity Portable Text via a custom utility. On load, the reverse mapper rebuilds BlockNote blocks from Portable Text.
- **Image flow**: BlockNote upload callback → frontend POSTs `multipart/form-data` to `/api/upload` → backend validates MIME + size → forwards to Sanity Assets API → returns `{_id, url}` → BlockNote inserts the URL.

**Tech Stack:**
- Backend: `@sanity/client` (NEW — install in `analytics-backend/`), native fetch for image upload to Sanity Assets API.
- Frontend: `@blocknote/react`, `@blocknote/mantine`, `@blocknote/core` (NEW). `@sanity/client` already in deps. `@portabletext/react` already in deps.
- Existing in repo: `react-router-dom`, `motion/react`, `react-hook-form` is NOT installed — we use plain controlled inputs to avoid adding deps.

**Branch context:** continue on `developer`. Working tree clean before starting.

---

## Verification policy

Per task:
1. After backend tasks: invoke the deployed endpoint via `curl` against the Vercel URL with the real `ADMIN_TOKEN` and confirm status + shape.
2. After frontend tasks: load the new route in the dev preview, confirm rendering + console clean.
3. After full integration: end-to-end create a draft post via `/admin/escribir`, save, confirm visible in `/allpost`.
4. Each task ends with one atomic commit. No `Co-Authored-By` trailer.

If verification fails: stop, root-cause via the systematic-debugging skill, fix, re-verify before commit.

---

## Task 1: Add Sanity client helper to backend

**Files:**
- Modify: `analytics-backend/package.json` (add `@sanity/client` dep)
- Create: `analytics-backend/api/_utils/sanity.js`

### Step 1.1: Install `@sanity/client`

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react/analytics-backend
npm install @sanity/client
```

### Step 1.2: Create `api/_utils/sanity.js`

```js
const { createClient } = require('@sanity/client');

let cachedClient = null;

function getSanityClient() {
  if (cachedClient) return cachedClient;
  cachedClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION || '2023-03-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false, // writes go to the live API, not the CDN
  });
  return cachedClient;
}

module.exports = { getSanityClient };
```

### Step 1.3: Commit

```bash
git add analytics-backend/package.json analytics-backend/package-lock.json analytics-backend/api/_utils/sanity.js
git commit -m "feat(backend): add Sanity client helper for write operations"
```

---

## Task 2: Create `api/posts.js` — list + create

**Files:**
- Create: `analytics-backend/api/posts.js`

### Step 2.1: Handler implementation

```js
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
          mainImage{asset->{_id, url}}
        }
      `);
      return res.json({ posts });
    }

    if (req.method === 'POST') {
      const { title, slug, body, mainImage, publishedAt, sponsored, affiliateDisclosure, authorId } = req.body || {};
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
```

### Step 2.2: Commit

```bash
git add analytics-backend/api/posts.js
git commit -m "feat(backend): add /api/posts list + create endpoints

GET returns posts ordered by publishedAt desc. POST validates required
fields and creates a new post via Sanity mutate API. Both require
ADMIN_TOKEN."
```

---

## Task 3: Create `api/posts/[id].js` — get/update/delete

Vercel uses `[bracket]` filename syntax for dynamic params. The param is available as `req.query.id`.

**Files:**
- Create: `analytics-backend/api/posts/[id].js`

### Step 3.1: Handler implementation

```js
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
          sponsored, affiliateDisclosure,
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
      const allowed = ['title', 'slug', 'body', 'publishedAt', 'sponsored', 'affiliateDisclosure', 'mainImage'];
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
```

### Step 3.2: Commit

```bash
git add analytics-backend/api/posts/[id].js
git commit -m "feat(backend): add /api/posts/[id] get/update/delete endpoints

GET fetches a single post by _id with resolved mainImage and author
name. PUT/PATCH applies a whitelisted set of fields. DELETE removes the
document. All require ADMIN_TOKEN."
```

---

## Task 4: Create `api/upload.js` — image proxy to Sanity assets

**Files:**
- Create: `analytics-backend/api/upload.js`

### Step 4.1: Handler implementation

Sanity's `client.assets.upload('image', stream, options)` accepts a Buffer or Readable stream. The Vercel Function default body parser is JSON; for multipart we'll set `bodyParser: false` and parse manually using a small helper. To avoid extra deps, we read the request stream into a Buffer and assume `Content-Type: application/octet-stream` with a separate `X-File-Type` header for MIME, and `X-File-Name` for the filename. This is simpler than full multipart parsing and works fine for our single-file upload use case.

```js
const { requireAdmin } = require('./_utils/auth');
const { applyCors } = require('./_utils/ga4');
const { getSanityClient } = require('./_utils/sanity');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Disable Vercel's default JSON body parser so we can read the raw stream
module.exports.config = { api: { bodyParser: false } };

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
```

### Step 4.2: Commit

```bash
git add analytics-backend/api/upload.js
git commit -m "feat(backend): add /api/upload image proxy to Sanity assets

Accepts raw image bytes via POST with X-File-Type and X-File-Name
headers. Validates MIME (jpeg/png/webp/gif) and size (5MB cap)
server-side, then forwards to Sanity Assets API using SANITY_WRITE_TOKEN.
Returns {_id, url} of the created asset."
```

---

## Task 5: Deploy backend changes + verify endpoints

### Step 5.1: Deploy

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react/analytics-backend
vercel --prod
```

### Step 5.2: Smoke test from terminal

```bash
URL="https://analytics-backend-seven.vercel.app"
TOKEN="<the ADMIN_TOKEN from earlier>"

# List posts
curl -sS -H "Authorization: Bearer $TOKEN" "$URL/api/posts" | head -c 300
echo

# Test 405 on bad method
curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" "$URL/api/posts" -w "\nHTTP %{http_code}\n"
```

Expected: list returns `{posts: [...]}` with existing posts; PATCH returns 405.

### Step 5.3: Smoke test posts/[id] with a real post id from the list

```bash
POST_ID="<copy first _id from the list response>"
curl -sS -H "Authorization: Bearer $TOKEN" "$URL/api/posts/$POST_ID" | head -c 300
```

Expected: single-post payload.

No commit; verification only. If anything fails, debug and patch.

---

## Task 6: Install BlockNote + create Portable Text mapper

**Files:**
- Modify: `package.json` (add `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`)
- Create: `src/utils/blocknoteToPortable.ts`

### Step 6.1: Install deps

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react
npm install @blocknote/core @blocknote/react @blocknote/mantine
```

### Step 6.2: Create the mapper

The mapper needs to handle two directions:
- `blocksToPortable(blocks)` for save
- `portableToBlocks(value)` for load

```ts
// src/utils/blocknoteToPortable.ts
//
// Bidirectional mapper between BlockNote's block JSON and Sanity Portable Text.
//
// Mapping table:
//   BN paragraph / heading / bulletListItem / numberedListItem  →  PT block with style/listItem
//   BN inline content (text + styles bold/italic/code, link)    →  PT spans with marks
//   BN image                                                    →  PT type: image with asset reference

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlock = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PtBlock = any;

function makeKey() {
  return Math.random().toString(36).slice(2, 12);
}

function inlineToSpans(inline: AnyBlock[] | string | undefined): { spans: PtBlock[]; markDefs: PtBlock[] } {
  const spans: PtBlock[] = [];
  const markDefs: PtBlock[] = [];

  if (!inline) return { spans, markDefs };
  if (typeof inline === 'string') {
    spans.push({ _type: 'span', _key: makeKey(), text: inline, marks: [] });
    return { spans, markDefs };
  }

  for (const node of inline) {
    if (node.type === 'text') {
      const marks: string[] = [];
      const styles = node.styles || {};
      if (styles.bold) marks.push('strong');
      if (styles.italic) marks.push('em');
      if (styles.code) marks.push('code');
      spans.push({ _type: 'span', _key: makeKey(), text: node.text || '', marks });
    } else if (node.type === 'link') {
      const linkKey = makeKey();
      markDefs.push({ _type: 'link', _key: linkKey, href: node.href });
      // recursively handle link's children inline content
      const inner = inlineToSpans(node.content || []);
      for (const span of inner.spans) {
        span.marks = [...(span.marks || []), linkKey];
        spans.push(span);
      }
      markDefs.push(...inner.markDefs);
    }
  }
  return { spans, markDefs };
}

export function blocksToPortable(blocks: AnyBlock[]): PtBlock[] {
  if (!blocks?.length) return [];
  const result: PtBlock[] = [];

  for (const block of blocks) {
    if (block.type === 'image' && block.props?.url) {
      result.push({
        _type: 'image',
        _key: makeKey(),
        asset: block.props.assetId
          ? { _type: 'reference', _ref: block.props.assetId }
          : undefined,
        // If only URL is known (not yet uploaded), fall back to direct URL
        url: !block.props.assetId ? block.props.url : undefined,
      });
      continue;
    }

    let style = 'normal';
    if (block.type === 'heading') style = `h${block.props?.level || 2}`;
    if (block.type === 'codeBlock' || block.props?.codeBlock) style = 'code';

    let listItem: string | undefined;
    if (block.type === 'bulletListItem') listItem = 'bullet';
    if (block.type === 'numberedListItem') listItem = 'number';

    const { spans, markDefs } = inlineToSpans(block.content);
    result.push({
      _type: 'block',
      _key: makeKey(),
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs,
      children: spans,
    });
  }

  return result;
}

export function portableToBlocks(value: PtBlock[]): AnyBlock[] {
  if (!value?.length) return [];
  const result: AnyBlock[] = [];

  for (const node of value) {
    if (node._type === 'image') {
      result.push({
        type: 'image',
        props: {
          url: node.asset?.url || node.url || '',
          assetId: node.asset?._ref,
        },
      });
      continue;
    }

    if (node._type === 'block') {
      const inline = (node.children || []).map((span: PtBlock) => {
        const styles: Record<string, boolean> = {};
        for (const m of span.marks || []) {
          if (m === 'strong') styles.bold = true;
          else if (m === 'em') styles.italic = true;
          else if (m === 'code') styles.code = true;
        }
        return { type: 'text', text: span.text || '', styles };
      });

      let type: string = 'paragraph';
      let props: Record<string, unknown> = {};
      if (node.style?.startsWith('h')) {
        type = 'heading';
        props.level = parseInt(node.style.slice(1), 10) || 2;
      }
      if (node.listItem === 'bullet') type = 'bulletListItem';
      if (node.listItem === 'number') type = 'numberedListItem';
      if (node.style === 'code') type = 'codeBlock';

      result.push({ type, props, content: inline });
    }
  }

  return result;
}
```

### Step 6.3: Commit

```bash
git add package.json package-lock.json src/utils/blocknoteToPortable.ts
git commit -m "feat(admin): add BlockNote deps + Portable Text bidirectional mapper"
```

---

## Task 7: Create AdminLayout shell

**Files:**
- Create: `src/components/Admin/AdminLayout.tsx`
- Create: `src/components/Admin/AdminLayout.css`

### Step 7.1: AdminLayout.tsx

```tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faList, faPenToSquare, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './AdminLayout.css';

export default function AdminLayout() {
  const { logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!isAuthenticated) {
    navigate('/admin-login', { replace: true });
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">Admin</div>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          <NavLink to="/dashboard" className="admin-nav-link">
            <FontAwesomeIcon icon={faChartLine} /> Dashboard
          </NavLink>
          <NavLink to="/admin/posts" className="admin-nav-link">
            <FontAwesomeIcon icon={faList} /> Posts
          </NavLink>
          <NavLink to="/admin/escribir" end className="admin-nav-link">
            <FontAwesomeIcon icon={faPenToSquare} /> Write New
          </NavLink>
        </nav>
        <button
          className="admin-sidebar__logout"
          onClick={() => {
            logout();
            navigate('/admin-login', { replace: true });
          }}
          aria-label="Sign out">
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
```

### Step 7.2: AdminLayout.css

Minimal, theme-aware styles. Sidebar collapses on mobile.

```css
.admin-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  height: 100vh;
}

.admin-sidebar__brand {
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.admin-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.admin-nav-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.admin-nav-link:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.admin-nav-link.active {
  background: var(--color-primary-light, rgba(99, 102, 241, 0.12));
  color: var(--color-primary);
}

.admin-sidebar__logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.admin-sidebar__logout:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.admin-content {
  padding: 2rem 2.5rem;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    position: static;
    height: auto;
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }
  .admin-sidebar__brand { display: none; }
  .admin-sidebar__nav { flex-direction: row; }
  .admin-content { padding: 1rem; }
}
```

### Step 7.3: Commit

```bash
git add src/components/Admin/AdminLayout.tsx src/components/Admin/AdminLayout.css
git commit -m "feat(admin): add AdminLayout shell with sidebar navigation"
```

---

## Task 8: Create PostsList

**Files:**
- Create: `src/components/Admin/PostsList.tsx`
- Create: `src/components/Admin/PostsList.css`

### Step 8.1: PostsList.tsx

```tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import './PostsList.css';

interface PostListItem {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  sponsored?: boolean;
  affiliateDisclosure?: boolean;
}

export default function PostsList() {
  const { adminToken } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';
        const res = await fetch(`${apiUrl}/api/posts`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    if (adminToken) fetchPosts();
  }, [adminToken]);

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';
      const res = await fetch(`${apiUrl}/api/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : 'unknown'));
    }
  };

  if (loading) return <LoadingSpinner message="Loading posts..." />;
  if (error) return <div className="posts-list__error">Error: {error}</div>;

  return (
    <div className="posts-list">
      <header className="posts-list__header">
        <h1>Posts</h1>
        <button
          className="posts-list__new-btn"
          onClick={() => navigate('/admin/escribir')}>
          + New Post
        </button>
      </header>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search posts..."
        className="posts-list__search"
      />

      {filtered.length === 0 ? (
        <p className="posts-list__empty">
          {search ? 'No posts match your search.' : 'No posts yet. Create one!'}
        </p>
      ) : (
        <table className="posts-list__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Published</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>{p.title}</td>
                <td><code>{p.slug?.current || '—'}</code></td>
                <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '—'}</td>
                <td>
                  {p.sponsored && <span className="posts-list__badge posts-list__badge--sponsored">Sponsored</span>}
                  {p.affiliateDisclosure && <span className="posts-list__badge posts-list__badge--affiliate">Affiliate</span>}
                </td>
                <td className="posts-list__actions">
                  <Link to={`/admin/escribir/${p._id}`} className="posts-list__action">Edit</Link>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="posts-list__action posts-list__action--danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Step 8.2: PostsList.css

```css
.posts-list { max-width: 1100px; }

.posts-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.posts-list__header h1 { margin: 0; }

.posts-list__new-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: 500;
}

.posts-list__new-btn:hover { background: var(--color-primary-hover); }

.posts-list__search {
  width: 100%;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.posts-list__search:focus {
  outline: none;
  border-color: var(--color-primary);
}

.posts-list__empty {
  color: var(--color-text-secondary);
  padding: 2rem;
  text-align: center;
}

.posts-list__error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
  padding: 1rem;
  border-radius: 0.5rem;
}

.posts-list__table {
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 0.5rem;
  overflow: hidden;
}

.posts-list__table th,
.posts-list__table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.9rem;
}

.posts-list__table th {
  background: var(--color-bg-tertiary);
  font-weight: 600;
}

.posts-list__table tr:last-child td { border-bottom: none; }

.posts-list__badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  margin-right: 0.4rem;
}

.posts-list__badge--sponsored {
  background: rgba(217, 119, 87, 0.15);
  color: #d97757;
}

.posts-list__badge--affiliate {
  background: rgba(87, 185, 217, 0.15);
  color: #57b9d9;
}

.posts-list__actions { display: flex; gap: 0.5rem; }

.posts-list__action {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 0.4rem;
  padding: 0.35rem 0.7rem;
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.8rem;
  cursor: pointer;
}

.posts-list__action:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.posts-list__action--danger:hover {
  border-color: #dc2626;
  color: #dc2626;
}
```

### Step 8.3: Commit

```bash
git add src/components/Admin/PostsList.tsx src/components/Admin/PostsList.css
git commit -m "feat(admin): add PostsList with search, table, and delete action"
```

---

## Task 9: Create PostEditor with BlockNote

**Files:**
- Create: `src/components/Admin/PostEditor.tsx`
- Create: `src/components/Admin/PostEditor.css`

### Step 9.1: PostEditor.tsx

```tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote, getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { useAuth } from '../../context/AuthContext';
import { blocksToPortable, portableToBlocks } from '../../utils/blocknoteToPortable';
import LoadingSpinner from '../common/LoadingSpinner';
import './PostEditor.css';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function PostEditor() {
  const { id } = useParams();
  const isEdit = !!id;
  const { adminToken } = useAuth();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 16));
  const [sponsored, setSponsored] = useState(false);
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(false);
  const [mainImage, setMainImage] = useState<{ _id: string; url: string } | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create({ blockSpecs: defaultBlockSpecs }),
    uploadFile: async (file: File) => {
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'X-File-Type': file.type,
          'X-File-Name': file.name,
        },
        body: file,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      return data.url;
    },
  });

  // Auto-slug while user types title (until they manually edit slug)
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  // Load existing post
  useEffect(() => {
    if (!isEdit || !adminToken) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { post } = await res.json();
        setTitle(post.title || '');
        setSlug(post.slug?.current || '');
        setSlugTouched(true);
        setPublishedAt(post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : '');
        setSponsored(!!post.sponsored);
        setAffiliateDisclosure(!!post.affiliateDisclosure);
        setMainImage(post.mainImage?.asset ? { _id: post.mainImage.asset._id, url: post.mainImage.asset.url } : null);
        const blocks = portableToBlocks(post.body || []);
        if (blocks.length) editor.replaceBlocks(editor.document, blocks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, id, adminToken, apiUrl, editor]);

  const uploadMainImage = useCallback(async (file: File) => {
    const res = await fetch(`${apiUrl}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'X-File-Type': file.type,
        'X-File-Name': file.name,
      },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  }, [apiUrl, adminToken]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = blocksToPortable(editor.document);
      const payload = {
        title,
        slug: { _type: 'slug', current: slug },
        body,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        sponsored,
        affiliateDisclosure,
        ...(mainImage
          ? {
              mainImage: {
                _type: 'image',
                asset: { _type: 'reference', _ref: mainImage._id },
              },
            }
          : {}),
      };

      const url = isEdit ? `${apiUrl}/api/posts/${id}` : `${apiUrl}/api/posts`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      navigate('/admin/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading post..." />;

  return (
    <div className="post-editor">
      <header className="post-editor__header">
        <h1>{isEdit ? 'Edit post' : 'New post'}</h1>
        <button onClick={handleSave} disabled={saving || !title || !slug} className="post-editor__save-btn">
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Publish'}
        </button>
      </header>

      {error && <div className="post-editor__error">{error}</div>}

      <div className="post-editor__fields">
        <label className="post-editor__field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title" />
        </label>

        <label className="post-editor__field">
          <span>Slug</span>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="url-friendly-slug"
          />
        </label>

        <label className="post-editor__field">
          <span>Published at</span>
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
          />
        </label>

        <label className="post-editor__field post-editor__field--inline">
          <input
            type="checkbox"
            checked={sponsored}
            onChange={(e) => setSponsored(e.target.checked)}
          />
          <span>Sponsored post</span>
        </label>

        <label className="post-editor__field post-editor__field--inline">
          <input
            type="checkbox"
            checked={affiliateDisclosure}
            onChange={(e) => setAffiliateDisclosure(e.target.checked)}
          />
          <span>Contains affiliate links (show FTC disclosure)</span>
        </label>

        <div className="post-editor__field">
          <span>Main image</span>
          {mainImage && <img src={mainImage.url} alt="" className="post-editor__main-preview" />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const result = await uploadMainImage(file);
                setMainImage(result);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Image upload failed');
              }
            }}
          />
        </div>
      </div>

      <div className="post-editor__body">
        <BlockNoteView editor={editor} theme="dark" slashMenu={false}>
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              filterSuggestionItems(getDefaultReactSlashMenuItems(editor), query)
            }
          />
        </BlockNoteView>
      </div>
    </div>
  );
}
```

### Step 9.2: PostEditor.css

```css
.post-editor { max-width: 900px; }

.post-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.post-editor__header h1 { margin: 0; }

.post-editor__save-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  font-weight: 500;
}

.post-editor__save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.post-editor__error {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.post-editor__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
}

.post-editor__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.post-editor__field span {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.post-editor__field input[type="text"],
.post-editor__field input:not([type="checkbox"]):not([type="file"]),
.post-editor__field input[type="datetime-local"] {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.4rem;
  background: var(--input-bg);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.post-editor__field input:focus { outline: none; border-color: var(--color-primary); }

.post-editor__field--inline {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  grid-column: span 2;
}

.post-editor__main-preview {
  max-width: 240px;
  border-radius: 0.4rem;
  border: 1px solid var(--color-border);
  margin-bottom: 0.5rem;
}

.post-editor__body {
  background: var(--card-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1rem;
  min-height: 400px;
}

.post-editor__body .bn-container { background: transparent; }

@media (max-width: 768px) {
  .post-editor__fields { grid-template-columns: 1fr; }
  .post-editor__field--inline { grid-column: auto; }
}
```

### Step 9.3: Commit

```bash
git add src/components/Admin/PostEditor.tsx src/components/Admin/PostEditor.css
git commit -m "feat(admin): add PostEditor with BlockNote + image upload + metadata"
```

---

## Task 10: Wire admin routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

### Step 10.1: Add routes

Read the current `src/App.tsx`. Add at the top:

```tsx
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const PostsList = lazy(() => import("./components/Admin/PostsList"));
const PostEditor = lazy(() => import("./components/Admin/PostEditor"));
```

Inside the `<Routes>`, add (placement: near the other admin/dashboard routes):

```tsx
<Route element={<AdminLayout />}>
  <Route path="/admin/posts" element={<PostsList />} />
  <Route path="/admin/escribir" element={<PostEditor />} />
  <Route path="/admin/escribir/:id" element={<PostEditor />} />
</Route>
```

This nests the three admin pages inside `AdminLayout` (which provides the sidebar). Auth gate is handled inside `AdminLayout`.

### Step 10.2: Commit

```bash
git add src/App.tsx
git commit -m "feat(admin): wire /admin/posts and /admin/escribir routes"
```

---

## Task 11: Deploy + end-to-end smoke test

### Step 11.1: Deploy backend

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react/analytics-backend
vercel --prod
```

### Step 11.2: Build + deploy frontend

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react
npm run deploy
```

### Step 11.3: End-to-end smoke test

1. Open `https://codewithgabo.com/admin-login`, log in with `ADMIN_TOKEN`.
2. Navigate to `/admin/posts` — should list existing posts.
3. Click "+ New Post". Enter title "Test post from custom editor", verify slug auto-generates.
4. Add a heading + paragraph + bullet list + image upload (drag-drop a small jpg).
5. Click "Publish".
6. Verify in `/allpost` — new post should appear.
7. Click the new post in the list, verify body renders correctly.
8. Go back to `/admin/posts`, edit the post (e.g. add a paragraph), save, verify updated.
9. Delete the test post.

If anything fails, debug per the systematic-debugging skill.

### Step 11.4: Mark Slice 3 complete in design doc + commit

Append to `docs/plans/2026-04-27-admin-panel-monetization-design.md` under Slice progress:

```markdown
- ✅ **Slice 3 — Custom post editor (BlockNote)** completed YYYY-MM-DD. ...commits list...
```

---

## Done criteria for Slice 3

- [ ] Backend has 3 new endpoints: `POST/GET /api/posts`, `GET/PUT/DELETE /api/posts/[id]`, `POST /api/upload`
- [ ] All endpoints respond correctly via `curl` smoke tests
- [ ] Frontend has 3 new admin pages reachable via the sidebar
- [ ] BlockNote editor loads existing posts (mapper round-trip works)
- [ ] Image upload from BlockNote completes and the uploaded image renders in the body
- [ ] Saved posts appear in `/allpost` and render correctly via `OnePost`
- [ ] Each task committed atomically; no `Co-Authored-By` trailer
- [ ] Deployment + end-to-end test pass

---

## Skills referenced

- @superpowers:executing-plans
- @superpowers:verification-before-completion
- @superpowers:systematic-debugging
- @superpowers:test-driven-development (light — verification by curl + UI smoke instead of unit tests)
