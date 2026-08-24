#!/usr/bin/env node
/**
 * Contrôle POSITIF de la sonde de mise en page.
 *
 * Une porte de CI qui ne trouve rien peut vouloir dire deux choses : « tout va
 * bien » ou « je ne regarde rien ». Ce script fabrique les deux cas — un défaut
 * qui DOIT être vu, un motif légitime qui NE DOIT PAS l'être — et refuse de
 * passer si la sonde se trompe de camp.
 *
 * Il est né de trois échecs successifs : `getBoundingClientRect`, puis
 * `getClientRects`, puis une mesure de boîtes qui accusait un cercle décoratif.
 * Chacune est restée verte sur un cas fabriqué exprès pour la faire rougir.
 *
 * Usage : PLAYWRIGHT_CHROMIUM_PATH=… node scripts/controle-sonde.mjs
 */
import { chromium } from '@playwright/test';
import { SONDE } from './sonde-mise-en-page.mjs';

const CHROME = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/** Le style minimal commun : rien qui puisse déclencher une AUTRE règle. */
const SOCLE = `<style>
  body { margin: 0; padding: 24px; background: #fff; color: #111; font: 16px/1.5 system-ui, sans-serif; }
</style>`;

const CAS = [
  {
    nom: 'texte qui sort de sa propre boîte, dans un cadre qui rogne',
    attendu: true,
    html: `<div style="width:200px;overflow:hidden;border:1px solid #ccc">
             <p style="white-space:nowrap;margin:0">Numéro de lot 2026-A-00147 · récolte du 12 juillet</p>
           </div>`,
  },
  {
    nom: 'tableau plus large que son enveloppe rognée',
    attendu: true,
    html: `<div style="width:320px;overflow:hidden">
             <table style="min-width:640px;border-collapse:collapse">
               <tbody><tr>
                 <td style="padding:8px">Sous-traitant</td>
                 <td style="padding:8px">Rôle assuré pour le compte du responsable</td>
                 <td style="padding:8px">Localisation des serveurs</td>
               </tr></tbody>
             </table>
           </div>`,
  },
  {
    nom: 'décor posé hors cadre exprès (le motif de la carte « Réforme 2026 »)',
    attendu: false,
    html: `<div style="width:420px;overflow:hidden;border:1px solid #ccc">
             <div style="position:relative;padding:24px">
               <div aria-hidden="true" style="pointer-events:none;position:absolute;right:-40px;top:-40px;width:192px;height:192px;border-radius:9999px;background:#fbf3e4"></div>
               <p style="position:relative;margin:0">Format Factur-X, norme EN 16931.</p>
             </div>
           </div>`,
  },
  {
    nom: 'le remède : la même largeur, mais atteignable au doigt',
    attendu: false,
    html: `<div style="width:320px;overflow-x:auto">
             <table style="min-width:640px;border-collapse:collapse">
               <tbody><tr>
                 <td style="padding:8px">Sous-traitant</td>
                 <td style="padding:8px">Rôle assuré pour le compte du responsable</td>
                 <td style="padding:8px">Localisation des serveurs</td>
               </tr></tbody>
             </table>
           </div>`,
  },
  {
    // ⚠️ CE CAS A ÉTÉ AJOUTÉ APRÈS AVOIR VU LA PORTE DÉNONCER LA BARRE
    // D'ONGLETS DE L'ESPACE FINANCES. « Prévisionnel » commence bien au-delà
    // du bord de l'écran, et il suffit de faire glisser pour l'atteindre :
    // c'est le motif qu'on RECOMMANDE. Le dénoncer poussait à le remplacer
    // par un rognage — le remède transformé en maladie.
    nom: 'barre défilante à l’intérieur d’un shell qui rogne (onglets Finances)',
    attendu: false,
    // Le bloc gris large est là POUR QUE LE CONTENEUR DÉBORDE : sans lui, la
    // règle s'arrête avant même de regarder ses enfants (`scrollWidth` du
    // conteneur inchangé), et le cas ne prouverait rien — première version de
    // ce contrôle, restée verte avec ET sans le garde.
    html: `<div style="width:320px;overflow:hidden">
             <div style="width:400px;height:8px;background:#eee"></div>
             <div style="overflow-x:auto">
               <div style="width:640px;white-space:nowrap">Vue d’ensemble · Ventes · Achats · Prévisionnel · Rapports</div>
             </div>
           </div>`,
  },
  {
    nom: 'troncature à l’ellipse, décidée et visible à l’œil',
    attendu: false,
    html: `<div style="width:200px;overflow:hidden">
             <p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0">Rucher des Grands Chênes — visite du 3 avril</p>
           </div>`,
  },
];

const nav = await chromium.launch({ executablePath: CHROME });
const page = await nav.newPage({ viewport: { width: 900, height: 600 } });

let echecs = 0;
for (const cas of CAS) {
  await page.setContent(`${SOCLE}${cas.html}`, { waitUntil: 'load' });
  const trouve = (await page.evaluate(SONDE)).filter(
    (t) => t.genre === 'debordement-dans-conteneur',
  );
  const vu = trouve.length > 0;
  if (vu === cas.attendu) {
    console.log(`✓ ${cas.attendu ? 'vu' : 'ignoré'} — ${cas.nom}`);
    continue;
  }
  echecs++;
  console.log(`✖ ${cas.attendu ? 'MANQUÉ' : 'FAUX POSITIF'} — ${cas.nom}`);
  for (const t of trouve) console.log(`     ${t.detail}\n     ${t.coupables.join('\n     ')}`);
}

await nav.close();
if (echecs) {
  console.log(`\n${echecs} cas de contrôle en échec : la sonde ne mesure pas ce qu’elle annonce.`);
  process.exit(1);
}
console.log(
  `\n✓ ${CAS.length} cas de contrôle : la sonde voit ce qu’elle doit voir, et rien d’autre.`,
);
