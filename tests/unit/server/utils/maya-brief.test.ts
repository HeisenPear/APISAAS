import { describe, expect, it } from 'vitest';
import { composerBrief } from '../../../../server/utils/maya-brief';
import type { RucheSante, MeteoResultat } from '../../../../server/utils/copilote-data';

const meteoVide = { erreur: 'aucun_rucher' };

function ruche(over: Partial<RucheSante>): RucheSante {
  return {
    numero: '1',
    rucher: 'Rucher',
    statut: 'active',
    scoreSante: 80,
    derniereVisite: '2026-06-10',
    joursDepuisVisite: 2,
    varroa: null,
    maladieObservee: null,
    ...over,
  };
}

describe('composerBrief — point du jour de Maya', () => {
  it('salue par le prénom selon le moment et reste calme quand tout va bien', () => {
    const b = composerBrief({
      prenom: 'Antoine',
      heure: 9,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: meteoVide,
      mois: 4,
    });
    expect(b.salutation).toContain('Bonjour Antoine');
    expect(b.intro.toLowerCase()).toContain('calme');
    expect(b.items).toHaveLength(1);
    expect(b.items[0]?.icone).toBe('📅');
  });

  it('adapte la salutation au soir', () => {
    const b = composerBrief({
      prenom: 'Marie',
      heure: 20,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: meteoVide,
      mois: 2,
    });
    expect(b.salutation).toContain('Bonsoir Marie');
  });

  it('priorise météo, visites, santé, alertes et stocks', () => {
    const meteo: MeteoResultat = {
      rucher: 'Rucher',
      previsions: [
        {
          date: '2026-06-12',
          conditions: 'Ensoleillé',
          tempMax: 22,
          tempMin: 12,
          pluieMm: 0,
          ventMaxKmh: 8,
          scoreVisite: 85,
        },
      ],
    };
    const b = composerBrief({
      prenom: 'Antoine',
      heure: 8,
      ruches: [
        ruche({ numero: '1', scoreSante: 30, joursDepuisVisite: 40, derniereVisite: '2026-01-01' }),
        ruche({ numero: '2' }),
      ],
      alertes: [{ type: 'sante', titre: 'Varroa', message: null, priorite: 'critique' }],
      stocks: [
        {
          nom: 'Cadres',
          categorie: 'materiel',
          quantite: '2',
          unite: 'u',
          seuilAlerte: '10',
          sousLeSeuil: true,
        },
      ],
      meteo,
      mois: 5,
    });
    const icones = b.items.map((i) => i.icone);
    expect(icones[0]).toBe('🌤️'); // météo en tête
    expect(icones).toContain('🐝'); // ruche en retard (40 j)
    expect(icones).toContain('⚠️'); // colonie critique (score 30)
    expect(icones).toContain('🔔'); // alerte prioritaire
    expect(icones).toContain('📦'); // stock bas
    expect(b.intro).toContain('remarqué');
  });
});
