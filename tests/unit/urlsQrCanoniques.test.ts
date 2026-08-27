import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../helpers/sansCommentaires';
import { SITE_URL } from '~~/app/utils/seo';
import { urlQrHausse, urlQrRuche, urlPasseportPot } from '~~/app/utils/urlQr';

// ═══════════════════════════════════════════════════════════════════════════
// UN QR IMPRIMÉ SURVIT AU DÉPLOIEMENT QUI L'A FABRIQUÉ.
//
// ⚠️ LE DÉFAUT QUI A PRODUIT CE BANC — LES QR DE HAUSSE ÉTAIENT MORTS.
//
// Quatre endroits du serveur fabriquaient l'URL du QR d'une hausse avec un
// sous-domaine écrit en dur. Ce sous-domaine NE RÉSOUT PAS : vérifié au
// résolveur, l'apex répond, lui pas (NXDOMAIN). Chaque étiquette imprimée
// depuis la génération de parc portait donc un QR qui ne mène nulle part —
// et pas vers une page d'erreur de l'application : vers une erreur DNS du
// téléphone, sur le terrain, souvent hors réseau. L'URL était de plus ÉCRITE
// EN BASE, donc figée sur chaque ligne déjà créée.
//
// Pendant ce temps la fiche de la hausse affichait, elle, un QR construit sur
// l'origine de l'onglet. La MÊME hausse avait donc DEUX QR différents selon
// l'écran d'où on l'imprimait.
//
// La règle était pourtant connue et juste : elle vivait dans un commentaire
// de `PasseportPotQr.vue`, exacte depuis le début. Elle était écrite dans UN
// fichier au lieu d'être une fonction — donc elle ne s'appliquait qu'à ce
// fichier. C'est la classe « dériver, jamais recopier », dans sa forme la
// plus coûteuse : le support est du PAPIER, aucun correctif ne le rattrape.
//
// Ce banc tient trois choses, dans cet ordre de gravité :
//   A. aucun hôte apigo autre que l'apex canonique, nulle part dans le code ;
//   B. le chemin d'un QR ne se fabrique qu'à UN endroit ;
//   C. l'URL produite mène à une page qui existe vraiment.
// ═══════════════════════════════════════════════════════════════════════════

/** Le seul fichier autorisé à fabriquer un chemin de QR. */
const FABRIQUE = join('app', 'utils', 'urlQr.ts');

/**
 * Le balayage couvre le code de PRODUCTION (`app/`, `server/`), pas `tests/`.
 *
 * Motif écrit, comme l'exige la discipline des dispenses : un banc a besoin de
 * FABRIQUER un mauvais hôte pour prouver qu'il le voit (cf. le cas garde-fou
 * plus bas). Étendre le balayage aux tests rendrait ce banc impossible à
 * écrire — et ce n'est pas dans `tests/` qu'un QR s'imprime.
 */
const RACINES = ['app', 'server'];

/** Tous les sources de production, lus sur le disque — jamais une liste recopiée. */
function sourcesDeProduction(): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(ts|mts|vue)$/.test(entree)) trouves.push(complet);
    }
  };
  for (const racine of RACINES) descendre(racine);
  return trouves.sort();
}

/** Le code d'un fichier, commentaires blanchis, numéros de ligne conservés. */
function codeSeul(chemin: string): string {
  // ⚠️ Sans blanchiment, ce dépôt est déjà tombé SIX fois dans le même piège :
  // le commentaire qui EXPLIQUE la correction contient la chaîne interdite, et
  // le banc s'accuse lui-même — ou pire, absout un fichier qui se contente de
  // PARLER de la règle. Les fichiers corrigés ici racontent tous le défaut.
  return sansCommentaires(readFileSync(chemin, 'utf-8'));
}

/** Les lignes d'un source qui correspondent à un motif. */
function lignesQuiMatchent(code: string, motif: RegExp): Array<{ n: number; texte: string }> {
  return code
    .split('\n')
    .map((texte, i) => ({ n: i + 1, texte }))
    .filter((l) => motif.test(l.texte));
}

/** L'hôte canonique, dérivé de la source de vérité — jamais réécrit ici. */
const HOTE_CANONIQUE = new URL(SITE_URL).host;

/**
 * Tout hôte `…apigo.fr` apparaissant dans une URL absolue.
 * Le point d'entrée est le schéma : on ne veut pas attraper les adresses
 * e-mail (`noreply@apigo.fr`), qui ne sont pas des hôtes web.
 */
const HOTE_APIGO = /https?:\/\/([a-z0-9.-]*apigo\.fr)/gi;

/** Le motif d'un chemin de QR : ce que seule la fabrique a le droit d'écrire. */
const CHEMIN_DE_QR = /\?scan=1|\/p#/;

describe('les URL de QR sont canoniques', () => {
  const sources = sourcesDeProduction();

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Sans lui, un chemin de balayage erroné rend la liste vide et TOUT ce qui
  // suit passe au vert sans avoir rien lu. Ce faux vert est arrivé ici.
  it('garde-fou — le balayage voit bien le code de production', () => {
    expect(sources.length).toBeGreaterThan(300);
    expect(sources).toContain(FABRIQUE);
    expect(sources).toContain(join('server', 'api', 'hausses', 'generer.post.ts'));
    expect(sources).toContain(join('app', 'pages', 'hausses', '[id].vue'));
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Un blanchiment trop large effacerait le code même, et la règle B
  // deviendrait vide de sens : elle ne verrait plus rien à interdire.
  it('garde-fou — le blanchiment laisse le code intact', () => {
    const code = codeSeul(FABRIQUE);
    expect(code).toMatch(CHEMIN_DE_QR);
    expect(lignesQuiMatchent(code, CHEMIN_DE_QR).length).toBeGreaterThanOrEqual(3);
  });

  // ─── GARDE-FOU ────────────────────────────────────────────────────────────
  // Une règle dont le motif ne matche rien est un banc qui ne mesure rien.
  // On lui fait voir, sur une ligne FABRIQUÉE, exactement le défaut réel.
  it('garde-fou — le motif reconnaît le défaut qui a eu lieu', () => {
    const ligneDuDefaut = 'const u = `https' + '://app.apigo.fr/hausses/${id}?scan=1`;';
    const hotes = [...ligneDuDefaut.matchAll(HOTE_APIGO)].map((m) => m[1]);
    expect(hotes).toEqual(['app.apigo.fr']);
    expect(hotes[0]).not.toBe(HOTE_CANONIQUE);
    expect(CHEMIN_DE_QR.test(ligneDuDefaut)).toBe(true);
  });

  // ─── RÈGLE A ──────────────────────────────────────────────────────────────
  it("A — aucun hôte apigo autre que l'apex canonique, nulle part", () => {
    const fautes: string[] = [];
    for (const chemin of sources) {
      const code = codeSeul(chemin);
      for (const ligne of code.split('\n').map((texte, i) => ({ n: i + 1, texte }))) {
        for (const m of ligne.texte.matchAll(HOTE_APIGO)) {
          const hote = m[1]!.toLowerCase();
          if (hote !== HOTE_CANONIQUE) fautes.push(`${chemin}:${ligne.n} → ${hote}`);
        }
      }
    }
    expect(
      fautes,
      `Un hôte apigo NON canonique est écrit dans le code.\n\n${fautes.join('\n')}\n\n` +
        `Le seul hôte servi est « ${HOTE_CANONIQUE} ». Un sous-domaine qui n'a pas ` +
        `d'enregistrement DNS ne produit pas une erreur d'application : il produit ` +
        `une erreur de résolution sur le téléphone de l'apiculteur, en plein rucher. ` +
        `C'est exactement ce qui est arrivé aux QR de hausse, et le support étant du ` +
        `papier, aucun déploiement n'a pu les rattraper.\n` +
        `Si l'hôte canonique doit VRAIMENT changer, changez « SITE_URL » — et ` +
        `vérifiez d'ABORD que le nouvel hôte résout.`,
    ).toEqual([]);
  });

  // ─── RÈGLE B ──────────────────────────────────────────────────────────────
  it("B — le chemin d'un QR ne se fabrique qu'à un seul endroit", () => {
    const fautes: string[] = [];
    for (const chemin of sources) {
      if (chemin === FABRIQUE) continue;
      for (const ligne of lignesQuiMatchent(codeSeul(chemin), CHEMIN_DE_QR)) {
        fautes.push(`${chemin}:${ligne.n} → ${ligne.texte.trim()}`);
      }
    }
    expect(
      fautes,
      `Un chemin de QR est fabriqué ailleurs que dans « ${FABRIQUE} ».\n\n` +
        `${fautes.join('\n')}\n\n` +
        `C'est la duplication qui a produit le défaut : la même hausse avait DEUX ` +
        `QR différents — celui du serveur et celui de la fiche — parce que la règle ` +
        `était recopiée au lieu d'être appelée. Passez par « urlQrHausse », ` +
        `« urlQrRuche » ou « urlPasseportPot ».`,
    ).toEqual([]);
  });

  // ─── RÈGLE C ──────────────────────────────────────────────────────────────
  const BATISSEURS = [
    { nom: 'urlQrHausse', url: urlQrHausse('11111111-2222-3333-4444-555555555555') },
    { nom: 'urlQrRuche', url: urlQrRuche('11111111-2222-3333-4444-555555555555') },
    { nom: 'urlPasseportPot', url: urlPasseportPot('AbC123') },
  ];

  it.each(BATISSEURS)("C — $nom sort une URL sur l'hôte canonique, en https", ({ nom, url }) => {
    const u = new URL(url);
    expect(u.protocol, `${nom} doit produire du https : un QR n'a pas de session à ouvrir`).toBe(
      'https:',
    );
    expect(
      u.host,
      `${nom} sort « ${u.host} » au lieu de « ${HOTE_CANONIQUE} ». Le QR finit collé ` +
        `sur un objet physique : il ne doit dépendre ni de la preview, ni du poste ` +
        `de développement, ni d'un sous-domaine qui n'existe pas.`,
    ).toBe(HOTE_CANONIQUE);
  });

  it.each(BATISSEURS)('C — $nom mène à une page qui existe', ({ nom, url }) => {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    const premier = segments[0]!;

    const fichierDirect = join('app', 'pages', `${premier}.vue`);
    const dossier = join('app', 'pages', premier);
    const existe = existsSync(fichierDirect) || existsSync(dossier);
    expect(
      existe,
      `${nom} pointe vers « /${premier} », mais ni « ${fichierDirect} » ni « ${dossier} » ` +
        `n'existent. Un QR au bon domaine mais au mauvais chemin est tout aussi mort ` +
        `qu'un QR au mauvais domaine — et tout aussi imprimé.`,
    ).toBe(true);

    // Un second segment veut dire une route dynamique : le dossier doit porter
    // un fichier `[…]`, sinon le QR tombe sur un 404 dès qu'on le scanne.
    if (segments.length > 1) {
      const dynamiques = readdirSync(dossier).filter((e) => e.startsWith('['));
      expect(
        dynamiques.length,
        `${nom} produit « ${new URL(url).pathname} », donc une route dynamique — mais ` +
          `« ${dossier} » ne contient aucun fichier « [id] ». Le scan tomberait sur un 404.`,
      ).toBeGreaterThan(0);
    }
  });

  // ─── L'hôte canonique lui-même ────────────────────────────────────────────
  it("l'hôte canonique est l'apex, pas un sous-domaine", () => {
    const labels = HOTE_CANONIQUE.split('.');
    expect(
      labels.length,
      `« ${HOTE_CANONIQUE} » porte un sous-domaine. C'est précisément ce qui a tué ` +
        `les QR de hausse : le sous-domaine choisi n'avait aucun enregistrement DNS, ` +
        `alors que l'apex, lui, était servi. Si un sous-domaine devient volontairement ` +
        `l'hôte canonique, vérifiez qu'il RÉSOUT avant de relâcher ce banc.`,
    ).toBe(2);
  });
});
