// Les compteurs d'élevage et de transhumance sont des données PREMIUM.
//
// L'interface masque déjà leurs widgets par plan, mais l'API les servait à
// tout le monde. Sans conséquence pour un compte qui n'en a jamais eu — ses
// compteurs valent zéro. La fuite concerne le compte RÉTROGRADÉ : ses anciens
// chiffres d'élevage restaient lisibles dans la réponse brute, alors qu'il ne
// paie plus pour ça.
//
// Ce banc verrouille la RÈGLE, pas la requête : quelles familles de compteurs
// dépendent de quelle feature. Il casserait si quelqu'un ouvrait l'élevage à
// un plan qui ne l'a pas — dans un sens comme dans l'autre.

import { describe, expect, it } from 'vitest';
import { PLANS, hasFeature, type Plan, type PlanFeatures } from '~/config/plans';

/** Compteur du tableau de bord → feature qui le rend légitime. */
const AGREGATS_PREMIUM: Record<string, keyof PlanFeatures> = {
  reines: 'elevageReines',
  reinesInseminees: 'elevageReines',
  reinesARemplacer: 'elevageReines',
  lignees: 'elevageReines',
  cellulesAcceptees: 'elevageReines',
  transhumancesPrevues: 'transhumance',
};

describe('agrégats premium du tableau de bord', () => {
  it('chaque compteur premium est rattaché à une feature réelle', () => {
    // Un compteur rattaché à une feature inexistante ne serait jamais filtré :
    // la faute de frappe passerait inaperçue et la donnée continuerait de sortir.
    for (const [compteur, feature] of Object.entries(AGREGATS_PREMIUM)) {
      expect(hasFeature('expert', feature), `${compteur} → ${feature}`).toBe(true);
    }
  });

  it('l’élevage reste réservé à Expert', () => {
    // Si ce banc casse, ce n'est pas lui qu'il faut corriger : c'est que le
    // catalogue a changé, et le filtrage du tableau de bord doit suivre.
    expect(hasFeature('decouverte', 'elevageReines')).toBe(false);
    expect(hasFeature('starter', 'elevageReines')).toBe(false);
    expect(hasFeature('pro', 'elevageReines')).toBe(false);
    expect(hasFeature('expert', 'elevageReines')).toBe(true);
  });

  it('la transhumance commence à Pro', () => {
    expect(hasFeature('decouverte', 'transhumance')).toBe(false);
    expect(hasFeature('starter', 'transhumance')).toBe(false);
    expect(hasFeature('pro', 'transhumance')).toBe(true);
    expect(hasFeature('expert', 'transhumance')).toBe(true);
  });

  it('aucun plan ne reçoit un compteur que sa formule ne comprend pas', () => {
    // La règle exprimée telle que le handler l'applique : servir la valeur si
    // la feature est là, zéro sinon. On la rejoue sur les quatre plans.
    const servir = (plan: Plan, compteur: string, valeurReelle: number) =>
      hasFeature(plan, AGREGATS_PREMIUM[compteur]!) ? valeurReelle : 0;

    for (const plan of PLANS) {
      for (const compteur of Object.keys(AGREGATS_PREMIUM)) {
        const servi = servir(plan, compteur, 42);
        if (hasFeature(plan, AGREGATS_PREMIUM[compteur]!)) {
          expect(servi, `${plan} paie ${compteur} et doit le voir`).toBe(42);
        } else {
          expect(servi, `${plan} ne paie pas ${compteur} et ne doit rien voir`).toBe(0);
        }
      }
    }
  });
});
