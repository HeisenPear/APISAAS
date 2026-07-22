import { describe, expect, it } from 'vitest';
import {
  construireResumePush,
  estPushable,
  planifierPush,
  PUSH_GROUPE_SEUIL,
} from '../../../../server/utils/alertesPush';

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

describe('estPushable — météo dangereuse désormais poussable', () => {
  it('meteo_danger est pushable (catégorie saison active), meteo_favorable non', () => {
    expect(estPushable({}, 'meteo_danger')).toBe(true);
    expect(estPushable({}, 'meteo_favorable')).toBe(false);
  });
  it('respecte la désactivation de la catégorie saison', () => {
    expect(estPushable({ saison: false }, 'meteo_danger')).toBe(false);
  });
});

describe('planifierPush — gating par plan', () => {
  const now = new Date('2026-07-09T09:00:00Z'); // 11h Paris, hors heures calmes
  it('un Découverte ne reçoit PAS transhumance_proche, un Pro oui', () => {
    const items = [
      { type: 'transhumance_proche', titre: 'T', message: 'm', priorite: 'moyenne' as const },
    ];
    expect(planifierPush(items, {}, now, 'decouverte')).toHaveLength(0);
    expect(planifierPush(items, {}, now, 'pro').length).toBeGreaterThan(0);
  });
  it('meteo_danger passe pour tous les plans (universel)', () => {
    const items = [
      { type: 'meteo_danger', titre: 'Gel', message: 'm', priorite: 'haute' as const },
    ];
    expect(planifierPush(items, {}, now, 'decouverte').length).toBeGreaterThan(0);
    expect(planifierPush(items, {}, now, 'expert').length).toBeGreaterThan(0);
  });
});
