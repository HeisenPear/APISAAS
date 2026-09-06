import { describe, expect, it } from 'vitest';
import { evaluerQualiteMiel } from '../../../../app/utils/qualiteMiel';

// ═══════════════════════════════════════════════════════════════════════════
// Qualité du miel — on verrouille les seuils réglementaires (eau, HMF) et la
// règle « le critère le plus limitant commande ». Déterministe, testable.
// ═══════════════════════════════════════════════════════════════════════════

describe('evaluerQualiteMiel — teneur en eau', () => {
  it('17 % → excellent et conforme', () => {
    const r = evaluerQualiteMiel({ teneurEauPct: 17 });
    expect(r.note).toBe('excellent');
    expect(r.conforme).toBe(true);
  });

  it('18 % → très bon', () => {
    expect(evaluerQualiteMiel({ teneurEauPct: 18 }).note).toBe('tres_bon');
  });

  it('19,5 % → conforme (sous 20 %)', () => {
    const r = evaluerQualiteMiel({ teneurEauPct: 19.5 });
    expect(r.note).toBe('conforme');
    expect(r.conforme).toBe(true);
  });

  it('21 % → non conforme (risque fermentation)', () => {
    const r = evaluerQualiteMiel({ teneurEauPct: 21 });
    expect(r.note).toBe('non_conforme');
    expect(r.conforme).toBe(false);
    expect(r.messages.join(' ')).toMatch(/fermentation/i);
  });

  it('la callune (bruyère) tolère jusqu’à 23 %', () => {
    const standard = evaluerQualiteMiel({ teneurEauPct: 22 });
    const callune = evaluerQualiteMiel({ teneurEauPct: 22, typeMiel: 'Bruyère callune' });
    expect(standard.conforme).toBe(false);
    expect(callune.conforme).toBe(true);
  });
});

describe('evaluerQualiteMiel — HMF (le plus limitant commande)', () => {
  it('un HMF hors norme rend non conforme même avec une eau parfaite', () => {
    const r = evaluerQualiteMiel({ teneurEauPct: 16, hmfMgKg: 60 });
    expect(r.note).toBe('non_conforme');
    expect(r.conforme).toBe(false);
    expect(r.hmf?.ok).toBe(false);
  });

  it('eau parfaite + HMF frais → excellent', () => {
    const r = evaluerQualiteMiel({ teneurEauPct: 16.5, hmfMgKg: 8 });
    expect(r.note).toBe('excellent');
  });

  it('sans HMF renseigné, pas de critère HMF dans le résultat', () => {
    expect(evaluerQualiteMiel({ teneurEauPct: 17 }).hmf).toBeUndefined();
  });
});
