import { describe, expect, it } from 'vitest';
import { genererNumerosRuches, BULK_RUCHES_MAX } from '../../../../app/utils/bulkRuches';

describe('genererNumerosRuches — création en masse', () => {
  it('génère une plage continue avec préfixe', () => {
    expect(genererNumerosRuches('R', 1, 3)).toEqual(['R1', 'R2', 'R3']);
  });

  it('conserve le préfixe tel quel (espace inclus)', () => {
    expect(genererNumerosRuches('Ruche ', 10, 2)).toEqual(['Ruche 10', 'Ruche 11']);
  });

  it('préfixe vide → numéros nus', () => {
    expect(genererNumerosRuches('', 1, 4)).toEqual(['1', '2', '3', '4']);
  });

  it('respecte le numéro de départ', () => {
    expect(genererNumerosRuches('R-', 101, 3)).toEqual(['R-101', 'R-102', 'R-103']);
  });

  it('gère une grosse exploitation (1100 ruches)', () => {
    const out = genererNumerosRuches('', 1, 1100);
    expect(out).toHaveLength(1100);
    expect(out[0]).toBe('1');
    expect(out[1099]).toBe('1100');
  });

  it('borne la quantité (min 1, max 2000) et le départ (≥ 0)', () => {
    expect(genererNumerosRuches('R', 1, 0)).toEqual(['R1']); // min 1
    expect(genererNumerosRuches('R', 1, 99999)).toHaveLength(BULK_RUCHES_MAX);
    expect(genererNumerosRuches('R', -5, 1)).toEqual(['R0']); // départ ≥ 0
  });
});
