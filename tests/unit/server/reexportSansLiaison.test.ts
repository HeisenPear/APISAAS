// ═══════════════════════════════════════════════════════════════════════════
// UN RÉEXPORT NE CRÉE AUCUNE LIAISON LOCALE — ET LE TYPECHECK NE LE DIT PAS.
//
// ─── CE QUI S'EST PASSÉ ────────────────────────────────────────────────────
// `server/utils/pricing.ts` a cessé de DÉFINIR le coeur de la formule de prix
// pour le RÉEXPORTER depuis `app/utils/prixLigne.ts` — de sorte que les pages,
// qui imprimaient jusque-là leurs propres montants, partagent enfin la même
// fonction que le serveur.
//
//     export { round2, ligneTotalHt, ligneTva } from '~~/app/utils/prixLigne';
//
// Cette ligne ouvre un chemin POUR LES AUTRES. Elle n'en ouvre aucun pour
// soi-même : dans le corps du module, `ligneTotalHt` n'existait plus. Or
// `computeFactureTotals` l'appelle. Toute création et toute édition de facture
// levaient donc `ReferenceError: ligneTotalHt is not defined`.
//
// ─── POURQUOI UN BANC, ALORS QUE `npm run typecheck` EXISTE ────────────────
// Parce que le typecheck est passé au VERT. Nitro déclare les exports de
// `server/utils/` comme des globales d'auto-import : TypeScript trouvait le
// nom dans ces déclarations, sans se demander si le module qui l'exporte peut
// s'auto-importer lui-même. Le vérificateur voyait un identifiant connu, le
// moteur ne voyait rien.
//
// C'est la même famille que « le harnais qui neutralise la branche » de
// CLAUDE.md : l'outil de mesure répond d'après un monde qui n'est pas celui de
// l'exécution.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer `ligneTotalHt` de la ligne d'import de `pricing.ts` ;
//   · rendre l'extracteur aveugle aux réexports → le contrôle positif tombe.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../../helpers/sansCommentaires';

/**
 * LA RÈGLE, EN FONCTION APPELABLE : les noms qu'un module RÉEXPORTE, qu'il
 * UTILISE dans son corps, et qu'il n'IMPORTE pas.
 *
 * Elle prend une chaîne et non un chemin — c'est ce qui permet de l'éprouver
 * sur des sources fabriqués, sans dépendre de l'état du dépôt.
 */
export function reexportsSansLiaison(source: string): string[] {
  const code = sansCommentaires(source);

  /** `export { a, b as c } from '…'` — le réexport, celui qui ne lie rien. */
  const reexportes = new Set<string>();
  for (const m of code.matchAll(/^export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]/gm)) {
    for (const morceau of m[1]!.split(',')) {
      const t = morceau.trim();
      if (!t || t.startsWith('type ')) continue;
      const alias = t.match(/\bas\s+([A-Za-z_$][\w$]*)\s*$/);
      const nom = alias ? alias[1]! : t;
      if (/^[A-Za-z_$][\w$]*$/.test(nom)) reexportes.add(nom);
    }
  }
  if (!reexportes.size) return [];

  /** `import { a, b as c } from '…'` — celui qui lie. L'alias est le nom local. */
  const importes = new Set<string>();
  for (const m of code.matchAll(/^import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]/gm)) {
    for (const morceau of m[1]!.split(',')) {
      const t = morceau.trim();
      if (!t) continue;
      const alias = t.match(/\bas\s+([A-Za-z_$][\w$]*)\s*$/);
      const nom = alias ? alias[1]! : t.replace(/^type\s+/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nom)) importes.add(nom);
    }
  }

  /**
   * Le corps, privé de ses lignes d'import et d'export : c'est là seulement
   * qu'un nom doit être LIÉ. Le voir dans sa propre ligne de réexport ne
   * prouverait rien — « le mot au lieu de l'appel ».
   */
  const corps = code
    .split('\n')
    .filter((l) => !/^\s*(?:import|export)\s/.test(l))
    .join('\n');

  return [...reexportes].filter(
    (nom) => !importes.has(nom) && new RegExp(`\\b${nom}\\s*\\(`).test(corps),
  );
}

function sourcesServeur(): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.(ts|mts)$/.test(entree)) trouves.push(complet);
    }
  };
  descendre('server');
  return trouves.sort();
}

describe('la sonde voit ce qu’elle doit voir, et rien d’autre', () => {
  it('CONTRÔLE POSITIF : elle distingue le module fautif du module sain', () => {
    // Le défaut RÉEL, réduit à ses trois lignes.
    const fautif = [
      "export { ligneTotalHt } from '~~/app/utils/prixLigne';",
      'export function totaux(lignes) {',
      '  return lignes.map((l) => ligneTotalHt(l));',
      '}',
    ].join('\n');
    // Le même, avec la liaison locale — ce qui a corrigé le défaut.
    const sain = [
      "import { ligneTotalHt } from '~~/app/utils/prixLigne';",
      "export { ligneTotalHt } from '~~/app/utils/prixLigne';",
      'export function totaux(lignes) {',
      '  return lignes.map((l) => ligneTotalHt(l));',
      '}',
    ].join('\n');

    expect(reexportsSansLiaison(fautif)).toEqual(['ligneTotalHt']);
    expect(reexportsSansLiaison(sain)).toEqual([]);
  });

  it('un réexport qu’on n’appelle pas n’est pas une faute', () => {
    // Réexporter pour autrui sans s'en servir soi-même est parfaitement légitime.
    const source = [
      "export { ligneTva } from '~~/app/utils/prixLigne';",
      'export const TAUX = 5.5;',
    ].join('\n');
    expect(reexportsSansLiaison(source)).toEqual([]);
  });

  it('elle ne se laisse pas berner par un commentaire', () => {
    const source = [
      "export { ligneTotalHt } from '~~/app/utils/prixLigne';",
      '// avant : return ligneTotalHt(l), sans la ligne d’import',
      'export const X = 1;',
    ].join('\n');
    expect(reexportsSansLiaison(source)).toEqual([]);
  });

  it('GARDE-FOU : le balayage voit bien le serveur', () => {
    const sources = sourcesServeur();
    expect(sources.length).toBeGreaterThan(200);
    expect(sources).toContain(join('server', 'utils', 'pricing.ts'));
  });
});

describe('LA RÈGLE : ce qu’on réexporte et qu’on appelle, on l’importe aussi', () => {
  it('aucun module du serveur n’appelle un nom qu’il ne fait que réexporter', () => {
    const fautes = sourcesServeur()
      .map((f) => ({ f, noms: reexportsSansLiaison(readFileSync(f, 'utf-8')) }))
      .filter((x) => x.noms.length > 0);

    expect(
      fautes.map((x) => `${x.f} → ${x.noms.join(', ')}`),
      '`export { x } from "…"` ouvre un chemin POUR LES AUTRES, jamais pour soi : dans le ' +
        'corps du module, le nom n’existe pas. Et `npm run typecheck` ne le dira PAS — Nitro ' +
        'déclare les exports de server/utils comme des globales d’auto-import, si bien que ' +
        'TypeScript trouve le nom sans se demander si le module qui l’exporte peut se ' +
        'l’auto-importer à lui-même. Ajoutez la ligne `import` correspondante.',
    ).toEqual([]);
  });
});
