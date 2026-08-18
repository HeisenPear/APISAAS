import { describe, expect, it } from 'vitest';
import {
  clesSaisonsActives,
  construireAlertesSaison,
} from '../../../../server/utils/alertesSaison';

// Dates en UTC explicite (suffixe Z) : les bornes du calendrier apicole se
// lisent en heure de PARIS, et un littéral sans Z serait interprété dans le
// fuseau de la machine — le test ne validerait alors plus rien du fuseau.

describe('alertesSaison — nudges du calendrier apicole', () => {
  it('1er avril → visite de printemps active (pas encore la pose des hausses)', () => {
    const cles = clesSaisonsActives(new Date('2026-04-01T10:00:00Z'));
    expect(cles).toContain('visite-printemps-2026');
    expect(cles).not.toContain('pose-hausses-2026');
  });

  it('10 août → traitement varroa actif', () => {
    expect(clesSaisonsActives(new Date('2026-08-10T10:00:00Z'))).toContain(
      'traitement-varroa-2026',
    );
  });

  it('fenêtre d’hiver à cheval sur l’année : décembre et janvier = même campagne', () => {
    expect(clesSaisonsActives(new Date('2026-12-15T10:00:00Z'))).toContain('suivi-hiver-2026');
    // En janvier 2026 on est sur la campagne démarrée en décembre 2025.
    expect(clesSaisonsActives(new Date('2026-01-10T10:00:00Z'))).toContain('suivi-hiver-2025');
  });

  it('hors de toute fenêtre → aucune saison (ex. 25 juillet)', () => {
    expect(clesSaisonsActives(new Date('2026-07-25T10:00:00Z'))).toHaveLength(0);
  });

  it('construit une alerte rappel_saison par fenêtre active non déjà émise', () => {
    const out = construireAlertesSaison('u1', new Date('2026-08-10T10:00:00Z'), () => false);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      userId: 'u1',
      type: 'rappel_saison',
      referenceId: 'traitement-varroa-2026',
      priorite: 'haute',
    });
  });

  it('ne re-crée pas une alerte déjà existante (dédup)', () => {
    const out = construireAlertesSaison('u1', new Date('2026-08-10T10:00:00Z'), (type, ref) => {
      return type === 'rappel_saison' && ref === 'traitement-varroa-2026';
    });
    expect(out).toHaveLength(0);
  });
});

// Les quatre cas ci-dessous encadrent des bornes à MINUIT heure de Paris : ce
// sont ceux qui échouaient quand `dansFenetre` lisait le mois et le jour sur
// l'horloge du serveur (UTC sur Vercel).
describe('alertesSaison — les bornes sont des dates de Paris, pas du serveur', () => {
  it('la fenêtre s’ouvre à minuit heure de Paris', () => {
    // 23 h 30 UTC le 28 février = 1er mars 00 h 30 à Paris.
    expect(clesSaisonsActives(new Date('2026-02-28T23:30:00Z'))).toContain('visite-printemps-2026');
  });

  it('la fenêtre se ferme à minuit heure de Paris', () => {
    // 22 h 30 UTC le 20 avril = 21 avril 00 h 30 à Paris : la fenêtre
    // « visite de printemps » (1er mars → 20 avril inclus) est terminée.
    expect(clesSaisonsActives(new Date('2026-04-20T22:30:00Z'))).not.toContain(
      'visite-printemps-2026',
    );
  });

  it('la fenêtre d’hiver s’ouvre à minuit heure de Paris', () => {
    // 23 h 30 UTC le 30 novembre = 1er décembre 00 h 30 à Paris.
    expect(clesSaisonsActives(new Date('2026-11-30T23:30:00Z'))).toContain('suivi-hiver-2026');
  });

  it('la fenêtre d’hiver se ferme à minuit heure de Paris', () => {
    // 23 h 30 UTC le 31 janvier = 1er février 00 h 30 à Paris.
    const cles = clesSaisonsActives(new Date('2026-01-31T23:30:00Z'));
    expect(cles.some((c) => c.startsWith('suivi-hiver'))).toBe(false);
  });
});
