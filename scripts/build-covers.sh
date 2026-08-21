#!/usr/bin/env bash
# Rasterises the post cover SVGs to 1200x630 PNGs.
#
# Sanity's /api/upload endpoint rejects SVG (ALLOWED_MIME is jpeg/png/webp/gif),
# so covers ship as PNG.
#
# Uses headless Chrome rather than qlmanage: QuickLook ignores the SVG viewBox,
# clipping the right-hand artwork and padding the bottom with white.
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/covers"
OUT="$DIR/out"
mkdir -p "$OUT"

for svg in "$DIR"/*.svg; do
  name="$(basename "$svg" .svg)"
  # Wrap the SVG in a zero-margin page so the screenshot is exactly the artwork.
  html="$OUT/$name.html"
  {
    printf '<!doctype html><meta charset="utf-8">'
    printf '<style>html,body{margin:0;padding:0;overflow:hidden}svg{display:block}</style>'
    cat "$svg"
  } > "$html"

  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1200,630 \
    --screenshot="$OUT/$name.png" "file://$html" >/dev/null 2>&1

  rm -f "$html"
  printf '%-16s %s\n' "$name" "$(sips -g pixelWidth -g pixelHeight "$OUT/$name.png" | tail -2 | tr -d ' \n')"
done
