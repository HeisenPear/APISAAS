// Génère tous les icons APIGO à partir du logo officiel — fond NOIR conservé
// (comme le vrai logo). On ne remplace plus le fond par du honey : le favicon
// Google, les icônes PWA et Apple touch reprennent le logo sur fond noir.
// Usage : node scripts/generate-icons.mjs

import sharp from 'sharp';
import { mkdir } from 'fs/promises';

const BG = { r: 28, g: 28, b: 30 }; // #1c1c1e — noir Apple, pour aplatir toute transparence

function logo(sizePx) {
  return sharp('public/logo_apigo.webp')
    .resize(sizePx, sizePx, { kernel: sharp.kernel.lanczos3 })
    .flatten({ background: BG }); // toute zone transparente devient noir (jamais blanc/jaune)
}

async function main() {
  await mkdir('public/icons', { recursive: true });

  // favicon.ico (32px PNG — les navigateurs modernes acceptent PNG dans .ico)
  await logo(32).png().toFile('public/favicon.ico');
  console.error('favicon.ico (32px)');

  // PWA icons
  await logo(192).png().toFile('public/icons/icon-192.png');
  await logo(512).png().toFile('public/icons/icon-512.png');
  console.error('icons/icon-192.png + icon-512.png');

  // Apple touch icons
  const appleSizes = [180, 167, 152, 120, 76, 60];
  for (const size of appleSizes) {
    const dest =
      size === 180 ? 'public/apple-touch-icon.png' : `public/apple-touch-icon-${size}x${size}.png`;
    await logo(size).png().toFile(dest);
    console.error(dest);
  }

  // Variantes precomposed
  await logo(180).png().toFile('public/apple-touch-icon-precomposed.png');
  await logo(120).png().toFile('public/apple-touch-icon-120x120-precomposed.png');
  console.error('apple-touch-icon-precomposed variants');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
