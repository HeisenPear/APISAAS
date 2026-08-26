import { describe, it, expect } from 'vitest';
import { globSync } from 'node:fs';
import { corpsDuComposant } from '~~/tests/helpers/corpsDuComposant';

/**
 * MAYA « TRAÎNAIT UN PEU PARTOUT N'IMPORTE COMMENT » SUR LA PAGE D'ACCUEIL.
 *
 * Le désordre n'était pas une impression : il se comptait.
 *
 *  · DEUX LOGOS sur la même page. L'alvéole vivante (`IaMayaMark`) à quatre
 *    endroits, et un glyphe `✦` codé en dur dans `PhoneMockup` et `WebMockup` —
 *    pendant qu'un commentaire d'à côté affirmait que « la maquette montre
 *    désormais exactement ce que l'apiculteur verra ».
 *  · CINQ APPELLATIONS : « votre copilote », « Assistant apicole »,
 *    « l'assistante », « la copilote », « le nouveau cœur d'APIGO ». Un produit
 *    qui porte cinq noms n'en porte aucun.
 *  · DEUX BADGES « NOUVEAU » pour la même nouveauté, à deux sections d'écart.
 *    Le second dit au lecteur qu'il a manqué quelque chose.
 *  · DES IMPASSES : un seul lien vers `/maya` sur toute la landing. Les deux
 *    autres blocs qui la présentent ne menaient nulle part — on montrait, sans
 *    jamais proposer d'aller voir.
 *
 * ⚠️ CE QUE CE BANC NE FAIT PAS. Il ne juge pas le ton et ne compte pas les
 * mots. Il tient quatre invariants vérifiables, et rien d'autre. Le reste — le
 * rythme, l'ordre des sections — est du travail d'œil, il se regarde.
 *
 * ⚠️ ET CE QU'IL S'INTERDIT DE « CORRIGER ». Maya TUTOIE dans l'application
 * (« tes ruches », « tes données », « Dis-moi » — `server/utils/copilote-local.ts`)
 * pendant que la landing VOUVOIE. Une maquette de l'application doit donc
 * tutoyer : le tutoiement du simulateur n'est pas une faute d'harmonisation,
 * c'est une citation exacte. C'est le PRODUIT qui doit trancher son registre,
 * pas la page d'accueil qui doit lisser la citation.
 */

/** Les blocs de la page d'accueil. `maya/` en est exclu : ce sont les chapitres de `/maya`. */
const LANDING = globSync('app/components/landing/*.vue').sort();
const MAQUETTES = ['app/components/ui/PhoneMockup.vue', 'app/components/ui/WebMockup.vue'];

const corps = corpsDuComposant;

describe('Maya, sur la page d’accueil : un logo, un nom, une porte', () => {
  it('le balayage voit bien les blocs (garde-fou du banc)', () => {
    expect(LANDING.length).toBeGreaterThan(10);
    expect(LANDING).toContain('app/components/landing/LandingMaya.vue');
    for (const f of MAQUETTES) expect(corps(f).length).toBeGreaterThan(500);
  });

  it('un seul logo : aucun glyphe de substitution', () => {
    /**
     * `IaMayaMark` est le signe du produit. Tout caractère décoratif employé à
     * sa place fait un second logo — et deux logos valent zéro logo.
     */
    const GLYPHES = ['✦', '✧', '✨', '⬡', '⬢', '❋', '✴'];
    const fautes: string[] = [];
    for (const f of [...LANDING, ...MAQUETTES]) {
      const gabarit = corps(f);
      for (const g of GLYPHES) if (gabarit.includes(g)) fautes.push(`${f} — « ${g} »`);
    }
    expect(fautes, 'le logo de Maya est <IaMayaMark>, pas un caractère').toEqual([]);
  });

  it('un seul nom : « copilote », jamais « assistant »', () => {
    /**
     * On ne cherche pas le mot « assistant » — il a des usages légitimes
     * (« assistance », un attribut ARIA). On cherche les APPELLATIONS : le mot
     * suivi de « apicole », ou précédé d'un possessif.
     */
    const MOTIFS = [
      /\bassistante?\s+apicole\b/gi,
      /\b(?:votre|notre|l['’]|une?)\s*assistante?\b(?!\s*(?:vocal|de\s+saisie))/gi,
    ];
    const fautes: string[] = [];
    for (const f of [...LANDING, ...MAQUETTES]) {
      const gabarit = corps(f);
      for (const motif of MOTIFS) {
        for (const m of gabarit.matchAll(motif)) fautes.push(`${f} — « ${m[0].trim()} »`);
      }
    }
    expect(fautes, 'la landing dit « copilote » — un seul mot pour un seul rôle').toEqual([]);
  });

  it('un seul badge « Nouveau » sur toute la page', () => {
    /**
     * Le badge appartient à la section qui PRÉSENTE Maya. Un second, deux
     * sections plus loin, ne dit plus « c'est nouveau » : il dit « vous avez
     * raté quelque chose ».
     */
    const porteurs = LANDING.filter((f) => /\bNouveau\b/.test(corps(f)));
    expect(
      porteurs,
      'un seul bloc doit porter la pastille « Nouveau » — les autres la répètent',
    ).toEqual(['app/components/landing/LandingMaya.vue']);
  });

  it('aucun bloc qui présente Maya n’est une impasse', () => {
    /**
     * « Présenter Maya » = la nommer dans un titre, ou dans le `titre` d'un bloc
     * de données. Une simple mention dans une phrase (le hero) ne compte pas :
     * on ne demande pas un lien à chaque fois qu'on prononce son nom.
     */
    const sansSortie: string[] = [];
    for (const f of LANDING) {
      const gabarit = corps(f);
      const titres = [
        ...gabarit.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g),
        ...gabarit.matchAll(/titre:\s*'([^']*)'/g),
      ].map((m) => m[1] ?? '');
      if (!titres.some((t) => /\bMaya\b/.test(t))) continue;
      if (!gabarit.includes("'/maya'") && !gabarit.includes('"/maya"')) sansSortie.push(f);
    }
    expect(
      sansSortie,
      'un bloc qui présente Maya doit proposer d’aller la voir — sinon il expose sans conclure',
    ).toEqual([]);
  });
});
