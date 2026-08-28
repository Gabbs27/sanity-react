#!/usr/bin/env bash
# Re-encodes the project screenshots in public/images/.
#
# The byte budget found them: the home page transferred 3541 KB, of which 2.6 MB
# was nine PNGs served at 1200px or wider and displayed at 363x204. They are a
# third lifecycle — not bundled, so a build audit never saw them, and not from
# the CMS, so the sizedImage helper never saw them either. Static files copied
# verbatim by Vite, referenced by string path from src/assets/data.ts.
#
# There is no CDN to transform them, so they have to be re-encoded on disk.
#
# Width 800 rather than 363: the cards render at 363 CSS pixels and a retina
# screen asks for twice that. Aspect ratio is preserved and the CSS keeps
# cropping with object-fit, so nothing about the layout changes — pre-cropping
# to today's ratio would look identical now and be wrong the day the card
# changes shape.
#
# Chrome does the encoding through a canvas, which is how the favicons are built
# too. macOS sips cannot write WebP.
#
# Usage: bash scripts/optimize-images.sh
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIR="$ROOT/public/images"
WIDTH=800
QUALITY=0.82
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

printf '  %-26s %10s %10s %8s\n' FILE BEFORE AFTER SAVED
printf '  %s\n' "$(printf '─%.0s' {1..58})"

before_total=0
after_total=0

for src in "$DIR"/*.png "$DIR"/*.jpg "$DIR"/*.jpeg; do
  [ -e "$src" ] || continue
  name="$(basename "$src")"
  stem="${name%.*}"
  out="$DIR/$stem.webp"

  before=$(stat -f%z "$src")

  # Draw into a canvas at the target width and read back WebP. The page reports
  # the data URL through the title, which is the simplest channel out of a
  # headless render without a debugging protocol.
  b64="$(base64 -i "$src" | tr -d '\n')"
  cat > "$TMP/enc.html" <<HTML
<!doctype html><meta charset="utf-8">
<script>
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, ${WIDTH} / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    document.title = c.toDataURL('image/webp', ${QUALITY});
  };
  img.src = "data:image/png;base64,${b64}";
</script>
HTML

  "$CHROME" --headless --disable-gpu --no-first-run \
    --virtual-time-budget=8000 --dump-dom "file://$TMP/enc.html" \
    > "$TMP/dom.html" 2>/dev/null

  python3 - "$TMP/dom.html" "$out" <<'PY'
import re, sys, base64
dom = open(sys.argv[1], encoding='utf-8', errors='ignore').read()
m = re.search(r'<title>data:image/webp;base64,([A-Za-z0-9+/=]+)</title>', dom)
if not m:
    sys.exit("    could not read the encoded image out of the render")
open(sys.argv[2], 'wb').write(base64.b64decode(m.group(1)))
PY

  after=$(stat -f%z "$out")
  before_total=$((before_total + before))
  after_total=$((after_total + after))
  printf '  %-26s %9sK %9sK %7s%%\n' "$stem" \
    "$((before / 1024))" "$((after / 1024))" "$((100 - after * 100 / before))"
done

printf '  %s\n' "$(printf '─%.0s' {1..58})"
printf '  %-26s %9sK %9sK %7s%%\n' TOTAL \
  "$((before_total / 1024))" "$((after_total / 1024))" \
  "$((100 - after_total * 100 / before_total))"
echo
echo "  WebP written next to the originals. Update src/assets/data.ts to point at"
echo "  the .webp files, then delete the PNGs once nothing references them."
