/**
 * Markdown → Portable Text converter for blog posts.
 *
 * Emits only what `codewithgabo/schemas/blockContent.ts` accepts, and only
 * what `src/components/OnePost.tsx` can render. Two constraints matter:
 *
 *   1. Code fences become blocks with `style: 'code'`, NOT `_type: 'codeBlock'`.
 *      OnePost registers a renderer for `block.code` only; a `codeBlock` array
 *      member would reach PortableText with no matching component.
 *   2. Every block carries `markDefs`, even when empty, so the link marks on
 *      spans always have somewhere to resolve.
 *
 * Deliberately not a general-purpose markdown parser: it handles the subset the
 * drafts use (headings, paragraphs, lists, quotes, fences, bold/italic/code/links).
 */
import { randomUUID } from 'node:crypto';

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);

// Splits a line of markdown into spans, collecting link definitions as it goes.
// Handled inline: `code`, **strong**, *em* / _em_, [text](href).
// Code is matched first so markdown characters inside backticks stay literal.
function inlineToSpans(text) {
  const spans = [];
  const markDefs = [];

  const push = (str, marks) => {
    if (!str) return;
    spans.push({ _type: 'span', _key: key(), text: str, marks });
  };

  const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\(([^)\s]+)\)/;

  let rest = text;
  while (rest) {
    const m = rest.match(TOKEN);
    if (!m) {
      push(rest, []);
      break;
    }
    push(rest.slice(0, m.index), []);

    if (m[1] !== undefined) push(m[1], ['code']);
    else if (m[2] !== undefined) push(m[2], ['strong']);
    else if (m[3] !== undefined) push(m[3], ['em']);
    else if (m[4] !== undefined) push(m[4], ['em']);
    else if (m[5] !== undefined) {
      const linkKey = key();
      markDefs.push({ _type: 'link', _key: linkKey, href: m[6], blank: true });
      push(m[5], [linkKey]);
    }

    rest = rest.slice(m.index + m[0].length);
  }

  if (!spans.length) push('', []);
  return { spans, markDefs };
}

function textBlock(raw, extra = {}) {
  const { spans, markDefs } = inlineToSpans(raw);
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    ...extra,
    markDefs,
    children: spans,
  };
}

// Groups raw lines into logical chunks. Fenced code survives intact — blank
// lines inside a fence belong to the code, not to the document structure.
function chunk(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const chunks = [];
  let paragraph = [];

  const flush = () => {
    if (paragraph.length) chunks.push({ kind: 'para', lines: paragraph });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      flush();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      chunks.push({ kind: 'code', lines: code });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    // These start their own block rather than joining the paragraph above.
    if (/^\s*(#{1,6}\s|[-*]\s|\d+\.\s|>\s?)/.test(line)) {
      flush();
      chunks.push({ kind: 'line', lines: [line] });
      continue;
    }

    paragraph.push(line);
  }
  flush();
  return chunks;
}

export function mdToPortable(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) return [];
  const blocks = [];

  for (const c of chunk(markdown)) {
    if (c.kind === 'code') {
      blocks.push({
        _type: 'block',
        _key: key(),
        style: 'code',
        markDefs: [],
        children: [
          { _type: 'span', _key: key(), text: c.lines.join('\n').replace(/\s+$/, ''), marks: [] },
        ],
      });
      continue;
    }

    if (c.kind === 'para') {
      blocks.push(textBlock(c.lines.join(' ').trim()));
      continue;
    }

    const line = c.lines[0];

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      // '#' is reserved for the post title, which lives in its own field, so
      // a lone '#' in the body still renders as h1 if a draft ever needs one.
      const level = Math.min(heading[1].length, 4);
      blocks.push(textBlock(heading[2].trim(), { style: `h${level}` }));
      continue;
    }

    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      blocks.push(textBlock(quote[1].trim(), { style: 'blockquote' }));
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      blocks.push(textBlock(bullet[1].trim(), { listItem: 'bullet', level: 1 }));
      continue;
    }

    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (numbered) {
      blocks.push(textBlock(numbered[1].trim(), { listItem: 'number', level: 1 }));
      continue;
    }

    blocks.push(textBlock(line.trim()));
  }

  return blocks;
}
