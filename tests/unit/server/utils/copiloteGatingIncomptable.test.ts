import { describe, it, expect, vi } from 'vitest';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/**
 * QUE FAIT LA PORTE QUAND ELLE NE SAIT PAS MESURER ?
 *
 * C'est la question qui a produit le défaut. L'ancienne réponse était « elle
 * laisse passer » — écrite en une ligne discrète :
 *
 *     if (actuel === null || actuel < max) return null;
 *
 * La nouvelle est « elle refuse ». Mais cette branche est, par construction,
 * INATTEIGNABLE dans le produit : `tests/unit/server/compteursDePlan.test.ts`
 * exige que toute limite déclarée par une porte soit comptable. Une garde
 * qu'aucun test ne traverse est une garde dont on ne sait rien — c'est
 * exactement le statut qu'avait le trou d'origine.
 *
 * On force donc le cas en faisant mentir le compteur, et on regarde la
 * décision. Ce banc vit dans son propre fichier parce que le `vi.mock` est à
 * l'échelle du module : le mélanger aux cas normaux les priverait du vrai
 * compteur.
 */
vi.mock('~~/server/utils/compteursDePlan', () => ({
  compterRessource: async () => null,
}));

const { refusDePlan } = await import('~~/server/utils/copilote-gating');

const EXEC = {} as DrizzleTransaction;

describe('refusDePlan — quand le plafond est invérifiable', () => {
  it('refuse au lieu de laisser passer', async () => {
    const refus = await refusDePlan(EXEC, 'u1', 'client', 'starter');
    expect(refus, 'un plafond qu’on ne sait pas mesurer doit arrêter l’écriture').toBeTruthy();
  });

  it('dit que rien n’a été enregistré', async () => {
    // Le pire refus est celui qui laisse un doute sur l'état des données.
    const refus = await refusDePlan(EXEC, 'u1', 'client', 'starter');
    expect(refus).toMatch(/ne rien enregistrer|rien n’a été/i);
  });

  it('garde une porte de sortie, comme tous les autres refus', async () => {
    const refus = await refusDePlan(EXEC, 'u1', 'client', 'starter');
    expect(refus, 'ne jamais bloquer sans dire quoi faire').toMatch(/page concernée|Réessaie/i);
  });
});
