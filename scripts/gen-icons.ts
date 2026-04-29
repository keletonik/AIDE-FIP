// Generate PNG icons from public/icon.svg.
// Run: tsx scripts/gen-icons.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SVG = readFileSync(join(ROOT, 'public', 'icon.svg'));

async function emit(name: string, size: number, padPct = 0, bg: string | null = null) {
  const inner = Math.round(size * (1 - padPct));
  const off = Math.round((size - inner) / 2);
  const layers: sharp.OverlayOptions[] = [
    { input: await sharp(SVG, { density: 384 }).resize(inner, inner).png().toBuffer(), top: off, left: off },
  ];
  const base = bg
    ? sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 11, g: 13, b: 16, alpha: 1 } } });
  const out = await base.composite(layers).png().toBuffer();
  const path = join(ROOT, 'public', name);
  writeFileSync(path, out);
  console.log(`wrote ${name} (${size}x${size}, padding ${(padPct * 100).toFixed(0)}%)`);
}

async function main() {
  // Standard PWA icons (Android Chrome installability)
  await emit('icon-192.png', 192);
  await emit('icon-512.png', 512);
  // Maskable: Android requires ~40% safe zone (icon stays inside 60% inner circle)
  await emit('icon-512-maskable.png', 512, 0.20);
  // Apple touch icon: 180x180, opaque, no transparency
  await emit('apple-touch-icon.png', 180, 0, '#0b0d10');
}

main().catch((err) => { console.error(err); process.exit(1); });
