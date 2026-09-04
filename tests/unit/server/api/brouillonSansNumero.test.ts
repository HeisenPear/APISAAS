// ═══════════════════════════════════════════════════════════════════════════
// UN BROUILLON NE PORTE PAS DE NUMÉRO DE FACTURE.
//
// La règle est écrite en toutes lettres dans `finances/ventes.post.ts` :
//
//     const numero = body.statut === 'brouillon' ? null : await genererNumero…
//
// Le numéro s'attribue à L'ÉMISSION — c'est `factures/[id].put.ts` qui le pose
// quand le brouillon part. Les deux routes de bons de livraison étaient les
// seules à le poser d'avance, sur une transaction qu'elles créent pourtant en
// `brouillon`.
//
// Deux dégâts, et le second s'est refermé sur l'apiculteur le jour même :
//
//   · l'article 242 nonies A du CGI veut une séquence CONTINUE de factures
//     émises. Un brouillon qui réserve un numéro puis n'est jamais envoyé
//     creuse un trou dans la séquence ;
//   · le `DELETE` de facture refuse désormais toute ligne PORTANT UN NUMÉRO —
//     à juste titre, supprimer la dernière émise ferait réattribuer son
//     numéro. Mais une conversion faite par erreur produisait ici un brouillon
//     NUMÉROTÉ, donc indélébile, et pour lequel un avoir n'a aucun sens
//     puisque rien n'a jamais été envoyé. Le refus nomme une sortie de
//     secours ; elle n'existait pas.
//
// C'est la forme la plus coûteuse de duplication : deux gardes justes,
// chacune posée sans regarder l'autre, qui s'enferment mutuellement.
//
// ⚠️ LE BALAYAGE PART DES ROUTES, PAS D'UNE LISTE. Une troisième route qui
// créerait un brouillon numéroté demain serait vue le jour même.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { sansCommentaires } from '../../../helpers/sansCommentaires';

const RACINE_API = 'server/api';

function fichiers(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (e.endsWith('.ts')) out.push(p);
  }
  return out;
}

/**
 * Les blocs `.values({ … })` d'une insertion dans `transactions`, sans leurs
 * commentaires.
 *
 * ⚠️ DANS `transactions` SEULEMENT, ET LA NUANCE EST TOUT LE SUJET. Un BON DE
 * LIVRAISON porte lui aussi un `numero` et un `statut: 'brouillon'` — mais son
 * numéro appartient à la séquence BL-, il DÉSIGNE le bon, et il est légitime
 * dès la création. Une première version de ce banc l'accusait : elle mesurait
 * la forme du code, pas la règle. Ce sont les numéros de FACTURE, et eux
 * seuls, que la séquence légale oblige à poser à l'émission.
 *
 * ⚠️ SANS LES COMMENTAIRES, PARCE QUE C'EST DÉJÀ TOMBÉ AUJOURD'HUI. Le
 * commentaire qui EXPLIQUE un correctif cite forcément le code corrigé :
 * celui de ces deux routes contient le mot `genererNumeroFacture` dans la
 * phrase qui raconte pourquoi on ne l'appelle plus.
 */
function blocsDeValeurs(src: string): string[] {
  const propre = sansCommentaires(src);
  const blocs: string[] = [];
  for (const m of propre.matchAll(/\.insert\(transactions\)[\s\S]{0,200}?\.values\(\{/g)) {
    let profondeur = 0;
    let i = m.index! + m[0].length - 1;
    const debut = i;
    for (; i < propre.length; i++) {
      if (propre[i] === '{') profondeur++;
      else if (propre[i] === '}') {
        profondeur--;
        if (profondeur === 0) break;
      }
    }
    blocs.push(propre.slice(debut, i + 1));
  }
  return blocs;
}

/** Un bloc qui pose `statut: 'brouillon'` ET un `numero` non nul. */
function brouillonNumerote(bloc: string): boolean {
  if (!/statut:\s*'brouillon'/.test(bloc)) return false;
  if (!/\bnumero\b/.test(bloc)) return false;
  // `numero: null` — et la forme abrégée `numero,` dont la variable vaut null,
  // qu'on reconnaît en remontant à sa déclaration, sont traitées par l'appelant.
  return !/numero:\s*null/.test(bloc);
}

interface Faute {
  fichier: string;
  extrait: string;
}

function auditer(sources: { fichier: string; src: string }[]): Faute[] {
  const fautes: Faute[] = [];
  for (const { fichier, src } of sources) {
    const propre = sansCommentaires(src);
    for (const bloc of blocsDeValeurs(src)) {
      if (!brouillonNumerote(bloc)) continue;
      /**
       * Forme abrégée `numero,` : la variable est-elle déclarée à `null` ?
       * C'est la forme retenue par les deux routes corrigées — elle dit,
       * à l'endroit de la déclaration, POURQUOI il n'y a pas de numéro.
       */
      if (/\bnumero\s*,/.test(bloc) && /const numero\s*=\s*null\s*;/.test(propre)) continue;
      fautes.push({ fichier, extrait: bloc.replace(/\s+/g, ' ').slice(0, 120) });
    }
  }
  return fautes;
}

function toutesLesRoutes() {
  return fichiers(RACINE_API).map((f) => ({ fichier: f, src: readFileSync(f, 'utf-8') }));
}

describe('garde-fou : le balayage voit les insertions, et sait en refuser une', () => {
  it('des blocs de valeurs sont bien lus', () => {
    const total = toutesLesRoutes().reduce((n, r) => n + blocsDeValeurs(r.src).length, 0);
    expect(
      total,
      'aucune insertion dans `transactions` lue — la règle ne mesure plus rien',
    ).toBeGreaterThan(3);
  });

  it('⚠️ CONTRÔLE POSITIF — un brouillon numéroté fabriqué est vu fautif', () => {
    /**
     * LE CAS QUI EMPÊCHE CE BANC D'ÊTRE DÉCORATIF. Une règle enfermée dans son
     * `it` ne se vérifie que sur un dépôt sale ; le jour où tout est propre,
     * un `auditer` qui répondrait toujours « rien » resterait vert pour
     * toujours. On lui donne donc la route d'hier.
     */
    const fautive = `
      const numero = await genererNumeroFacture(ownerId);
      const [t] = await db.insert(transactions).values({
        userId: ownerId, type: 'vente', numero, statut: 'brouillon', total: '0',
      }).returning();`;
    expect(
      auditer([{ fichier: 'fabriquee.post.ts', src: fautive }]).length,
      'l’audit ne voit pas un brouillon numéroté : il ne mesure rien',
    ).toBe(1);
  });

  it('⚠️ CONTRÔLE NÉGATIF — le même brouillon sans numéro ne l’est plus', () => {
    const saine = `
      const numero = null;
      const [t] = await db.insert(transactions).values({
        userId: ownerId, type: 'vente', numero, statut: 'brouillon', total: '0',
      }).returning();`;
    expect(auditer([{ fichier: 'saine.post.ts', src: saine }])).toEqual([]);
  });

  it('⚠️ CONTRÔLE NÉGATIF (2) — la forme LITTÉRALE `numero: null` est acceptée', () => {
    /**
     * Vu à la mutation : le contrôle négatif précédent utilise la forme
     * abrégée `numero,` avec `const numero = null` — il passe par l'échappée
     * de fin, jamais par le test `numero: null`. Cette ligne-là n'était donc
     * traversée par AUCUN cas, et la casser laissait le banc vert.
     *
     * Les deux formes existent dans le dépôt ; les deux doivent être lues.
     */
    const saine = `
      await db.insert(transactions).values({
        userId: ownerId, type: 'vente', numero: null, statut: 'brouillon', total: '0',
      }).returning();`;
    expect(auditer([{ fichier: 'litterale.post.ts', src: saine }])).toEqual([]);
  });

  it('une facture ÉMISE, elle, doit bien porter son numéro', () => {
    /**
     * ⚠️ LA RÈGLE MARCHE DANS LES DEUX SENS. Un correctif qui aurait supprimé
     * toute numérotation aurait mis ce banc au vert en cassant la séquence
     * légale — et rien n'aurait crié.
     */
    const emise = `
      const numero = await genererNumeroFacture(ownerId);
      await db.insert(transactions).values({ numero, statut: 'envoyee' }).returning();`;
    expect(auditer([{ fichier: 'emise.post.ts', src: emise }])).toEqual([]);
  });
});

describe('la RÈGLE : aucune route ne crée un brouillon numéroté', () => {
  it('les deux conversions de bon de livraison comprises', () => {
    const fautes = auditer(toutesLesRoutes()).map((f) => `${f.fichier} :: ${f.extrait}`);
    expect(
      fautes,
      'Un brouillon numéroté creuse un trou dans la séquence légale (art. 242 ' +
        'nonies A du CGI) — et, depuis que le DELETE refuse toute ligne portant un ' +
        'numéro, il est INDÉLÉBILE : la sortie de secours que ce refus nomme (« créez ' +
        'une facture d’avoir ») n’a aucun sens pour un document jamais envoyé.',
    ).toEqual([]);
  });
});
