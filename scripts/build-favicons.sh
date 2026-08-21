#!/usr/bin/env bash
# Builds every favicon from the hero illustration.
#
# Replaces scripts/generate-favicons.mjs, which only ever emitted logo192/512
# from favicon.svg and never touched favicon.ico — so the .ico stayed the
# Create React App React logo from 2023, and that is the file browser tabs
# actually reach for.
#
# Three decisions worth knowing:
#
#   1. The source is CROPPED TO THE HEAD. src/assets/nobggabo.webp is a whole
#      scene — figure, laptop, desk, six floating tech badges. Scaled to 16px
#      that is an unreadable smudge. The head alone still reads as a person.
#
#   2. It sits on an indigo rounded square. The source has an alpha channel,
#      and a transparent favicon vanishes against a dark tab bar. The radius
#      matches the old favicon.svg so the mark keeps its shape language.
#
#   3. There is no favicon.svg any more. index.html used to link one alongside
#      the .ico and browsers pick whichever they prefer, so the two files had to
#      agree — but an SVG wrapping a raster is just a 200 KB PNG in a costume,
#      downloaded on every visit, with none of a vector's crispness. The .ico
#      carries 16/32/48 and covers every tab. The old "GA" vector is in git.
#
# Usage: bash scripts/build-favicons.sh
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Google Chrome not found at $CHROME" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/src/assets/nobggabo.webp"
PUB="$ROOT/public"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Crop window into the 1024x1024 source, centred on the head.
CROP_X=424; CROP_Y=149; CROP_SIZE=306
BG="#6366F1"
RADIUS_AT_512=76

sips -s format png "$SRC" --out "$TMP/src.png" >/dev/null
B64="$(base64 -i "$TMP/src.png" | tr -d '\n')"

render() { # render <size> <outfile>
  local s="$1" out="$2"
  local f img left top radius
  f=$(python3 -c "print($s/$CROP_SIZE)")
  img=$(python3 -c "print(round(1024*$f))")
  left=$(python3 -c "print(round(-$CROP_X*$f))")
  top=$(python3 -c "print(round(-$CROP_Y*$f))")
  radius=$(python3 -c "print(round($RADIUS_AT_512*$s/512))")
  cat > "$TMP/page.html" <<HTML
<!doctype html><meta charset="utf-8">
<style>
 html,body{margin:0;padding:0;overflow:hidden;background:transparent}
 .icon{width:${s}px;height:${s}px;border-radius:${radius}px;background:${BG};
       overflow:hidden;position:relative}
 .icon img{position:absolute;width:${img}px;height:${img}px;left:${left}px;top:${top}px}
</style>
<div class="icon"><img src="data:image/png;base64,${B64}"></div>
HTML
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size="$s","$s" --default-background-color=00000000 \
    --screenshot="$out" "file://$TMP/page.html" >/dev/null 2>&1
}

for s in 16 32 48 192 512; do render "$s" "$TMP/f$s.png"; done

cp "$TMP/f192.png" "$PUB/logo192.png"   # also the apple-touch-icon
cp "$TMP/f512.png" "$PUB/logo512.png"

# Pack 16/32/48 into a real multi-size .ico. PNG payloads inside ICO are
# understood by every browser that matters and keep the file small.
python3 - "$TMP" "$PUB/favicon.ico" <<'PY'
import struct, sys
tmp, out = sys.argv[1], sys.argv[2]
imgs = [(s, open(f"{tmp}/f{s}.png", "rb").read()) for s in (16, 32, 48)]
header = struct.pack("<HHH", 0, 1, len(imgs))
offset = 6 + 16 * len(imgs)
entries = b""
blobs = b""
for size, blob in imgs:
    entries += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(blob), offset)
    blobs += blob
    offset += len(blob)
open(out, "wb").write(header + entries + blobs)
PY


printf '%-16s %s\n' \
  favicon.ico "$(file -b "$PUB/favicon.ico" | cut -c1-60)" \
  logo192.png "$(sips -g pixelWidth "$PUB/logo192.png" | tail -1 | tr -d ' ')" \
  logo512.png "$(sips -g pixelWidth "$PUB/logo512.png" | tail -1 | tr -d ' ')"
