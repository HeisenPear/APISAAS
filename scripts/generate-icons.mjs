// Génère tous les icons APIGO avec fond honey (#F5A623) + logo sur fond transparent.
// Remplace le fond noir du logo par la couleur honey.
// Usage : node scripts/generate-icons.mjs

import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const HONEY = { r: 245, g: 166, b: 35 };   // #F5A623
const BLACK_THRESHOLD = 40;                 // pixels en dessous = fond noir à remplacer

async function logoOnHoney(sizePx) {
  const src = await sharp('public/logo_apigo.webp')
    .resize(sizePx, sizePx, { kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(sizePx * sizePx * 4);

  for (let i = 0; i < sizePx * sizePx; i++) {
    const r = src.data[i * 3];
    const g = src.data[i * 3 + 1];
    const b = src.data[i * 3 + 2];
    const isBlack = r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD;

    rgba[i * 4]     = isBlack ? HONEY.r : r;
    rgba[i * 4 + 1] = isBlack ? HONEY.g : g;
    rgba[i * 4 + 2] = isBlack ? HONEY.b : b;
    rgba[i * 4 + 3] = 255;
  }

  return sharp(rgba, { raw: { width: sizePx, height: sizePx, channels: 4 } });
}

async function main() {
  await mkdir('public/icons', { recursive: true });

  // favicon.ico (32px PNG — les navigateurs modernes acceptent PNG dans .ico)
  await (await logoOnHoney(32)).png().toFile('public/favicon.ico');
  console.log('✅ favicon.ico (32px)');

  // PWA icons
  await (await logoOnHoney(192)).png().toFile('public/icons/icon-192.png');
  console.log('✅ icons/icon-192.png');

  await (await logoOnHoney(512)).png().toFile('public/icons/icon-512.png');
  console.log('✅ icons/icon-512.png');

  // Apple touch icons
  const appleSizes = [180, 167, 152, 120, 76, 60];
  for (const size of appleSizes) {
    const dest = size === 180
      ? 'public/apple-touch-icon.png'
      : `public/apple-touch-icon-${size}x${size}.png`;
    await (await logoOnHoney(size)).png().toFile(dest);
    console.log(`✅ ${dest}`);
  }

  // Variantes precomposed (même chose)
  await (await logoOnHoney(180)).png().toFile('public/apple-touch-icon-precomposed.png');
  await (await logoOnHoney(120)).png().toFile('public/apple-touch-icon-120x120-precomposed.png');
  console.log('✅ apple-touch-icon-precomposed variants');
}

main().catch(console.error);
