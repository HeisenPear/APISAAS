import { describe, expect, it } from 'vitest';
import {
  analyserParcelles,
  cultureInfo,
  type ParcelleMellifere,
} from '../../../../server/utils/mellifere';

describe('cultureInfo', () => {
  it('reconnaît les cultures mellifères majeures', () => {
    expect(cultureInfo('CZH').groupe).toBe('colza');
    expect(cultureInfo('czh').nectar).toBe(5); // insensible à la casse
    expect(cultureInfo('TRN').floraison).toEqual([7, 8]);
    expect(cultureInfo('J6M').groupe).toBe('jachere_mellifere');
  });

  it('retombe sur la famille via le préfixe pour un code inconnu', () => {
    expect(cultureInfo('PPX').groupe).toBe('prairie');
    expect(cultureInfo('J9Z').groupe).toBe('jachere');
  });

  it('retombe sur un groupe neutre pour un code totalement inconnu', () => {
    const c = cultureInfo('ZZZ');
    expect(c.groupe).toBe('autre');
    expect(c.nectar).toBe(1);
    expect(cultureInfo(null).groupe).toBe('autre');
  });
});

describe('analyserParcelles', () => {
  const colzaProche: ParcelleMellifere = { code: 'CZH', surfaceHa: 20, distanceM: 800 };
  const colzaLoin: ParcelleMellifere = { code: 'CZH', surfaceHa: 20, distanceM: 2500 };
  const ble: ParcelleMellifere = { code: 'BTH', surfaceHa: 50, distanceM: 1000 };

  it('renvoie un score nul sans parcelles', () => {
    const a = analyserParcelles([]);
    expect(a.score).toBe(0);
    expect(a.nbParcelles).toBe(0);
    expect(a.cultures).toEqual([]);
  });

  it('pondère la distance : une parcelle proche pèse plus que la même au loin', () => {
    const proche = analyserParcelles([colzaProche]);
    const loin = analyserParcelles([colzaLoin]);
    expect(proche.score).toBeGreaterThan(loin.score);
  });

  it('le blé ne fait pas un environnement mellifère', () => {
    const a = analyserParcelles([ble]);
    expect(a.score).toBeLessThan(10);
    expect(a.surfaceUtileHa).toBe(0); // nectar+pollen < 3
  });

  it('agrège les parcelles par culture et trie par poids', () => {
    const a = analyserParcelles([colzaProche, colzaLoin, ble]);
    const colza = a.cultures.find((c) => c.code === 'CZH');
    expect(colza?.surfaceHa).toBe(40);
    expect(a.cultures[0]?.code).toBe('CZH'); // devant le blé malgré moins de surface
    expect(a.surfaceTotaleHa).toBe(90);
  });

  it('le score sature vers 100 sans jamais le dépasser', () => {
    const beaucoup: ParcelleMellifere[] = Array.from({ length: 60 }, () => ({
      code: 'J6M',
      surfaceHa: 30,
      distanceM: 500,
    }));
    const a = analyserParcelles(beaucoup);
    expect(a.score).toBeGreaterThan(85);
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it('le calendrier marque la floraison du colza en avril-mai', () => {
    const a = analyserParcelles([colzaProche]);
    const avril = a.calendrier.find((m) => m.mois === 4);
    const aout = a.calendrier.find((m) => m.mois === 8);
    expect(avril?.intensite).toBe(100);
    expect(avril?.cultures).toContain("Colza d'hiver");
    expect(aout?.intensite).toBe(0);
  });
});
