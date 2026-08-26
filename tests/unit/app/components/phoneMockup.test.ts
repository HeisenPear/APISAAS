import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * Le simulateur de téléphone de la page d'accueil : cohérence de ses écrans.
 *
 * Ce banc naît d'un défaut réel. Le nombre d'écrans était écrit en dur dans le
 * gestionnaire de glissement (« currentSlide < 3 ») ; en ajoutant un cinquième
 * écran, la barre du bas y menait mais le doigt non. Un écran inatteignable au
 * toucher est un écran qu'on ne verra pas sur téléphone — c'est-à-dire là où ce
 * simulateur sert à quelque chose.
 *
 * ⚠️ CE BANC A CHANGÉ DE FORME AVEC LA BARRE, ET IL FAUT DIRE POURQUOI.
 * Il exigeait « chaque écran a son onglet dans la barre du bas ». Cette règle
 * a eu un effet pervers : elle a fait de la barre le sélecteur de diapos, donc
 * chaque écran ajouté au simulateur y ajoutait son onglet — jusqu'à décrire une
 * navigation qui n'existe pas (Accueil · Visites · Ruchers · Élevage ·
 * Finances au lieu d'Aujourd'hui · Ruchers · Maya·Créer · Tournée · Plus).
 * Un banc peut garder une propriété et, ce faisant, en détruire une autre.
 *
 * La barre est maintenant une photo fidèle de `BottomNav.vue` — gardée par
 * `maquettesFideles.test.ts` — et le pilotage est passé à une rangée de points.
 * La garantie d'origine tient toujours, mais par un chemin qui ne peut plus
 * mentir : les points ITÈRENT sur la liste des écrans.
 */
const SOURCE = readFileSync('app/components/ui/PhoneMockup.vue', 'utf-8');

/**
 * On inspecte le code, pas les commentaires. Un banc satisfait par sa propre
 * note explicative ne prouve rien — le piège est déjà tombé dans ce dépôt.
 */
const CODE = sansCommentaires(SOURCE);

/** Les écrans déclarés — la liste est la seule source, le compte s'en dérive. */
const ecrans = (): string[] => {
  const m = CODE.match(/const ECRANS = \[([^\]]*)\] as const;/);
  if (!m) throw new Error('ECRANS introuvable — la liste des écrans a-t-elle été remplacée ?');
  return [...m[1]!.matchAll(/'([^']+)'/g)].map((e) => e[1]!);
};

describe('PhoneMockup — autant d’écrans que de chemins pour y aller', () => {
  it('le compte d’écrans se DÉRIVE de la liste', () => {
    expect(ecrans().length, 'la liste des écrans doit être non vide').toBeGreaterThan(2);
    expect(CODE, 'NB_ECRANS doit se déduire de ECRANS, jamais être écrit en dur').toContain(
      'const NB_ECRANS = ECRANS.length;',
    );
  });

  it('chaque écran déclaré a sa diapo', () => {
    const diapos = new Set([...CODE.matchAll(/slideClass\((\d+)\)/g)].map((m) => Number(m[1])));
    expect(
      [...diapos].sort((a, b) => a - b),
      'une diapo manque, ou une diapo en trop par rapport à ECRANS',
    ).toEqual(Array.from({ length: ecrans().length }, (_, i) => i));
  });

  it('chaque écran est atteignable au doigt, par construction', () => {
    /**
     * On n'énumère plus les points un par un : on exige qu'ils itèrent sur
     * `ECRANS`. Une liste écrite à la main peut oublier un écran ; une boucle
     * sur la source, non. C'est la version forte de la garantie d'origine.
     */
    const points = CODE.slice(
      CODE.indexOf('<div class="phone-dots">'),
      CODE.indexOf('</div>', CODE.indexOf('<div class="phone-dots">')),
    );
    expect(points, 'la rangée de points est introuvable').toContain('phone-dot');
    expect(points, 'les points doivent parcourir ECRANS, pas une liste recopiée').toMatch(
      /v-for="\(nom, i\) in ECRANS"/,
    );
    expect(points, 'un point doit mener à son écran').toContain('@click="goTo(i)"');
    expect(points, 'chaque point doit porter le nom de son écran').toContain(':aria-label=');
  });

  it('la barre du bas ne pilote plus le carrousel', () => {
    /**
     * LA RÈGLE QUI EMPÊCHE LA DÉRIVE DE REVENIR. Tant que la barre changeait
     * d'écran, elle avait une raison de suivre les diapos plutôt que
     * l'application. Elle est décorative : plus un seul `goTo` dedans.
     */
    const barre = CODE.slice(CODE.indexOf('<nav class="phone-nav"'), CODE.indexOf('</nav>'));
    expect(barre.length, 'la barre du bas est introuvable').toBeGreaterThan(100);
    expect(barre, 'la barre est une photo de l’app, pas un sélecteur de diapos').not.toContain(
      'goTo(',
    );
    expect(barre, 'décorative : elle ne doit pas doubler la navigation').toContain(
      'aria-hidden="true"',
    );
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
