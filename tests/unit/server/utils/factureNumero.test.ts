import { describe, expect, it } from 'vitest';
// Renommé `prochainNumeroFacture` : le helper générique de `numerotation.ts`
// s'appelle `prochainNumero`, et Nitro auto-importe PAR NOM — deux homonymes
// aux signatures différentes (une année ici, un préfixe là) auraient laissé le
// bundler choisir lequel gagne, sans erreur de type.
import { prochainNumeroFacture as prochainNumero } from '../../../../server/utils/factureNumero';

describe('prochainNumero — numérotation des factures', () => {
  it('démarre à 0001 quand aucun numéro émis', () => {
    expect(prochainNumero(null, 2026)).toBe('FA-2026-0001');
    expect(prochainNumero(undefined, 2026)).toBe('FA-2026-0001');
  });

  it('incrémente la séquence de l’année courante', () => {
    expect(prochainNumero('FA-2026-0007', 2026)).toBe('FA-2026-0008');
    expect(prochainNumero('FA-2026-0099', 2026)).toBe('FA-2026-0100');
  });

  it('poursuit la séquence chronologique au changement d’année (sans trou)', () => {
    // séquence continue : le dernier émis était 42 en 2025 → 43 en 2026
    expect(prochainNumero('FA-2025-0042', 2026)).toBe('FA-2026-0043');
  });

  it('lit les chiffres finaux même sur un format inattendu', () => {
    expect(prochainNumero('INV-12', 2026)).toBe('FA-2026-0013');
  });
});
