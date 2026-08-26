import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { prochainNumero } from '~~/server/utils/factureNumero';
import { anneeParis } from '~~/server/utils/horloge';

/**
 * DEUX FACTURES AVEC LE MÊME NUMÉRO LÉGAL, ET RIEN POUR LE DIRE.
 *
 * `server/utils/factureNumero.ts` porte déjà, dans son commentaire, le récit du
 * défaut : trier par `createdAt` sans écarter les numéros nuls « produisait des
 * doublons […] violation directe de l'unicité légale ». Le helper a été
 * corrigé. Les DEUX routes de bons de livraison, elles, gardaient chacune sa
 * copie des seize mêmes lignes — dans leur version d'avant le correctif.
 *
 * Le scénario, en clair : une vente laissée en BROUILLON porte `numero = null`
 * et devient la ligne la plus récente. Le tri par `createdAt` la remonte,
 * `lastNumero.numero` vaut null, aucune branche ne s'applique, la séquence
 * repart à 0001 — déjà utilisée. `transactions.numero` n'ayant aucune
 * contrainte d'unicité en base, l'insertion passe sans un mot, et l'apiculteur
 * découvre le doublon dans son export comptable.
 *
 * ⚠️ CE BANC NE NOMME PAS LES DEUX ROUTES. Une liste de deux fichiers
 * verrouillerait les deux copies connues et laisserait passer la troisième.
 * Il balaie `server/` et exige qu'UN SEUL fichier sache fabriquer un FA- :
 * celui dont c'est le métier.
 */

/**
 * Les fichiers qui CONSTRUISENT une séquence `<prefixe>-YYYY-NNNN`.
 *
 * ⚠️ ON BLANCHIT LES COMMENTAIRES, ET CE N'EST PAS UNE PRÉCAUTION THÉORIQUE :
 * la première version de ce banc s'accusait elle-même. Les deux routes
 * corrigées portent maintenant un commentaire qui EXPLIQUE le défaut, et ce
 * commentaire contient « FA- ». Le balayage les redésignait donc coupables
 * alors qu'elles étaient réparées — sixième fois que ce dépôt tombe dans ce
 * piège, d'où la règle : on ne cherche jamais une chaîne dans un fichier sans
 * avoir d'abord retiré ce qui n'est pas du code.
 */
function fichiersParPrefixe(prefixe: string): string[] {
  const fichiers = execSync('find server -name "*.ts"', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  const motif = new RegExp('`' + prefixe + '-\\$\\{');
  return fichiers
    .filter((f) => {
      const code = readFileSync(f, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');
      return motif.test(code);
    })
    .sort();
}

describe('un seul endroit sait numéroter une facture', () => {
  it('le balayage voit bien des fichiers (garde-fou)', () => {
    /**
     * Sans ce cas, un `grep` qui ne mord sur rien rendrait une liste vide et la
     * règle suivante serait « conforme » sans avoir rien mesuré. Ce dépôt s'est
     * déjà fait prendre quatre fois par un balayage vide.
     */
    const tous = execSync('find server -name "*.ts" | wc -l', { encoding: 'utf-8' });
    expect(Number(tous.trim()), 'aucun fichier serveur balayé').toBeGreaterThan(100);
    expect(readFileSync('server/utils/factureNumero.ts', 'utf-8')).toContain('padStart(4');
  });

  it('personne d’autre que `factureNumero.ts` ne fabrique un FA-', () => {
    expect(
      fichiersParPrefixe('FA'),
      'la séquence des FACTURES est la seule dont l’unicité est une obligation ' +
        'légale : elle doit avoir exactement une source. Appelle `genererNumeroFacture`.',
    ).toEqual(['server/utils/factureNumero.ts']);
  });

  it('la séquence des bons de livraison a, elle aussi, une seule source', () => {
    // `BL-` n'a pas de contrainte légale, mais deux copies d'une séquence
    // divergent tout autant. Une seule aujourd'hui : on la garde ainsi.
    expect(fichiersParPrefixe('BL')).toEqual(['server/api/bons-livraison/index.post.ts']);
  });

  it('la séquence des achats en a DEUX — dette connue, et bornée à deux', () => {
    /**
     * ⚠️ CE CAS NE CACHE PAS UN DÉFAUT, IL LE COMPTE.
     *
     * `AC-` est fabriqué à l'identique dans la route et dans le cron : les
     * mêmes quatorze lignes, deux fois. C'est la même famille de recopie que
     * celle qui a produit le doublon de facture, avec un risque moindre — un
     * numéro d'achat est une référence interne, pas une mention légale.
     *
     * Le corriger sort du périmètre de ce lot. Mais le TAIRE reviendrait à le
     * perdre : ce cas fige donc la dette à deux fichiers, nommés. Une
     * troisième copie fera rougir le banc, et celui qui l'écrira lira cette
     * note avant de continuer.
     */
    expect(fichiersParPrefixe('AC')).toEqual([
      'server/api/finances/achats.post.ts',
      'server/crons/achats-recurrents.ts',
    ]);
  });

  it('un brouillon en tête ne fait plus repartir la séquence à 0001', () => {
    /**
     * Le cœur du défaut, en une assertion pure. Le helper écarte les numéros
     * nuls AVANT de trier ; ce cas vérifie la conséquence : le dernier numéro
     * ÉMIS gouverne, quoi qu'il y ait de plus récent en base.
     */
    expect(prochainNumero('FA-2026-0007', 2026)).toBe('FA-2026-0008');
    // Et le cas qui produisait le doublon : si un `null` remontait, on
    // repartirait de 1. La garde vit dans la requête, pas ici — mais si
    // quelqu'un la retire, c'est bien 0001 qui sortira.
    expect(prochainNumero(null, 2026)).toBe('FA-2026-0001');
  });

  it('l’année du numéro est celle de PARIS, pas celle du serveur', () => {
    /**
     * ⚠️ DÉFAUT INVISIBLE 364 JOURS SUR 365. `getFullYear()` sur une lambda
     * Vercel lit l'heure UTC : une facture émise le 1er janvier à 00 h 30 à
     * Paris (31 décembre 23 h 30 UTC) portait encore le préfixe de l'année
     * écoulée — et repartait donc sur une séquence déjà consommée, le premier
     * jour de l'exercice.
     */
    const reveillon = new Date('2026-12-31T23:30:00Z'); // 1er janvier 00 h 30 à Paris
    expect(anneeParis(reveillon)).toBe(2027);
    expect(reveillon.getUTCFullYear(), 'le serveur, lui, dit encore 2026').toBe(2026);

    const source = readFileSync('server/utils/factureNumero.ts', 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*)/.test(l))
      .join('\n');
    expect(source, 'le helper doit APPELER anneeParis').toMatch(/anneeParis\(\s*\w/);
    expect(source, 'getFullYear est revenu : il lit l’heure du serveur').not.toMatch(
      /getFullYear\(/,
    );
  });
});
