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
          onClick={() => navigate('/admin/write')}>
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
                  <Link to={`/admin/write/${p._id}`} className="posts-list__action">Edit</Link>
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
