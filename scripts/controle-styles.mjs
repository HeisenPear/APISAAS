#!/usr/bin/env node
/**
 * Contrôle de l'attente de feuille de style — le pendant de `controle-sonde`.
 *
 * ⚠️ POURQUOI CE CONTRÔLE EXISTE : LE DÉFAUT ÉTAIT PROBABILISTE.
 *
 * L'audit mesurait la page avant que sa feuille de style ne soit posée, environ
 * deux fois sur cinq. Sur une page sans style il n'y a ni débordement, ni
 * chevauchement, ni contraste : elle rendait donc « propre » sans avoir rien
 * regardé, et signalait à l'inverse des éléments qu'une largeur donnée masque.
 *
 * Une porte pareille ne se vérifie PAS en relançant l'audit : trois exécutions
 * vertes d'affilée ne prouvent rien quand l'échec tombe deux fois sur cinq. Il
 * faut fabriquer la condition — une feuille délibérément lente — et vérifier
 * que l'attente la voit.
 *
 * Les trois cas ci-dessous couvrent les trois issues, et le troisième est le
 * plus important : une feuille qui n'arrive JAMAIS doit faire ÉCHOUER le
 * scénario, pas le laisser passer pour propre.
 *
 * Usage : PLAYWRIGHT_CHROMIUM_PATH=… node scripts/controle-styles.mjs
 */
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { attendreLaFeuilleDeStyle, LIRE_ETAT_CSS, feuillePosee } from './attendre-styles.mjs';

const CHROME = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/** Assez de règles pour dépasser le seuil : c'est ce qu'une vraie feuille a. */
const FEUILLE = Array.from({ length: 400 }, (_, i) => `.r${i}{margin:0}`).join('\n') +
  '\n.cachee-en-petit{display:none}';

/**
 * Un serveur qui SAIT RETARDER sa feuille de style. `retardMs` reproduit ce que
 * fait un vrai serveur chargé ; `jamais` reproduit un `<link>` mort.
 */
function serveur({ retardMs = 0, jamais = false }) {
  return createServer((req, rep) => {
    if (req.url === '/style.css') {
      if (jamais) return; // jamais de réponse : la socket reste ouverte
      setTimeout(() => {
        rep.writeHead(200, { 'content-type': 'text/css' });
        rep.end(FEUILLE);
      }, retardMs);
      return;
    }
    rep.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    rep.end(
      `<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head>` +
        `<body><div class="cachee-en-petit"><a href="/x"></a></div></body></html>`,
    );
  });
}

async function surServeur(options, travail) {
  const s = serveur(options);
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  const port = s.address().port;
  try {
    return await travail(`http://127.0.0.1:${port}/`);
  } finally {
    s.closeAllConnections?.();
    s.close();
  }
}

const nav = await chromium.launch({ executablePath: CHROME });
let echecs = 0;
const dire = (ok, texte) => {
  if (!ok) echecs++;
  console.log(`${ok ? '✓' : '✖'} ${texte}`);
};

// ── Cas 1 : sans l'attente, on mesure BIEN une page sans style ───────────────
// Le cas qui prouve que le défaut existait. S'il devenait vert, c'est que le
// navigateur a changé de comportement — et que ce contrôle ne mesure plus rien.
await surServeur({ retardMs: 400 }, async (url) => {
  const ctx = await nav.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const etat = await page.evaluate(LIRE_ETAT_CSS);
  dire(
    !feuillePosee(etat),
    `sans attente, la page est mesurée SANS son style (${etat.posees}/${etat.liens} liens, ${etat.regles} règles) — c'est le défaut d'origine`,
  );
  await ctx.close();
});

// ── Cas 2 : avec l'attente, le style est là, et il s'applique ────────────────
await surServeur({ retardMs: 400 }, async (url) => {
  const ctx = await nav.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const etat = await attendreLaFeuilleDeStyle(page, 'contrôle · feuille lente');
  // On ne se contente pas du compte de règles : on vérifie que le style AGIT.
  // C'est la propriété qui manquait — un élément masqué par le CSS était vu.
  const masque = await page.evaluate(
    () => getComputedStyle(document.querySelector('.cachee-en-petit')).display,
  );
  dire(feuillePosee(etat), `avec attente, la feuille est posée (${etat.regles} règles)`);
  dire(masque === 'none', `avec attente, le style AGIT vraiment (display « ${masque} », attendu « none »)`);
  await ctx.close();
});

// ── Cas 3 : une feuille qui n'arrive jamais doit FAIRE ÉCHOUER ───────────────
// Le cas décisif. Une attente qui abandonne en silence et laisse mesurer
// remettrait exactement le défaut d'origine, avec une fonction en plus.
await surServeur({ jamais: true }, async (url) => {
  const ctx = await nav.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 780 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  let jete = null;
  try {
    await attendreLaFeuilleDeStyle(page, 'contrôle · feuille morte', 1200);
  } catch (e) {
    jete = e;
  }
  dire(jete !== null, 'une feuille qui n’arrive jamais fait ÉCHOUER le scénario au lieu de le déclarer propre');
  dire(
    Boolean(jete && /feuille de style absente/.test(jete.message) && /contrôle · feuille morte/.test(jete.message)),
    'et l’erreur nomme la page — une porte qui échoue sans dire où coûte une demi-heure',
  );
  await ctx.close();
});

await nav.close();
if (echecs) {
  console.log(`\n${echecs} cas de contrôle en échec : l’attente de feuille de style ne tient pas.`);
  process.exit(1);
}
console.log('\n✓ 5 cas de contrôle : on ne mesure plus une page avant son style.');
