/**
 * Generate PNG favicons from SVG.
 *
 * Usage:
 *   npm install --save-dev @resvg/resvg-js
 *   node scripts/generate-favicons.mjs
 *
 * This script creates logo192.png and logo512.png in the public/ directory
 * from the favicon.svg design.
 *
 * Requires @resvg/resvg-js for SVG-to-PNG conversion.
 * Alternatively, on macOS you can convert manually:
 *   qlmanage -t -s 192 -o /tmp public/favicon.svg && mv /tmp/favicon.svg.png public/logo192.png
 *   qlmanage -t -s 512 -o /tmp public/favicon.svg && mv /tmp/favicon.svg.png public/logo512.png
 */

import { existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const svgPath = resolve(publicDir, "favicon.svg");

const sizes = [
  { name: "logo192.png", size: 192 },
  { name: "logo512.png", size: 512 },
];

/**
 * Generate a standalone SVG string for a given pixel size.
 */
function generateSvgForSize(size) {
  const rx = Math.round((size * 76) / 512);
  const fontSize = Math.round((size * 240) / 512);
  const cx = size / 2;
  const cy = size / 2 + Math.round((size * 40) / 512);
  const letterSpacing = Math.round((size * 8) / 512);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="#6366F1"/>
  <text x="${cx}" y="${cy}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central" letter-spacing="-${letterSpacing}">GA</text>
</svg>`;
}

async function main() {
  console.log("Generating favicon PNGs...\n");

  if (!existsSync(svgPath)) {
    console.error("Error: favicon.svg not found in public/");
    process.exit(1);
  }

  let Resvg;
  try {
    const mod = await import("@resvg/resvg-js");
    Resvg = mod.Resvg;
  } catch {
    console.error("Error: @resvg/resvg-js is not installed.\n");
    console.log("Install it with:");
    console.log("  npm install --save-dev @resvg/resvg-js\n");
    console.log("Then run this script again:");
    console.log("  node scripts/generate-favicons.mjs\n");
    console.log("Or convert manually on macOS:");
    for (const { name, size } of sizes) {
      console.log(
        `  qlmanage -t -s ${size} -o /tmp public/favicon.svg && mv /tmp/favicon.svg.png public/${name}`
      );
    }
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    const svg = generateSvgForSize(size);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: size },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    const outPath = resolve(publicDir, name);
    writeFileSync(outPath, pngBuffer);
    console.log(`  Created ${name} (${size}x${size})`);
  }

  console.log("\nDone! PNG favicons generated in public/");
}

main();
