/**
 * Génère public/og-image.jpg — image de partage Open Graph / Twitter (1200×630).
 * Remplace l'ancien PNG 200×200 mal nommé. Exécuter : node scripts/generate-og-image.mjs
 * (regénérer si la marque / l'accroche change).
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'og-image.jpg');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1C1C1E"/>
      <stop offset="1" stop-color="#2C2C30"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="10" fill="#F5A623"/>
  <text x="600" y="250" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="128" font-weight="700" fill="#F5A623" letter-spacing="4">APIGO</text>
  <rect x="540" y="288" width="120" height="6" rx="3" fill="#F5A623"/>
  <text x="600" y="376" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="600" fill="#FFFFFF">Le logiciel de gestion apicole tout-en-un</text>
  <text x="600" y="440" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="29" fill="#A8A29E">Suivi des ruches &#183; conformit&#233; &#183; facturation &#8212; mobile &amp; web</text>
  <text x="600" y="568" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="#F5A623">apigo.fr</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(OUT);
console.warn('✅  og-image.jpg généré (1200x630) :', OUT);
