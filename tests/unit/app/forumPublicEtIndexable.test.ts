import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sansCommentaires } from '../../helpers/sansCommentaires';
import { NAV_SECTIONS } from '~/config/navigation';

/**
 * « Le forum est public et indexable » est une propriété qui ne vit dans AUCUN
 * fichier de code : elle est la CONJONCTION de quatre réglages posés dans
 * quatre fichiers différents, dont aucun ne mentionne les trois autres.
 *
 *   1. `/forum` absent de `supabase.redirectOptions.include` → lisible sans compte ;
 *   2. `/forum` absent des `Disallow` de `robots.txt`        → explorable ;
 *   3. `/forum` présent dans `nitro.prerender.ignore`        → rendu à la demande,
 *      donc jamais figé à l'instant du déploiement ;
 *   4. `/forum` présent dans le sitemap                      → trouvable.
 *
 * ⚠️ CHACUN SE CASSE SANS QUE RIEN NE ROUGISSE. Ajouter `/forum` à la liste de
 * redirection au cours d'un rangement de routes privées le rendrait invisible
 * aux moteurs — la page continuerait de marcher pour les gens connectés, donc
 * pour tous ceux qui la testent, et personne ne le verrait. Le retirer de
 * `prerender.ignore` le figerait au dernier déploiement : le forum serait bien
 * là, complet, et daterait de trois semaines.
 *
 * C'est exactement la classe de défaut que ce dépôt appelle « la règle dans un
 * commentaire » : la raison était écrite, juste, et dans un seul fichier.
 */

const NUXT = sansCommentaires(readFileSync('nuxt.config.ts', 'utf-8'));
const ROBOTS = readFileSync('public/robots.txt', 'utf-8');
const SITEMAP = sansCommentaires(readFileSync('server/routes/sitemap.xml.ts', 'utf-8'));

/** Le bloc `include:` de `redirectOptions` — celui qui exige une session. */
function listeRedirection(): string {
  const i = NUXT.indexOf('redirectOptions');
  expect(i, 'redirectOptions a disparu de nuxt.config.ts').toBeGreaterThan(-1);
  const j = NUXT.indexOf('exclude:', i);
  return NUXT.slice(i, j > i ? j : i + 4000);
}

/** Le bloc `ignore:` du prérendu. */
function listePrerendu(): string {
  const i = NUXT.indexOf('prerender');
  expect(i, 'la section prerender a disparu de nuxt.config.ts').toBeGreaterThan(-1);
  return NUXT.slice(i, i + 4000);
}

describe('le forum est PUBLIC — quatre réglages, quatre fichiers', () => {
  it('garde-fou : les trois fichiers sont bien lus', () => {
    /**
     * Sans ce cas, un chemin erroné rendrait des chaînes vides et TOUTES les
     * règles ci-dessous seraient vertes sans rien avoir mesuré. Ce dépôt s'est
     * fait prendre plusieurs fois par un balayage vide.
     */
    expect(listeRedirection()).toContain('/dashboard');
    expect(listePrerendu()).toContain('/dashboard');
    expect(ROBOTS).toContain('Disallow: /dashboard');
    expect(SITEMAP).toContain("loc: '/blog'");
  });

  it('1 · aucune session n’est exigée pour lire le forum', () => {
    expect(
      listeRedirection().includes("'/forum"),
      'Le forum est entré dans `redirectOptions.include` : un visiteur déconnecté est ' +
        'renvoyé vers /login, et le forum n’est plus ni lisible ni indexable. Il continuera ' +
        'de marcher pour vous, qui êtes connecté — c’est ce qui rend ce défaut invisible.',
    ).toBe(false);
  });

  it('2 · les moteurs ont le droit d’explorer le forum', () => {
    const interdits = ROBOTS.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('Disallow:'))
      .map((l) => l.slice('Disallow:'.length).trim());
    expect(
      interdits.filter((d) => d && '/forum'.startsWith(d)),
      'Un `Disallow` de robots.txt couvre /forum. Le forum public existe POUR être ' +
        'trouvé : l’interdire d’exploration le rend inutile à quiconque n’a pas déjà un compte.',
    ).toEqual([]);
  });

  it('3 · le forum n’est jamais FIGÉ au build', () => {
    expect(
      listePrerendu().includes("'/forum'"),
      'Le forum a quitté `nitro.prerender.ignore`. Il serait alors prérendu, donc gelé à ' +
        'l’instant du déploiement : les messages postés après resteraient invisibles aux ' +
        'moteurs jusqu’à la mise en production suivante. La page marcherait — elle serait ' +
        'seulement vieille, ce qui ne se voit pas.',
    ).toBe(true);
  });

  it('4 · le forum est dans le sitemap', () => {
    expect(SITEMAP, 'Le forum a quitté le sitemap : plus rien n’amorce son exploration.').toContain(
      "loc: '/forum'",
    );
  });
});

describe('le forum est dans la navigation, et il y est GRATUIT', () => {
  const items = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.key })));
  const forum = items.find((i) => i.to === '/forum');

  it('il figure bien dans la barre latérale', () => {
    expect(
      forum,
      '/forum n’est dans aucune section de navigation : la page existe et rien n’y mène',
    ).toBeDefined();
  });

  it('AUCUNE feature de plan ne le verrouille', () => {
    /**
     * ⚠️ UNE `feature` ICI POSERAIT UN CADENAS SUR LE FORUM. C'est une décision
     * de catalogue, et le catalogue appartient à l'apiculteur — pas à un
     * chantier. Le forum a été livré sans gate DÉLIBÉRÉMENT : une communauté où
     * seuls les comptes payants écrivent n'est pas une communauté.
     *
     * Ce cas n'interdit pas de changer d'avis. Il exige que ce soit un choix,
     * pas un effet de bord — le faire rougir oblige à venir lire cette note.
     */
    expect(
      forum?.feature,
      'Le forum a reçu une feature de plan. C’est une décision de catalogue : elle appartient ' +
        'à l’apiculteur, et elle change ce que quatre formules incluent.',
    ).toBeUndefined();
  });

  it('les quatre entrées communautaires sont rangées ensemble', () => {
    /**
     * Le regroupement demandé : ce qui vient des AUTRES apiculteurs sous un
     * même titre. Sans ce cas, une entrée qui repart sous « Rucher » au détour
     * d'une édition ne ferait rien tomber — et le rangement se déferait
     * exactement comme il s'était fait, une ligne à la fois.
     */
    const attendues = ['/forum', '/frelon', '/floraisons', '/communaute'];
    const sections = attendues.map((to) => items.find((i) => i.to === to)?.section);
    expect(
      sections,
      `chaque page communautaire doit exister : ${attendues.join(', ')}`,
    ).not.toContain(undefined);
    expect(
      new Set(sections).size,
      `elles sont éparpillées dans : ${[...new Set(sections)].join(', ')}`,
    ).toBe(1);
  });

  /**
   * Le seul doublon libellé/section ANTÉRIEUR à ce chantier.
   *
   * ⚠️ IL EST INSCRIT ICI PLUTÔT QUE CORRIGÉ, ET C'EST DÉLIBÉRÉ. « Transhumance
   * › Transhumance » se lit comme un défaut d'affichage, exactement comme
   * l'aurait fait « Communauté › Communauté » — mais le renommer change un mot
   * que l'apiculteur voit, et le registre de langue du produit ne se tranche
   * pas au détour d'un chantier sur le forum. La règle le NOMME donc, au lieu
   * de le taire ou de le réparer sans qu'on le demande.
   *
   * Une seule ligne à supprimer le jour où le libellé est choisi.
   */
  const DOUBLONS_CONNUS = ['Transhumance › Transhumance'];

  it('aucun NOUVEL item ne porte le même libellé que sa section', () => {
    /**
     * « Communauté › Communauté » se lit comme un défaut d'affichage, pas comme
     * un rangement. La règle vaut pour toutes les sections, pas seulement
     * celle-ci : c'est le genre de doublon qu'un regroupement produit
     * naturellement, et qu'on ne voit plus après l'avoir regardé dix fois.
     */
    const doublons = NAV_SECTIONS.flatMap((s) =>
      s.items.filter((i) => i.label === s.label).map((i) => `${s.label} › ${i.label}`),
    );
    expect(
      doublons.filter((d) => !DOUBLONS_CONNUS.includes(d)),
      'Un item porte le libellé de sa propre section. Renomme-le, ou inscris-le dans ' +
        'DOUBLONS_CONNUS si c’est un mot qui appartient à l’apiculteur.',
    ).toEqual([]);
  });

  it('les doublons connus existent encore — sinon la dispense est morte', () => {
    /**
     * Une dispense qui ne correspond plus à rien est un trou en puissance : elle
     * sera reprise telle quelle et couvrira un jour autre chose. Même règle que
     * « aucune exemption ne pointe dans le vide » du banc de cloisonnement.
     */
    const doublons = NAV_SECTIONS.flatMap((s) =>
      s.items.filter((i) => i.label === s.label).map((i) => `${s.label} › ${i.label}`),
    );
    for (const connu of DOUBLONS_CONNUS) {
      expect(doublons, `${connu} n’existe plus : retire-le de DOUBLONS_CONNUS`).toContain(connu);
    }
  });
});
