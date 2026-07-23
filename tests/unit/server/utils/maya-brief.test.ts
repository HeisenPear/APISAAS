import { describe, expect, it } from 'vitest';
import { composerBrief } from '../../../../server/utils/maya-brief';
import { VOIX } from '../../../../server/utils/maya-voix';
import type { RucheSante, MeteoResultat } from '../../../../server/utils/copilote-data';

const meteoVide = { erreur: 'aucun_rucher' };

const meteoFav: MeteoResultat = {
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
  it('salue par le prénom et ouvre sur une veille « rien d’anormal » quand tout va bien', () => {
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
    // L'intro est désormais une « veille nocturne » : opener + verdict RAS.
    expect(VOIX.veilleNuit.some((o) => b.intro.startsWith(o))).toBe(true);
    expect(VOIX.veilleRAS.some((r) => b.intro.includes(r))).toBe(true);
    expect(b.items).toHaveLength(1);
    // Dernier item = note de saison (sans emoji : Maya ne « parle » plus en emojis).
    expect(b.items[0]?.icone).toBe('');
    expect(b.items[0]?.texte).toContain('saison');
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
    const routes = b.items.map((i) => i.to);
    expect(routes[0]).toBe('/meteo'); // météo en tête
    expect(routes).toContain('/ruches'); // visites en retard + colonies fragiles
    expect(routes).toContain('/alertes'); // alerte prioritaire
    expect(routes).toContain('/stocks'); // stock bas
    expect(VOIX.veilleNuit.some((o) => b.intro.startsWith(o))).toBe(true);
  });

  it('signale les nouvelles alertes de la nuit (delta depuis hier)', () => {
    const maintenant = Date.parse('2026-06-12T08:00:00Z');
    const b = composerBrief({
      prenom: 'Antoine',
      heure: 8,
      ruches: [],
      stocks: [],
      alertes: [
        // créée il y a 3 h → comptée dans la veille
        {
          type: 'sante',
          titre: 'Varroa',
          message: null,
          priorite: 'haute',
          createdAt: '2026-06-12T05:00:00Z',
        },
        // créée il y a 5 jours → hors fenêtre
        {
          type: 'stock',
          titre: 'Vieux',
          message: null,
          priorite: 'basse',
          createdAt: '2026-06-07T08:00:00Z',
        },
      ],
      meteo: meteoVide,
      mois: 5,
      maintenant,
    });
    expect(b.intro).toContain('1 nouvelle alerte depuis hier');
  });

  it('signale une gelée nocturne depuis la météo', () => {
    const meteoGel: MeteoResultat = {
      rucher: 'Rucher',
      previsions: [
        {
          date: '2026-02-01',
          conditions: 'Ciel dégagé',
          tempMax: 6,
          tempMin: -3,
          pluieMm: 0,
          ventMaxKmh: 10,
          scoreVisite: 20,
        },
      ],
    };
    const b = composerBrief({
      heure: 7,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: meteoGel,
      mois: 1,
    });
    expect(b.intro.toLowerCase()).toContain('gelée nocturne');
    expect(b.intro).toContain('-3');
  });

  it('mode contexte « ruches » ne garde que les items liés aux ruches', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [ruche({ scoreSante: 30, joursDepuisVisite: 40, derniereVisite: '2026-01-01' })],
      alertes: [{ type: 'x', titre: 't', message: null, priorite: 'critique' }],
      stocks: [],
      meteo: meteoFav,
      mois: 5,
      contexte: 'ruches',
    });
    expect(b.salutation).toBe('');
    expect(b.items.every((i) => i.to === '/ruches')).toBe(true);
    expect(b.items.length).toBeGreaterThan(0);
  });

  it('mode contexte « meteo » ne garde que la fenêtre météo', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: meteoFav,
      mois: 5,
      contexte: 'meteo',
    });
    expect(b.items).toHaveLength(1);
    expect(b.items[0]?.to).toBe('/meteo');
  });

  it('au singulier, l’espace n’est jamais mangée (« 1 produit passe », pas « produitpasse »)', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [ruche({ scoreSante: 30, joursDepuisVisite: 2, derniereVisite: '2026-06-10' })],
      alertes: [],
      stocks: [{ nom: 'Sucre', quantite: 1, seuilAlerte: 5, sousLeSeuil: true }],
      meteo: meteoVide,
      mois: 5,
    });
    const textes = b.items.map((i) => i.texte).join(' | ');
    // Aucun mot collé à sa suite : un chiffre suivi d'un mot puis d'un mot recollé.
    expect(textes).toContain('1 produit passe');
    expect(textes).toContain('1 colonie me semble fragile');
    expect(textes).not.toMatch(/produitpasse|colonieme/);
  });

  it('mode contexte « alertes » ne garde que les alertes prioritaires', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [ruche({ scoreSante: 30, joursDepuisVisite: 40, derniereVisite: '2026-01-01' })],
      alertes: [{ type: 'x', titre: 't', message: null, priorite: 'critique' }],
      stocks: [{ nom: 'Sucre', quantite: 1, seuilAlerte: 5, sousLeSeuil: true }],
      meteo: meteoFav,
      mois: 5,
      contexte: 'alertes',
    });
    expect(b.items.length).toBeGreaterThan(0);
    expect(b.items.every((i) => i.to === '/alertes')).toBe(true);
  });

  it('mode contexte « stocks » ne garde que les réappros', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [],
      alertes: [{ type: 'x', titre: 't', message: null, priorite: 'critique' }],
      stocks: [{ nom: 'Sucre', quantite: 1, seuilAlerte: 5, sousLeSeuil: true }],
      meteo: meteoVide,
      mois: 5,
      contexte: 'stocks',
    });
    expect(b.items).toHaveLength(1);
    expect(b.items[0]?.to).toBe('/stocks');
  });

  it('mode contexte « calendrier » agrège les échéances : ruches ET météo', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [ruche({ scoreSante: 80, joursDepuisVisite: 40, derniereVisite: '2026-01-01' })],
      alertes: [{ type: 'x', titre: 't', message: null, priorite: 'critique' }],
      stocks: [{ nom: 'Sucre', quantite: 1, seuilAlerte: 5, sousLeSeuil: true }],
      meteo: meteoFav,
      mois: 5,
      contexte: 'calendrier',
    });
    const routes = new Set(b.items.map((i) => i.to));
    expect(routes).toEqual(new Set(['/ruches', '/meteo']));
    // Ni les alertes ni les stocks n'ont d'échéance datée : ils sont écartés.
    expect(b.items.some((i) => i.to === '/alertes' || i.to === '/stocks')).toBe(false);
  });

  it('contexte sans item pertinent : intro « rien à signaler », zéro item', () => {
    const b = composerBrief({
      heure: 10,
      ruches: [],
      alertes: [],
      stocks: [],
      meteo: meteoVide,
      mois: 5,
      contexte: 'stocks',
    });
    expect(b.items).toHaveLength(0);
    expect(VOIX.contexteCalme).toContain(b.intro);
  });
});
