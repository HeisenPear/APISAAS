import { describe, it, expect } from 'vitest';
import {
  arrondi2,
  calculerDerives,
  versDecimal,
  versNombre,
} from '~~/server/utils/balances/enregistrer';
import {
  parserCsvBalance,
  decouperCsv,
  detecterSeparateur,
  retirerBom,
} from '~~/server/utils/balances/csv';
import {
  debutSaison,
  HISTORIQUE_JOURS_PAR_PLAN,
  resoudreFenetre,
} from '~~/server/utils/balances/periodes';

// ─── Tare & variations ──────────────────────────────────────────────────────

describe('versNombre / versDecimal', () => {
  it('convertit les colonnes decimal (qui arrivent en STRING) et inversement', () => {
    expect(versNombre('42.30')).toBe(42.3);
    expect(versNombre(null)).toBeNull();
    expect(versNombre('n/a')).toBeNull();
    expect(versDecimal(42.298)).toBe('42.30');
    expect(versDecimal(null)).toBeNull();
  });
  it('arrondit à 2 décimales', () => {
    expect(arrondi2(1.006)).toBe(1.01);
    expect(arrondi2(52.399_999)).toBe(52.4);
    expect(arrondi2(-2.344)).toBe(-2.34);
  });
});

describe('calculerDerives', () => {
  it('retranche la tare pour obtenir le poids net', () => {
    const d = calculerDerives({ poidsKg: 52.4, poidsTare: '12.40' });
    expect(d.poidsNetKg).toBe(40);
  });

  it('sans tare, net = brut', () => {
    expect(calculerDerives({ poidsKg: 52.4, poidsTare: null }).poidsNetKg).toBe(52.4);
  });

  it('calcule variation et variation 24 h sur le poids BRUT', () => {
    const d = calculerDerives({
      poidsKg: 52.4,
      poidsTare: 12.4,
      poidsPrecedentKg: 52.9,
      poids24hKg: 50.1,
    });
    expect(d.variationKg).toBe(-0.5);
    expect(d.variation24hKg).toBe(2.3);
  });

  it('laisse les variations à null quand la référence manque', () => {
    const d = calculerDerives({ poidsKg: 52.4, poidsTare: 0 });
    expect(d.variationKg).toBeNull();
    expect(d.variation24hKg).toBeNull();
  });

  it('laisse tout à null quand le poids est absent (mesure météo seule)', () => {
    const d = calculerDerives({ poidsKg: null, poidsTare: 12, poidsPrecedentKg: 40 });
    expect(d.poidsNetKg).toBeNull();
    expect(d.variationKg).toBeNull();
  });
});

// ─── Parseur CSV ────────────────────────────────────────────────────────────

describe('detecterSeparateur / decouperCsv / retirerBom', () => {
  it('détecte ; , et tabulation', () => {
    expect(detecterSeparateur('Date;Poids;Temp')).toBe(';');
    expect(detecterSeparateur('Date,Poids,Temp')).toBe(',');
    expect(detecterSeparateur('Date\tPoids\tTemp')).toBe('\t');
  });
  it('ignore les séparateurs à l’intérieur des guillemets', () => {
    expect(detecterSeparateur('"Poids, net";Date')).toBe(';');
  });
  it('gère guillemets échappés et sauts de ligne internes', () => {
    const lignes = decouperCsv('a;"b;c";"d""e"\r\n1;"deux\nlignes";3', ';');
    expect(lignes[0]).toEqual(['a', 'b;c', 'd"e']);
    expect(lignes[1]).toEqual(['1', 'deux\nlignes', '3']);
  });
  it('retire le BOM UTF-8 posé par Excel', () => {
    expect(retirerBom('﻿Date;Poids')).toBe('Date;Poids');
  });
});

describe('parserCsvBalance', () => {
  it('parse un export FR (séparateur ;, dates JJ/MM/AAAA, décimales à la virgule)', () => {
    const csv = [
      '﻿Date;Poids (kg);Température (°C);Humidité (%);Batterie (%)',
      '03/06/2026 08:00;52,40;14,2;71;96',
      '03/06/2026 12:00;53,10;24,8;48;96',
      '',
    ].join('\r\n');

    const r = parserCsvBalance(csv);
    expect(r.separateur).toBe(';');
    expect(r.mesures).toHaveLength(2);
    expect(r.colonnes.poidsKg).toBe('Poids (kg)');
    expect(r.colonnes.horodatage).toBe('Date');
    expect(r.mesures[0]!.poidsKg).toBe(52.4);
    expect(r.mesures[0]!.temperatureC).toBe(14.2);
    expect(r.mesures[0]!.batteriePct).toBe(96);
    // 08:00 Paris (UTC+2 en juin) → 06:00 UTC
    expect(r.mesures[0]!.mesureeAt.toISOString()).toBe('2026-06-03T06:00:00.000Z');
  });

  it('parse un export ISO (séparateur ,) et le poids en grammes', () => {
    const csv = ['timestamp,weight_g,temp', '2026-06-03T06:00:00Z,52400,14.2'].join('\n');
    const r = parserCsvBalance(csv);
    expect(r.separateur).toBe(',');
    expect(r.mesures[0]!.poidsKg).toBe(52.4);
    expect(r.mesures[0]!.mesureeAt.toISOString()).toBe('2026-06-03T06:00:00.000Z');
  });

  it('recolle des colonnes Date et Heure séparées', () => {
    const csv = ['Date;Heure;Poids', '03/06/2026;08:00;52,4'].join('\n');
    const r = parserCsvBalance(csv);
    expect(r.mesures).toHaveLength(1);
    expect(r.mesures[0]!.mesureeAt.toISOString()).toBe('2026-06-03T06:00:00.000Z');
  });

  it('compte les lignes inexploitables sans planter', () => {
    const csv = [
      'Date;Poids',
      '03/06/2026 08:00;52,4',
      'pas une date;51,0', // horodatage illisible → rejet
      '04/06/2026 08:00;', // aucune valeur → rejet
    ].join('\n');
    const r = parserCsvBalance(csv);
    expect(r.mesures).toHaveLength(1);
    expect(r.ignorees).toBe(2);
    expect(r.lignesLues).toBe(3);
  });

  it('conserve la ligne d’origine dans raw', () => {
    const r = parserCsvBalance('Date;Poids;Note\n03/06/2026;52,4;RAS');
    expect(r.mesures[0]!.raw).toEqual({ Date: '03/06/2026', Poids: '52,4', Note: 'RAS' });
  });

  it('renvoie un résultat vide sur un contenu sans en-tête exploitable', () => {
    expect(parserCsvBalance('').mesures).toHaveLength(0);
  });
});

// ─── Fenêtres & échantillonnage ─────────────────────────────────────────────

describe('resoudreFenetre', () => {
  const maintenant = new Date('2026-06-15T12:00:00.000Z');

  it('choisit un bucket adapté à la période', () => {
    expect(resoudreFenetre('24h', 'pro', maintenant).bucketSecondes).toBe(900);
    expect(resoudreFenetre('7j', 'pro', maintenant).bucketSecondes).toBe(3600);
    expect(resoudreFenetre('30j', 'pro', maintenant).bucketSecondes).toBe(10_800);
    expect(resoudreFenetre('saison', 'pro', maintenant).bucketSecondes).toBe(86_400);
  });

  it('Pro voit toute la saison sans troncature', () => {
    const f = resoudreFenetre('saison', 'pro', maintenant);
    expect(f.depuis.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(f.tronquee).toBe(false);
  });

  it('Starter est plafonné à 90 jours consultables — la donnée n’est pas supprimée', () => {
    const f = resoudreFenetre('saison', 'starter', maintenant);
    expect(f.tronquee).toBe(true);
    expect(f.joursMaxPlan).toBe(HISTORIQUE_JOURS_PAR_PLAN.starter);
    const jours = (maintenant.getTime() - f.depuis.getTime()) / 86_400_000;
    expect(Math.round(jours)).toBe(90);
  });

  it('Starter n’est pas tronqué sur une période courte', () => {
    expect(resoudreFenetre('7j', 'starter', maintenant).tronquee).toBe(false);
  });

  it('Découverte n’a aucune fenêtre consultable', () => {
    const f = resoudreFenetre('7j', 'decouverte', maintenant);
    expect(f.tronquee).toBe(true);
    expect(f.depuis.getTime()).toBe(maintenant.getTime());
  });

  it('la saison démarre au 1er mars (celle de l’an passé avant mars)', () => {
    expect(debutSaison(new Date('2026-01-10T00:00:00Z')).toISOString()).toBe(
      '2025-03-01T00:00:00.000Z',
    );
    expect(debutSaison(new Date('2026-08-10T00:00:00Z')).toISOString()).toBe(
      '2026-03-01T00:00:00.000Z',
    );
  });
});
