/* eslint-disable no-console -- script CLI : la console est sa sortie. */
// Génère les assets PWA dérivés du logo : icônes maskable (Android adaptive,
// safe-zone 80 %) + splash screens iOS (apple-touch-startup-image, portrait).
// Source = public/icons/icon-512.png (abeille miel/blanc sur fond sombre → les
// pétales blancs imposent un fond sombre, échantillonné pour un rendu sans
// coutures). Régénération : `node scripts/generate-pwa-assets.mjs`.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'public/icons/icon-512.png';

// Couleur de fond = pixel coin haut-gauche du logo (match exact).
const corner = await sharp(SRC).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
const bg = { r: corner[0], g: corner[1], b: corner[2], alpha: 1 };
console.log(`Fond échantillonné : rgb(${bg.r}, ${bg.g}, ${bg.b})`);

// Logo détouré : on retire la bordure de fond uniforme de la source (.trim) pour
// éliminer tout liseré carré une fois recomposé sur un fond plein.
async function logoFitted(box) {
  return sharp(SRC)
    .trim({ threshold: 12 })
    .resize(box, box, { fit: 'contain', background: bg })
    .toBuffer();
}

// ── Icônes maskable : logo à 80 % centré sur le fond (zone de sécurité) ──
for (const size of [192, 512]) {
  const logo = await logoFitted(Math.round(size * 0.8));
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`public/icons/icon-maskable-${size}.png`);
  console.log(`✓ icon-maskable-${size}.png`);
}

// ── Splash iOS (portrait) — logo centré ~38 % sur fond plein ──
// [largeur CSS, hauteur CSS, dpr] → dimensions pixel = css × dpr.
const DEVICES = [
  [375, 667, 2], // iPhone SE2/SE3, 8
  [414, 896, 2], // iPhone XR, 11
  [375, 812, 3], // iPhone X/XS, 11 Pro, 12/13 mini
  [390, 844, 3], // iPhone 12/13/14
  [393, 852, 3], // iPhone 14 Pro, 15/15 Pro, 16
  [402, 874, 3], // iPhone 16 Pro
  [414, 736, 3], // iPhone 8 Plus
  [414, 896, 3], // iPhone XS Max, 11 Pro Max
  [428, 926, 3], // iPhone 12/13 Pro Max, 14 Plus
  [430, 932, 3], // iPhone 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [440, 956, 3], // iPhone 16 Pro Max
];

await mkdir('public/splash', { recursive: true });
const links = [];
for (const [dw, dh, dpr] of DEVICES) {
  const pw = dw * dpr;
  const ph = dh * dpr;
  const logo = await logoFitted(Math.round(Math.min(pw, ph) * 0.38));
  const href = `/splash/apple-splash-${pw}x${ph}.png`;
  await sharp({ create: { width: pw, height: ph, channels: 4, background: bg } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`public${href}`);
  links.push({
    rel: 'apple-touch-startup-image',
    media: `(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    href,
  });
}
console.log(`✓ ${DEVICES.length} splash screens`);
console.log('\n--- À coller dans nuxt.config head.link ---');
console.log(JSON.stringify(links, null, 2));
