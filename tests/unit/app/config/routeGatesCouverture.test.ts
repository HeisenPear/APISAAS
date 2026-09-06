// ═══════════════════════════════════════════════════════════════════════════
// COUVERTURE INVERSE DES GATES DE PLAN.
//
// `plansGating.test.ts` vérifie que les gates DÉCLARÉS sont valides. Ce banc-ci
// vérifie l'inverse : qu'aucune route d'écriture n'existe SANS être classée, et
// qu'aucun gate ne pointe dans le vide.
//
// C'est la classe de défaut qui a produit l'incident du 3 août — une route de
// création en lot qui n'avait simplement aucune entrée dans la table. Aucun
// test ne pouvait la signaler, puisque tous partaient de la table.
//
// On lit le DISQUE, pas le graphe de modules : une route n'existe pas parce
// qu'on l'a importée, elle existe parce que le fichier est là — c'est aussi ce
// que fait Nitro.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROUTE_GATES, findMatchingGate } from '~/config/route-gates';
import { EXEMPTIONS_GATE, PREFIXES_EXEMPTS, PLAFOND_A_ARBITRER } from './exemptionsGate';

// `process.cwd()` est la racine du dépôt sous vitest (cf. `root` de
// vitest.config.ts). On évite `import.meta.url`, que la transformation de
// vitest ne garantit pas comme URL `file:`.
const RACINE = join(process.cwd(), 'server', 'api');
const SUFFIXE_METHODE = /\.(get|post|put|patch|delete)\.ts$/;

interface RouteDisque {
  methode: string;
  motif: string;
  fichier: string;
}

/** Fichiers de route sans suffixe de méthode : ils répondent à TOUTES les méthodes. */
const sansSuffixe: string[] = [];

function enumererRoutes(dossier: string = RACINE): RouteDisque[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return enumererRoutes(chemin);
    if (!nom.endsWith('.ts')) return [];

    const relatif = relative(RACINE, chemin).replace(/\\/g, '/');
    const trouve = nom.match(SUFFIXE_METHODE);
    if (!trouve) {
      sansSuffixe.push(relatif);
      return [];
    }

    const motif =
      '/api/' +
      relatif
        .replace(SUFFIXE_METHODE, '')
        .replace(/\/index$/, '') // ruchers/index.post.ts → /api/ruchers
        .replace(/\[[^\]]+\]/g, '*'); // [id] → *, la syntaxe de ROUTE_GATES

    return [{ methode: trouve[1]!.toUpperCase(), motif, fichier: relatif }];
  });
}

const ROUTES = enumererRoutes();
const ECRITURES = ROUTES.filter((r) => r.methode !== 'GET');
const sousPrefixeExempt = (motif: string) => PREFIXES_EXEMPTS.some((p) => motif.startsWith(p));
const cle = (r: RouteDisque) => `${r.methode} ${r.motif}`;

describe('couverture inverse des gates', () => {
  it('trouve bien les routes sur le disque', () => {
    // Garde-fou du banc lui-même : si l'énumération casse (renommage de
    // dossier, changement de convention Nitro), tout le reste passerait au
    // vert en ne vérifiant rien du tout.
    expect(ROUTES.length).toBeGreaterThan(250);
    expect(ECRITURES.length).toBeGreaterThan(100);
  });

  it('toute route d’écriture est gatée, exemptée par préfixe, ou classée', () => {
    const orphelines = ECRITURES.filter(
      (r) =>
        !sousPrefixeExempt(r.motif) &&
        !findMatchingGate(r.methode, r.motif) &&
        !EXEMPTIONS_GATE[cle(r)],
    );

    expect(
      orphelines.map(cle),
      [
        '',
        `${orphelines.length} route(s) d’écriture ne sont ni gatées ni classées.`,
        '',
        'Si la route doit dépendre du plan → app/config/route-gates.ts :',
        ...orphelines.map((r) => `    '${cle(r)}': { feature: '…' },   // ${r.fichier}`),
        '',
        'Sinon → tests/unit/app/config/exemptionsGate.ts, avec la raison :',
        ...orphelines.map((r) => `    '${cle(r)}': 'A_ARBITRER',`),
        '',
      ].join('\n'),
    ).toEqual([]);
  });

  it('aucun gate ne pointe vers une route inexistante', () => {
    // Un gate orphelin est SILENCIEUX et dangereux : la route a été renommée
    // ou supprimée, le motif ne correspond plus à rien, et la fonctionnalité
    // qu'il protégeait est devenue gratuite sans que personne ne le voie.
    const existantes = new Set(ROUTES.map(cle));
    const orphelins = Object.keys(ROUTE_GATES).filter((g) => !existantes.has(g));

    expect(
      orphelins,
      [
        '',
        'Gate(s) sans route correspondante — la fonctionnalité est-elle devenue gratuite ?',
        ...orphelins.map((g) => `    ${g}`),
        '',
      ].join('\n'),
    ).toEqual([]);
  });

  it('aucune exemption ne pointe vers une route inexistante', () => {
    const existantes = new Set(ROUTES.map(cle));
    const perimees = Object.keys(EXEMPTIONS_GATE).filter((g) => !existantes.has(g));

    expect(
      perimees,
      ['', 'Exemption(s) périmée(s) à retirer :', ...perimees.map((g) => `    ${g}`), ''].join(
        '\n',
      ),
    ).toEqual([]);
  });

  it('aucune route n’est à la fois gatée et exemptée', () => {
    const doubles = Object.keys(EXEMPTIONS_GATE).filter((g) => g in ROUTE_GATES);
    expect(doubles, `contradiction entre gate et exemption :\n  ${doubles.join('\n  ')}`).toEqual(
      [],
    );
  });

  it('tout fichier sans suffixe de méthode est sous préfixe exempté', () => {
    // Un fichier `[action].ts` répond à toutes les méthodes : l'énumération ne
    // peut pas en déduire de motif. Tant qu'il vit sous un préfixe exempté,
    // c'est sans conséquence — sinon il échapperait au banc en silence.
    const horsPrefixe = sansSuffixe.filter((f) => !sousPrefixeExempt(`/api/${f}`));
    expect(
      horsPrefixe,
      `route(s) multi-méthodes hors préfixe exempté, invisibles à ce banc :\n  ${horsPrefixe.join('\n  ')}`,
    ).toEqual([]);
  });

  it('la dette non arbitrée ne remonte jamais', () => {
    const dette = Object.values(EXEMPTIONS_GATE).filter((r) => r === 'A_ARBITRER').length;
    expect(
      dette,
      `Le cliquet est à ${PLAFOND_A_ARBITRER}. Il descend quand on tranche, jamais l’inverse.`,
    ).toBeLessThanOrEqual(PLAFOND_A_ARBITRER);
  });
});

describe('routes d’administration', () => {
  it('toute route /api/admin/ exige requireAdmin', async () => {
    const { readFileSync } = await import('node:fs');
    const sansGarde = ROUTES.filter(
      (r) =>
        r.motif.startsWith('/api/admin/') &&
        !readFileSync(join(RACINE, r.fichier), 'utf8').includes('requireAdmin'),
    );
    expect(
      sansGarde.map((r) => r.fichier),
      'route(s) admin sans requireAdmin :',
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LES DROITS NE SE VENDENT PAS.
//
// La ligne « Export complet » des paramètres a longtemps appelé
// /api/finances/export, gatée { feature: 'exportCsv' } — false sur Découverte.
// Un compte gratuit venu chercher ses données se voyait proposer un abonnement.
//
// La route qui sert un droit légal doit rester hors de ROUTE_GATES. Un
// commentaire dans le fichier ne l'empêche pas ; ce banc, si. Il n'inspecte pas
// du texte : il APPELLE findMatchingGate, la fonction dont dépend le middleware.
// ═══════════════════════════════════════════════════════════════════════════

const ROUTES_DE_DROIT: { methode: string; chemin: string; droit: string }[] = [
  {
    methode: 'GET',
    chemin: '/api/profils/export',
    droit: 'RGPD art. 15 (accès) et 20 (portabilité)',
  },
];

describe('routes qui servent un droit', () => {
  it('aucune n’est gatée derrière un plan', () => {
    const vendues = ROUTES_DE_DROIT.filter((r) => findMatchingGate(r.methode, r.chemin) !== null);
    expect(
      vendues.map((r) => `${r.methode} ${r.chemin} (${r.droit})`),
      'Ces routes servent un droit et ne peuvent pas être conditionnées à un abonnement :',
    ).toEqual([]);
  });

  it('elles existent bel et bien sur le disque', () => {
    for (const r of ROUTES_DE_DROIT) {
      const trouvee = ROUTES.some(
        (route) => route.motif === r.chemin && route.methode === r.methode,
      );
      expect(trouvee, `${r.methode} ${r.chemin} est déclarée comme droit mais n'existe pas`).toBe(
        true,
      );
    }
  });
});
