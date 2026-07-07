import { describe, expect, it } from 'vitest';
import {
  clesSaisonsActives,
  construireAlertesSaison,
} from '../../../../server/utils/alertesSaison';

describe('alertesSaison — nudges du calendrier apicole', () => {
  it('1er avril → visite de printemps active (pas encore la pose des hausses)', () => {
    const cles = clesSaisonsActives(new Date('2026-04-01T10:00:00'));
    expect(cles).toContain('visite-printemps-2026');
    expect(cles).not.toContain('pose-hausses-2026');
  });

  it('10 août → traitement varroa actif', () => {
    expect(clesSaisonsActives(new Date('2026-08-10T10:00:00'))).toContain('traitement-varroa-2026');
  });

  it('fenêtre d’hiver à cheval sur l’année : décembre et janvier = même campagne', () => {
    expect(clesSaisonsActives(new Date('2026-12-15T10:00:00'))).toContain('suivi-hiver-2026');
    // En janvier 2026 on est sur la campagne démarrée en décembre 2025.
    expect(clesSaisonsActives(new Date('2026-01-10T10:00:00'))).toContain('suivi-hiver-2025');
  });

  it('hors de toute fenêtre → aucune saison (ex. 25 juillet)', () => {
    expect(clesSaisonsActives(new Date('2026-07-25T10:00:00'))).toHaveLength(0);
  });

  it('construit une alerte rappel_saison par fenêtre active non déjà émise', () => {
    const out = construireAlertesSaison('u1', new Date('2026-08-10T10:00:00'), () => false);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      userId: 'u1',
      type: 'rappel_saison',
      referenceId: 'traitement-varroa-2026',
      priorite: 'haute',
    });
  });

  it('ne re-crée pas une alerte déjà existante (dédup)', () => {
    const out = construireAlertesSaison('u1', new Date('2026-08-10T10:00:00'), (type, ref) => {
      return type === 'rappel_saison' && ref === 'traitement-varroa-2026';
    });
    expect(out).toHaveLength(0);
  });
});
