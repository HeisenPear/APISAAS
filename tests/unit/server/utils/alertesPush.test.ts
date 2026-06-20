import { describe, expect, it } from 'vitest';
import { construireResumePush, PUSH_GROUPE_SEUIL } from '../../../../server/utils/alertesPush';

describe('construireResumePush — push adaptatif', () => {
  it('en dessous du seuil → null (push individuels)', () => {
    const alertes = Array.from({ length: PUSH_GROUPE_SEUIL }, () => ({
      type: 'visite_requise' as const,
      priorite: 'moyenne' as const,
    }));
    expect(construireResumePush(alertes)).toBeNull();
  });

  it('au-dessus du seuil → 1 push résumé avec le total', () => {
    const alertes = Array.from({ length: 100 }, () => ({
      type: 'visite_requise',
      priorite: 'moyenne' as const,
    }));
    const r = construireResumePush(alertes);
    expect(r).not.toBeNull();
    expect(r!.title).toContain('100');
    expect(r!.body).toContain('100 à visiter');
    expect(r!.url).toBe('/alertes');
    expect(r!.tag).toBe('alertes-groupe');
  });

  it('ventile par type et prend la priorité maximale', () => {
    const alertes = [
      { type: 'visite_requise', priorite: 'moyenne' as const },
      { type: 'visite_requise', priorite: 'moyenne' as const },
      { type: 'sante_critique', priorite: 'critique' as const },
      { type: 'stock_bas', priorite: 'basse' as const },
    ];
    const r = construireResumePush(alertes);
    expect(r).not.toBeNull();
    expect(r!.priorite).toBe('critique');
    expect(r!.body).toContain('2 à visiter');
    expect(r!.body).toContain('1 en santé critique');
  });
});
