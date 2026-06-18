// Génère favicon + icônes PWA + Apple touch à partir du logo Maya (maya-icon.svg).
// Le logo « rayon de miel » sur fond crème (#fdf5e6) remplace l'ancien logo APIGO.
// Usage : node scripts/generate-maya-icons.mjs

import sharp from 'sharp';

const SRC = 'public/icons/maya-icon.svg';

// Densité élevée : le viewBox 64 doit rester net jusqu'à 512 px.
// flatten sur crème (#fdf5e6) : icône carrée pleine, sans coins transparents
// → propre pour le masquage PWA (maskable) et le favicon .ico.
function render(size) {
  return sharp(SRC, { density: 600 })
    .resize(size, size, { fit: 'contain' })
    .flatten({ background: '#fdf5e6' })
    .png();
}

async function main() {
  // favicon.ico (PNG 32 — les navigateurs modernes acceptent le PNG dans .ico)
  await render(32).toFile('public/favicon.ico');

  // PWA
  await render(192).toFile('public/icons/icon-192.png');
  await render(512).toFile('public/icons/icon-512.png');

  // Apple touch icons (tailles référencées dans nuxt.config head)
  for (const s of [180, 167, 152, 120, 76, 60]) {
    const dest =
      s === 180 ? 'public/apple-touch-icon.png' : `public/apple-touch-icon-${s}x${s}.png`;
    await render(s).toFile(dest);
  }
  await render(180).toFile('public/apple-touch-icon-precomposed.png');
  await render(120).toFile('public/apple-touch-icon-120x120-precomposed.png');

  console.error('Maya icons générées (favicon + PWA + Apple) depuis maya-icon.svg');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
