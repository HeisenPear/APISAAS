import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { prochainNumeroFacture } from '~~/server/utils/factureNumero';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero,
  suiteDeNumeros,
  type FamilleNumero,
} from '~~/server/utils/numerotation';
import { transactions } from '~~/server/database/schema';

/**
 * DEUX DOCUMENTS AVEC LE MÊME NUMÉRO, ET RIEN POUR LE DIRE.
 *
 * Ce banc est né sur les FACTURES : trier par `createdAt` sans écarter les
 * numéros nuls « produisait des doublons […] violation directe de l'unicité
 * légale ». Le helper de facture avait été corrigé ; les autres séquences —
 * achats, bons de livraison, hausses — gardaient chacune sa copie des quinze
 * mêmes lignes, dans leur version d'AVANT le correctif. Ce banc comptait cette
 * dette en la nommant ; le lot suivant l'a soldée, et le banc a changé de
 * portée avec elle : il ne garde plus la facture, il garde LA NUMÉROTATION.
 *
 * Le scénario d'origine, en clair : une vente laissée en BROUILLON porte
 * `numero = null` et devient la ligne la plus récente. Le tri par `createdAt`
 * la remonte, aucune branche ne s'applique, la séquence repart à 0001 — déjà
 * utilisée. Aucune des tables concernées n'a de contrainte d'unicité sur
 * `numero` : l'insertion passe sans un mot, et l'apiculteur découvre le doublon
 * dans son export comptable.
 *
 * ⚠️ CE BANC NE NOMME AUCUNE ROUTE. Une liste de fichiers verrouillerait les
 * copies connues et laisserait passer la suivante. Il itère sur
 * `FAMILLES_NUMERO` — la source de vérité — et balaie `server/` en entier.
 */

/** Le code d'un fichier, commentaires blanchis. */
function codeSeul(chemin: string): string {
  /**
   * ⚠️ ON BLANCHIT LES COMMENTAIRES, ET CE N'EST PAS UNE PRÉCAUTION THÉORIQUE :
   * la première version de ce banc s'accusait elle-même. Les routes corrigées
   * portent maintenant un commentaire qui EXPLIQUE le défaut, et ce commentaire
   * contient « FA- ». Le balayage les redésignait donc coupables alors qu'elles
   * étaient réparées — sixième fois que ce dépôt tombe dans ce piège, d'où la
   * règle : on ne cherche jamais une chaîne dans un fichier sans avoir d'abord
   * retiré ce qui n'est pas du code.
   */
  return readFileSync(chemin, 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join('\n');
}

const FICHIERS_SERVEUR = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean)
  .sort();

/** Les fichiers qui CONSTRUISENT eux-mêmes un préfixe `<XX>-YYYY-`. */
function fichiersParPrefixe(prefixe: string): string[] {
  const motif = new RegExp('`' + prefixe + '-\\$\\{');
  return FICHIERS_SERVEUR.filter((f) => motif.test(codeSeul(f)));
}

const FAMILLES = Object.keys(FAMILLES_NUMERO) as FamilleNumero[];

describe('un seul endroit sait numéroter', () => {
  it('le balayage voit bien des fichiers (garde-fou)', () => {
    /**
     * Sans ce cas, un `find` qui ne mord sur rien rendrait une liste vide et
     * toutes les règles suivantes seraient « conformes » sans avoir rien
     * mesuré. Ce dépôt s'est déjà fait prendre quatre fois par un balayage vide.
     */
    expect(FICHIERS_SERVEUR.length, 'aucun fichier serveur balayé').toBeGreaterThan(100);
    expect(FAMILLES.length, 'le catalogue des familles est vide').toBeGreaterThanOrEqual(3);
    expect(codeSeul('server/utils/numerotation.ts')).toContain('padStart(');
  });

  it.each(FAMILLES)('aucun fichier ne fabrique un préfixe %s à la main', (famille) => {
    /**
     * ⚠️ LA RÈGLE EST DÉRIVÉE, PAS RECOPIÉE. Elle itère sur `FAMILLES_NUMERO` :
     * une cinquième famille ajoutée demain est gardée le jour même, sans que
     * personne ne pense à revenir ici. C'est la parade au défaut de couverture
     * « le banc testait client, recolte, stock — pas vente, la seule cassée ».
     *
     * Et le préfixe est le point de passage OBLIGÉ : le fabriquer ailleurs,
     * c'est y remettre une année lue sur le serveur et une politique de
     * millésime décidée en local.
     */
    const prefixe = FAMILLES_NUMERO[famille].prefixe;
    expect(
      fichiersParPrefixe(prefixe),
      `${prefixe}- se fabrique en dehors de numerotation.ts. Quatre copies de ces ` +
        'quinze lignes ont déjà divergé : appelle `prefixeMillesime`.',
    ).toEqual([]);
  });

  it('tout fichier qui fabrique un préfixe lit l’année à PARIS', () => {
    /**
     * ⚠️ DÉFAUT INVISIBLE 364 JOURS SUR 365. `getFullYear()` sur une lambda
     * Vercel lit l'heure UTC : un document émis le 1er janvier à 00 h 30 à
     * Paris (31 décembre 23 h 30 UTC) portait encore le millésime de l'année
     * écoulée — et repartait donc sur une séquence déjà consommée, le premier
     * jour de l'exercice.
     */
    const reveillon = new Date('2026-12-31T23:30:00Z'); // 1er janvier 00 h 30 à Paris
    expect(anneeParis(reveillon)).toBe(2027);
    expect(reveillon.getUTCFullYear(), 'le serveur, lui, dit encore 2026').toBe(2026);

    // On vise les APPELS — `prefixeMillesime('achat', …)` — et non la
    // définition, qui vit dans numerotation.ts et n'a pas d'année à lire.
    const appelants = FICHIERS_SERVEUR.filter((f) => /prefixeMillesime\(\s*'/.test(codeSeul(f)));
    expect(appelants.length, 'personne n’appelle prefixeMillesime : balayage vide').toBeGreaterThan(
      2,
    );
    for (const f of appelants) {
      const code = codeSeul(f);
      expect(code, `${f} doit tirer son année de anneeParis`).toMatch(/anneeParis\(/);
      expect(code, `${f} : getFullYear lit l’heure du SERVEUR, pas celle de Paris`).not.toMatch(
        /getFullYear\(/,
      );
    }
  });

  it('personne ne trie une séquence par `createdAt`', () => {
    /**
     * ⚠️ LE TRI PAR DATE D'INSERTION N'EST PAS LE TRI PAR NUMÉRO, et c'est
     * précisément l'écart qui a produit le doublon de facture : la ligne la
     * plus récemment créée n'est pas celle qui porte le plus grand numéro dès
     * qu'un brouillon, une suppression ou une émission différée bouscule
     * l'ordre. Les quatre copies faisaient toutes la même erreur.
     */
    const numeroteurs = FICHIERS_SERVEUR.filter((f) =>
      /from '~~\/server\/utils\/numerotation'/.test(codeSeul(f)),
    );
    expect(numeroteurs.length, 'personne n’importe numerotation : balayage vide').toBeGreaterThan(
      3,
    );
    for (const f of numeroteurs) {
      const code = codeSeul(f);
      expect(code, `${f} numérote sans passer par ordreNumeroDecroissant`).toMatch(
        /ordreNumeroDecroissant\(|suiteDeNumeros\(|prochainNumero\(/,
      );
      expect(code, `${f} trie encore par createdAt — c'est l'ordre d'INSERTION`).not.toMatch(
        /desc\(\s*\w+\.createdAt\s*\)/,
      );
    }
  });

  it('l’ordre de lecture met la LONGUEUR avant le lexical', () => {
    /**
     * ⚠️ « H-999 » PASSAIT APRÈS « H-1000 ». Le tri texte compare caractère par
     * caractère : « 9 » l'emporte sur « 1 », donc `MAX(numero)` retenait H-999
     * une fois la millième hausse créée, et toutes les générations suivantes
     * repartaient de 1000 — des doublons de numéro, donc de QR, sur le parc
     * d'un professionnel. Sur un format zéro-padé, plus long veut dire plus
     * grand : la longueur doit trier en premier.
     */
    const texte = (n: unknown): string => {
      if (n == null) return '';
      if (typeof n === 'string') return n;
      if (Array.isArray(n)) return n.map(texte).join('');
      const o = n as Record<string, unknown>;
      if (Array.isArray(o.queryChunks)) return o.queryChunks.map(texte).join('');
      if (o.value !== undefined) return texte(o.value);
      return '';
    };
    const ordre = ordreNumeroDecroissant(transactions.numero);
    expect(ordre.length, 'deux critères attendus : longueur puis lexical').toBe(2);
    expect(texte(ordre[0]).toLowerCase(), 'le premier critère doit être la longueur').toContain(
      'length',
    );
  });
});

describe('la mécanique de séquence', () => {
  it('une suite donne des numéros DISTINCTS et consécutifs', () => {
    /**
     * ⚠️ LE DÉFAUT LE PLUS COÛTEUX DE LA FAMILLE, ET IL N'ÉTAIT PAS UNE COURSE.
     * Le cron des achats récurrents traite ses échéances par lots de dix EN
     * PARALLÈLE, et chacune calculait son numéro. Les dix lectures partaient
     * avant la première insertion : trois charges dues le même jour chez le
     * même apiculteur recevaient le MÊME numéro, tous les mois.
     */
    const suite = suiteDeNumeros('AC-2026-0041', prefixeMillesime('achat', 2026), 3);
    expect(suite).toEqual(['AC-2026-0042', 'AC-2026-0043', 'AC-2026-0044']);
    expect(new Set(suite).size, 'des numéros en double dans une même suite').toBe(3);
  });

  it('une suite vide reste vide, une suite d’un seul vaut le prochain', () => {
    expect(suiteDeNumeros('AC-2026-0041', 'AC-2026-', 0)).toEqual([]);
    expect(prochainNumero('AC-2026-0041', 'AC-2026-')).toBe('AC-2026-0042');
    expect(prochainNumero(null, 'AC-2026-')).toBe('AC-2026-0001');
  });

  it('le millésime : les achats repartent à 1, les factures poursuivent', () => {
    /**
     * Deux politiques, et elles ne s'inventent pas : le millésime fait série
     * pour un achat (référence interne), alors que l'article 242 nonies A du
     * CGI impose à la facture une séquence chronologique CONTINUE. Ce cas fige
     * la différence pour qu'un « harmonisons tout ça » ne l'efface pas.
     */
    expect(prochainNumero('AC-2025-0142', prefixeMillesime('achat', 2026))).toBe('AC-2026-0001');
    expect(prochainNumeroFacture('FA-2025-0142', 2026)).toBe('FA-2026-0143');
  });

  it('au-delà de 9999, la séquence continue au lieu de retomber', () => {
    // Le padStart n'est qu'un MINIMUM : le dix-millième document s'écrit sur
    // cinq chiffres, et c'est `ordreNumeroDecroissant` qui garantit qu'on le
    // relira comme le plus grand.
    expect(prochainNumero('FA-2026-9999', 'FA-2026-', { politique: 'poursuivre' })).toBe(
      'FA-2026-10000',
    );
  });

  it('un brouillon en tête ne fait plus repartir la séquence à 0001', () => {
    /**
     * Le cœur du défaut d'origine, en une assertion pure. Le helper écarte les
     * numéros nuls AVANT de trier ; ce cas vérifie la conséquence : le dernier
     * numéro ÉMIS gouverne, quoi qu'il y ait de plus récent en base.
     */
    expect(prochainNumeroFacture('FA-2026-0007', 2026)).toBe('FA-2026-0008');
    expect(prochainNumeroFacture(null, 2026)).toBe('FA-2026-0001');
  });
});
