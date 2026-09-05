import { describe, it, expect } from 'vitest';
import { LONGUEUR_MAX_SLUG, SLUG_DE_SECOURS, slugCandidat, slugDeTitre } from '~/utils/forumSlug';

/**
 * L'URL d'un sujet de forum est INDEXÉE et se partage par lien : elle survit à
 * son déploiement, comme les QR imprimés. Une fabrique unique, donc, et un banc
 * qui tient ses bords — dont un qui n'a rien d'évident : le slug VIDE.
 */

describe('slugDeTitre — la forme normale', () => {
  it('garde-fou : un titre ordinaire donne un slug lisible', () => {
    // Si ce cas tombe, tous les autres mesureraient une fonction déjà cassée.
    expect(slugDeTitre('Traitement varroa en août')).toBe('traitement-varroa-en-aout');
  });

  it('retire les accents — « traité » et « traite » se rangent ensemble', () => {
    expect(slugDeTitre('Réunir deux colonies dépeuplées')).toBe('reunir-deux-colonies-depeuplees');
  });

  it('avale les apostrophes, droites comme typographiques', () => {
    /**
     * Le français en est plein, et les deux formes coexistent dans le produit
     * (les libellés d'interface utilisent la typographique, les saisies libres
     * la droite). Les traiter différemment donnerait deux URL pour un titre que
     * l'apiculteur croit identique.
     */
    expect(slugDeTitre("L'essaimage de l'année")).toBe('l-essaimage-de-l-annee');
    expect(slugDeTitre('L’essaimage de l’année')).toBe('l-essaimage-de-l-annee');
  });

  it('ne laisse jamais de tiret en tête ni en queue', () => {
    // « ...miel ? » finirait sur `-`, et `/forum/mon-miel-` n'est pas
    // `/forum/mon-miel` : deux URL pour un fil.
    expect(slugDeTitre('  Quel miel ?  ')).toBe('quel-miel');
    expect(slugDeTitre('--- Alerte ---')).toBe('alerte');
  });

  it('ne double jamais un tiret', () => {
    expect(slugDeTitre('Varroa : que faire ?? (urgent)')).toBe('varroa-que-faire-urgent');
  });
});

describe('slugDeTitre — le slug vide, qui est une AUTRE PAGE', () => {
  /**
   * ⚠️ LE PIÈGE QUE CE FICHIER EXISTE POUR FERMER. Un titre entièrement fait
   * d'émojis ou de ponctuation se nettoie en chaîne VIDE. Le sujet serait créé,
   * stocké, et son URL serait `/forum/` — c'est-à-dire la LISTE des sujets. Son
   * auteur cliquerait sur son propre fil et retomberait sur la liste, sans
   * message d'erreur, sans 404, sans rien à quoi se raccrocher.
   *
   * Et ce n'est pas un cas d'école : « 🐝🐝🐝 », « ??? », « !!! » sont des
   * titres qu'on tape vraiment.
   */
  it('un titre entièrement décoratif tombe sur le slug de secours', () => {
    expect(slugDeTitre('🐝🐝🐝')).toBe(SLUG_DE_SECOURS);
    expect(slugDeTitre('???')).toBe(SLUG_DE_SECOURS);
    expect(slugDeTitre('   ')).toBe(SLUG_DE_SECOURS);
    expect(slugDeTitre('')).toBe(SLUG_DE_SECOURS);
  });

  it('le slug de secours n’est lui-même jamais vide', () => {
    // Une constante vide rendrait le garde-fou précédent vert pour rien.
    expect(SLUG_DE_SECOURS.length).toBeGreaterThan(0);
  });

  it('AUCUN titre, si tordu soit-il, ne produit un slug vide', () => {
    const titres = [
      '🐝',
      '— — —',
      '«»',
      '...',
      '\n\t',
      '///',
      '中文标题',
      '👋🏽 ',
      '-'.repeat(200),
      '?'.repeat(200),
    ];
    for (const t of titres) {
      expect(slugDeTitre(t), `« ${t} » produit un slug vide, donc l’URL de la liste`).not.toBe('');
    }
  });
});

describe('slugDeTitre — la longueur', () => {
  it('coupe sur un mot ENTIER, sans laisser de tiret', () => {
    /**
     * ⚠️ CE CAS A DÉJÀ ÉTÉ FAUX, ET IL EST INSTRUCTIF. Sa première version
     * vérifiait que le slug, tirets remplacés par des espaces, était contenu
     * dans le titre. Or une coupe EN PLEIN MOT reste un préfixe du titre :
     * « …de la rein » y figure aussi bien que « …de la ». Neutraliser la coupe
     * sur mot entier laissait le cas VERT — mesuré.
     *
     * Ce qu'il fallait affirmer est plus étroit : chaque morceau du slug est un
     * mot COMPLET du titre. « rein » ne l'est pas ; « reine » l'est.
     */
    const titre =
      'Comment traiter le varroa en fin de saison sans compromettre la ponte de la reine ni les réserves';
    const motsDuTitre = new Set(
      titre
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    );

    const slug = slugDeTitre(titre);
    expect(slug.length).toBeLessThanOrEqual(LONGUEUR_MAX_SLUG);
    expect(slug.endsWith('-')).toBe(false);

    const tronques = slug.split('-').filter((mot) => !motsDuTitre.has(mot));
    expect(
      tronques,
      `Le slug se termine sur un mot coupé (${tronques.join(', ')}) : « varroa-tra » ` +
        `se lit comme une faute de frappe, pas comme une troncature.`,
    ).toEqual([]);
  });

  it('un seul mot plus long que la limite est coupé net plutôt que rendu entier', () => {
    // Sans ce cas, `lastIndexOf('-')` vaudrait −1 et on rendrait le mot complet
    // — c'est-à-dire une limite annoncée mais pas appliquée.
    const slug = slugDeTitre('a'.repeat(200));
    expect(slug.length).toBe(LONGUEUR_MAX_SLUG);
  });

  it('un titre court n’est pas touché', () => {
    expect(slugDeTitre('Miel de tilleul')).toBe('miel-de-tilleul');
  });
});

describe('slugCandidat — l’unicité, sans déformer le premier', () => {
  it('le rang 0 rend la base telle quelle', () => {
    /**
     * ⚠️ LE PREMIER SUJET NE DOIT JAMAIS PORTER DE SUFFIXE. Si le rang 0 rendait
     * « varroa-1 », l'URL d'un fil dépendrait de l'ordre de création — et deux
     * dépôts avec les mêmes fils dans un ordre différent donneraient des liens
     * différents.
     */
    expect(slugCandidat('varroa', 0)).toBe('varroa');
    expect(slugCandidat('varroa', -1)).toBe('varroa');
  });

  it('les rangs suivants numérotent à partir de 2, pas de 1', () => {
    // « varroa » puis « varroa-2 » se lit ; « varroa » puis « varroa-1 » laisse
    // croire qu'il manque un fil quelque part.
    expect(slugCandidat('varroa', 1)).toBe('varroa-2');
    expect(slugCandidat('varroa', 2)).toBe('varroa-3');
  });

  it('chaque rang donne un candidat distinct', () => {
    const vus = new Set(Array.from({ length: 20 }, (_, i) => slugCandidat('essaim', i)));
    expect(vus.size).toBe(20);
  });
});
