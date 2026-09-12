/**
 * The staleness hash for src/config/static-pages.json.
 *
 * Lives in its own module because both sides need it and neither can import the
 * other: capture-static.mjs starts an HTTP server and launches Chrome at the top
 * level, so importing it from a test would do all of that as a side effect.
 *
 * Two copies of the formula would be worse than none. A staleness alarm that
 * drifts goes red on a correct capture until somebody deletes the test.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Every capture contains the page's own component AND the chrome around it: the
// nav and the footer are in all eight. Hashing only the route's component left a
// hole — renaming one nav link staled all eight captures and nothing went red,
// because no mapped component had changed. Found by doing exactly that.
export const SHARED = [
  'src/components/navheader/NavHeader.tsx',
  'src/components/Footer.tsx',
];

export function captureHash(root, component) {
  const h = createHash('sha256');
  for (const file of [component, ...SHARED]) {
    h.update(readFileSync(join(root, file), 'utf8'));
  }
  return h.digest('hex').slice(0, 16);
}
