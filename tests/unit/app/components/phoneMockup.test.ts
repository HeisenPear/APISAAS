import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Le simulateur de téléphone de la page d'accueil : cohérence de ses écrans.
 *
 * Ce banc naît d'un défaut réel. Le nombre d'écrans était écrit en dur dans le
 * gestionnaire de glissement (« currentSlide < 3 ») ; en ajoutant un cinquième
 * écran, la barre du bas y menait mais le doigt non. Un écran inatteignable au
 * toucher est un écran qu'on ne verra pas sur téléphone — c'est-à-dire là où ce
 * simulateur sert à quelque chose.
 */
const SOURCE = readFileSync('app/components/ui/PhoneMockup.vue', 'utf-8');

/**
 * On inspecte le code, pas les commentaires. Un banc satisfait par sa propre
 * note explicative ne prouve rien — le piège est déjà tombé dans ce dépôt.
 */
function sansCommentaires(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const CODE = sansCommentaires(SOURCE);

const nbEcrans = (): number => {
  const m = CODE.match(/const NB_ECRANS = (\d+);/);
  if (!m) throw new Error('NB_ECRANS introuvable — a-t-il été remplacé par un nombre en dur ?');
  return Number(m[1]);
};

describe('PhoneMockup — autant d’écrans que de chemins pour y aller', () => {
  it('chaque écran déclaré a sa diapo', () => {
    const diapos = new Set([...CODE.matchAll(/slideClass\((\d+)\)/g)].map((m) => Number(m[1])));
    expect(
      [...diapos].sort((a, b) => a - b),
      'une diapo manque, ou une diapo en trop par rapport à NB_ECRANS',
    ).toEqual(Array.from({ length: nbEcrans() }, (_, i) => i));
  });

  it('chaque écran a son onglet dans la barre du bas', () => {
    const onglets = new Set(
      [...CODE.matchAll(/currentSlide === (\d+) \}" @click="goTo\((\d+)\)/g)].map((m) =>
        Number(m[2]),
      ),
    );
    expect(
      [...onglets].sort((a, b) => a - b),
      'un écran n’est pas atteignable depuis la barre de navigation',
    ).toEqual(Array.from({ length: nbEcrans() }, (_, i) => i));
  });

  it('le glissement au doigt atteint le DERNIER écran', () => {
    /**
     * Le défaut d'origine, en une assertion. On refuse toute borne écrite en
     * dur : elle sera fausse au prochain écran ajouté, et silencieusement.
     */
    const glissement = CODE.match(/if \(diff > 0 && currentSlide\.value < ([^)]+)\)/);
    expect(glissement, 'gestionnaire de glissement introuvable').not.toBeNull();
    expect(
      glissement![1]!.trim(),
      'la borne du glissement est écrite en dur : elle sera fausse au prochain écran',
    ).toBe('NB_ECRANS - 1');
  });
});
