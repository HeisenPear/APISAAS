// ═══════════════════════════════════════════════════════════════════════════
// LA FRANCHISE EN BASE DE TVA S'APPLIQUE SUR LES QUATRE PORTES.
//
// ─── CE QUI SE JOUAIT ICI ──────────────────────────────────────────────────
// L'article 293 B du CGI dispense certains exploitants de facturer la TVA. Le
// dépôt en tenait compte à DEUX endroits — la CRÉATION d'une facture
// (`finances/ventes.post.ts`) et son ÉDITION (`factures/[id].put.ts`) —
// chacun avec sa propre copie de la requête et de la boucle.
//
// ⚠️ LES DEUX AUTRES PORTES NE LA CONNAISSAIENT PAS. `convertir.post.ts` et
// `facturer-groupe.post.ts` émettent de VRAIES factures depuis un bon de
// livraison, en reprenant `l.tauxTva ?? 5.5`. Un apiculteur en franchise qui
// convertissait un bon obtenait une facture NUMÉROTÉE portant 5,5 % de TVA :
// une taxe qu'il n'a pas le droit de collecter, sur une pièce comptable qu'il
// remet à son client.
//
// Le dépôt connaissait DÉJÀ ce schéma sur ces deux routes exactes : le
// commentaire de `convertir.post.ts` dit, à propos de la NUMÉROTATION, que
// « la correction n'a jamais été back-portée sur les deux routes de bons de
// livraison ». Mêmes routes, même oubli, autre règle.
//
// ─── POURQUOI UNE SONDE, ET PAS QUATRE CAS RECOPIÉS ────────────────────────
// Une liste de quatre chemins écrite à la main ne grandit pas : la cinquième
// route qui émettra une facture demain ne serait vue par personne. On DÉRIVE
// donc la population — toute route qui insère dans `transactions` un type
// `vente` — de la source elle-même.
//
// ─── LES MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────
//   · retirer `appliquerFranchise` de n'importe laquelle des quatre routes ;
//   · faire écraser les taux même hors franchise ;
//   · effacer le taux au lieu de poser zéro (il retomberait sur 5,5 %).
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sansCommentaires } from '../../helpers/sansCommentaires';
import { appliquerFranchise } from '~~/server/utils/regimeTva';

/** Le module qui DÉTIENT la règle — il est seul autorisé à l'écrire. */
const FABRIQUE = join('server', 'utils', 'regimeTva.ts');

function sourcesServeur(): string[] {
  const trouves: string[] = [];
  const descendre = (dossier: string) => {
    for (const entree of readdirSync(dossier)) {
      if (entree === 'node_modules') continue;
      const complet = join(dossier, entree);
      if (statSync(complet).isDirectory()) descendre(complet);
      else if (/\.ts$/.test(entree)) trouves.push(complet);
    }
  };
  descendre('server');
  return trouves.sort();
}

/**
 * LES ROUTES QUI ÉMETTENT UNE FACTURE, dérivées de la source.
 *
 * Le repère : une insertion (ou une mise à jour de lignes) dans `transactions`
 * accompagnée d'un calcul de totaux. C'est exactement ce que font les quatre
 * portes, et ce que fera la cinquième.
 */
export function routesQuiFacturent(source: string): boolean {
  const code = sansCommentaires(source);
  const toucheAuxTransactions =
    /\.insert\(transactions\)/.test(code) || /\.update\(transactions\)/.test(code);
  const calculeDesTotaux = /(computeFactureTotals|totauxDepuisLignes)\s*\(/.test(code);
  return toucheAuxTransactions && calculeDesTotaux;
}

/** La route applique-t-elle la règle ? */
export function appliqueLaFranchise(source: string): boolean {
  return /\bappliquerFranchise\s*\(/.test(sansCommentaires(source));
}

describe('la sonde voit ce qu’elle doit voir, et rien d’autre', () => {
  it('CONTRÔLE POSITIF : elle reconnaît une route qui facture, et une qui ne facture pas', () => {
    const facture = [
      "import { totauxDepuisLignes } from '~~/server/utils/pricing';",
      'const { sousTotal } = totauxDepuisLignes(lignes);',
      'await db.insert(transactions).values({ type: "vente" });',
    ].join('\n');
    const autre = ['await db.insert(alertes).values({});'].join('\n');
    expect(routesQuiFacturent(facture)).toBe(true);
    expect(routesQuiFacturent(autre)).toBe(false);
  });

  it('CONTRÔLE POSITIF : elle distingue une route qui applique la règle d’une qui l’ignore', () => {
    expect(appliqueLaFranchise('appliquerFranchise(lignes, enFranchise);')).toBe(true);
    expect(appliqueLaFranchise('const tva = l.tauxTva ?? 5.5;')).toBe(false);
  });

  it('elle ne se laisse pas berner par un commentaire', () => {
    // Les quatre routes RACONTENT le défaut : leurs commentaires citent
    // `appliquerFranchise` dans la phrase qui explique pourquoi il est là.
    expect(appliqueLaFranchise('// avant : appliquerFranchise() manquait ici')).toBe(false);
  });

  it('GARDE-FOU : le balayage trouve bien les routes qui facturent', () => {
    const routes = sourcesServeur().filter((f) => routesQuiFacturent(readFileSync(f, 'utf-8')));
    expect(
      routes.length,
      'aucune route de facturation trouvée : la règle porterait sur zéro cas',
    ).toBeGreaterThanOrEqual(4);
  });
});

describe('LA RÈGLE : toute route qui émet une facture applique la franchise', () => {
  it('les quatre portes, et toute porte à venir', () => {
    const manquantes = sourcesServeur()
      .filter((f) => f !== FABRIQUE)
      .filter((f) => {
        const src = readFileSync(f, 'utf-8');
        return routesQuiFacturent(src) && !appliqueLaFranchise(src);
      });

    expect(
      manquantes,
      'Un apiculteur dispensé de TVA (art. 293 B du CGI) recevrait une facture NUMÉROTÉE ' +
        'portant 5,5 % — une taxe qu’il n’a pas le droit de collecter, sur une pièce ' +
        'comptable qu’il remet à son client. Appelez `appliquerFranchise(lignes, await ' +
        'estEnFranchiseTva(ownerId))` avant de calculer les totaux.',
    ).toEqual([]);
  });
});

describe('ce que la règle fait, et ce qu’elle ne fait pas', () => {
  it('en franchise : tous les taux tombent à ZÉRO', () => {
    const lignes = [{ tauxTva: 5.5 }, { tauxTva: 20 }];
    appliquerFranchise(lignes, true);
    expect(lignes.map((l) => l.tauxTva)).toEqual([0, 0]);
  });

  it('ZÉRO, et non « pas de champ »', () => {
    /**
     * Un taux ABSENT retombe sur 5,5 % un peu partout dans le dépôt
     * (`l.tauxTva ?? 5.5`) : effacer le champ ferait réapparaître la TVA au
     * premier recalcul. C'est la forme la plus sournoise du défaut, parce
     * qu'elle a l'air d'une suppression réussie.
     */
    const lignes: Array<{ tauxTva?: number | null }> = [{ tauxTva: 5.5 }];
    appliquerFranchise(lignes, true);
    expect(lignes[0]!.tauxTva).toBe(0);
    expect('tauxTva' in lignes[0]!).toBe(true);
  });

  it('HORS franchise : elle ne touche à RIEN', () => {
    // La garde est portée par la fonction, pas par l'appelant : c'est
    // précisément là qu'un appelant distrait supprimerait la TVA de tout le
    // monde.
    const lignes = [{ tauxTva: 5.5 }, { tauxTva: 20 }];
    appliquerFranchise(lignes, false);
    expect(lignes.map((l) => l.tauxTva)).toEqual([5.5, 20]);
  });
});
