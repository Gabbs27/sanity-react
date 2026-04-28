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
