import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote, getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react';
import '@blocknote/mantine/style.css';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 16));
  const [sponsored, setSponsored] = useState(false);
  const [affiliateDisclosure, setAffiliateDisclosure] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
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
        setTagsInput(Array.isArray(post.tags) ? post.tags.join(', ') : '');
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
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title,
        slug: { _type: 'slug', current: slug },
        body,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        sponsored,
        affiliateDisclosure,
        tags,
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
      // Log full stack to console so it can be copied if the message alone
      // is too vague (e.g. "T is not iterable" from a bad block shape).
      console.error('[PostEditor] save failed:', err);
      const detail =
        err instanceof Error
          ? `${err.message}${err.stack ? `\n\n${err.stack.split('\n').slice(0, 4).join('\n')}` : ''}`
          : 'Save failed';
      setError(detail);
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

        <label className="post-editor__field">
          <span>Tags</span>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="comma-separated, e.g. React, TypeScript, Vercel"
          />
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
        <BlockNoteView editor={editor} theme={isDark ? 'dark' : 'light'} slashMenu={false}>
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
