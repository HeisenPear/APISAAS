import { describe, it, expect } from 'vitest';
import {
  aplatir,
  champPourCle,
  normaliserCle,
  normaliserLot,
  normaliserPayload,
  parseHorodatage,
  parseNombre,
  SEUIL_GRAMMES,
} from '~~/server/utils/balances/normaliser';

const MAINTENANT = new Date('2026-06-15T12:00:00.000Z');
const opts = { maintenant: MAINTENANT };

describe('normaliserCle', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(normaliserCle('Température ext. (°C)')).toBe('temperatureextc');
    expect(normaliserCle('weight_kg')).toBe('weightkg');
    expect(normaliserCle('  Poids (kg) ')).toBe('poidskg');
  });
});

describe('champPourCle', () => {
  it('reconnaît les alias courants', () => {
    expect(champPourCle('weight')).toBe('poidsKg');
    expect(champPourCle('kg')).toBe('poidsKg');
    expect(champPourCle('rh')).toBe('humidite');
    expect(champPourCle('rssi')).toBe('signalDbm');
    expect(champPourCle('soc')).toBe('batteriePct');
  });
  it('sépare interne et externe (convention BEEP)', () => {
    expect(champPourCle('t')).toBe('temperatureC');
    expect(champPourCle('ti')).toBe('temperatureIntC');
    expect(champPourCle('h')).toBe('humidite');
    expect(champPourCle('hi')).toBe('humiditeIntPct');
  });
  it('tolère l’unité collée à l’en-tête d’un CSV', () => {
    // « Température ext. (°C) » → temperatureextc
    expect(champPourCle('temperatureextc')).toBe('temperatureC');
    expect(champPourCle('temperatureinterieurec')).toBe('temperatureIntC');
    expect(champPourCle('pressionhpa')).toBe('pressionHpa');
    // « Batterie (V) » est une tension, pas un pourcentage.
    expect(champPourCle('batteriev')).toBe('tensionV');
  });
  it('renvoie null pour une clé inconnue', () => {
    expect(champPourCle('devaddr')).toBeNull();
    expect(champPourCle('reading')).toBeNull();
    expect(champPourCle('flag')).toBeNull();
  });
});

describe('parseNombre', () => {
  it('accepte nombres, décimales FR et unités collées', () => {
    expect(parseNombre(42.5)).toBe(42.5);
    expect(parseNombre('42,5')).toBe(42.5);
    expect(parseNombre('-3.2°C')).toBe(-3.2);
    expect(parseNombre('55 %')).toBe(55);
  });
  it('rejette le non-numérique', () => {
    expect(parseNombre('abc')).toBeNull();
    expect(parseNombre('')).toBeNull();
    expect(parseNombre(null)).toBeNull();
    expect(parseNombre(true)).toBeNull();
  });
});

describe('parseHorodatage', () => {
  it('lit un epoch en secondes et en millisecondes', () => {
    expect(parseHorodatage(1_770_000_000, MAINTENANT)?.toISOString()).toBe(
      new Date(1_770_000_000_000).toISOString(),
    );
    expect(parseHorodatage(1_770_000_000_000, MAINTENANT)?.toISOString()).toBe(
      new Date(1_770_000_000_000).toISOString(),
    );
  });
  it('lit une date ISO avec fuseau explicite', () => {
    expect(parseHorodatage('2026-06-15T08:30:00Z', MAINTENANT)?.toISOString()).toBe(
      '2026-06-15T08:30:00.000Z',
    );
  });
  it('interprète une date FR JJ/MM/AAAA en heure de Paris', () => {
    // 3 juin 2026 08:15 Paris (heure d'été, UTC+2) → 06:15 UTC
    expect(parseHorodatage('03/06/2026 08:15', MAINTENANT)?.toISOString()).toBe(
      '2026-06-03T06:15:00.000Z',
    );
  });
  it('interprète un ISO SANS fuseau en heure de Paris, ou en UTC si demandé', () => {
    expect(parseHorodatage('2026-06-03 08:15:00', MAINTENANT)?.toISOString()).toBe(
      '2026-06-03T06:15:00.000Z',
    );
    expect(parseHorodatage('2026-06-03 08:15:00', MAINTENANT, true)?.toISOString()).toBe(
      '2026-06-03T08:15:00.000Z',
    );
  });
  it('rejette une date illisible, aberrante ou trop dans le futur', () => {
    expect(parseHorodatage('pas une date', MAINTENANT)).toBeNull();
    expect(parseHorodatage('45/13/2026', MAINTENANT)).toBeNull();
    expect(parseHorodatage(0, MAINTENANT)).toBeNull(); // epoch 0 → 1970
    expect(parseHorodatage('2026-06-17T12:00:01Z', MAINTENANT)).toBeNull(); // > +24 h
  });
  it('accepte un horodatage à moins de 24 h dans le futur (dérive d’horloge tolérée)', () => {
    expect(parseHorodatage('2026-06-16T09:00:00Z', MAINTENANT)).not.toBeNull();
  });
});

describe('aplatir', () => {
  it('privilégie la clé de surface et suit le 1er élément des tableaux', () => {
    const plat = aplatir({ t: 1, bloc: { t: 99, h: 55 }, liste: [{ rssi: -80 }, { rssi: -10 }] });
    expect(plat.get('t')).toBe(1);
    expect(plat.get('h')).toBe(55);
    expect(plat.get('rssi')).toBe(-80);
  });
});

describe('normaliserPayload — webhook générique', () => {
  it('mappe les alias courants et conserve le brut', () => {
    const brut = { weight: 42.3, temp: 21.5, humidity: 62, battery: 87, ts: 1_770_000_000 };
    const m = normaliserPayload(brut, opts)!;
    expect(m.poidsKg).toBe(42.3);
    expect(m.temperatureC).toBe(21.5);
    expect(m.humidite).toBe(62);
    expect(m.batteriePct).toBe(87);
    expect(m.raw).toBe(brut);
  });

  it('date à maintenant quand l’horodatage est absent', () => {
    const m = normaliserPayload({ poids: 40 }, opts)!;
    expect(m.mesureeAt.toISOString()).toBe(MAINTENANT.toISOString());
  });

  it('REJETTE le payload si l’horodatage présent est invalide ou futur', () => {
    expect(normaliserPayload({ weight: 40, ts: 'hier' }, opts)).toBeNull();
    expect(normaliserPayload({ weight: 40, ts: '2027-01-01T00:00:00Z' }, opts)).toBeNull();
  });

  it('REJETTE un payload sans aucune valeur exploitable', () => {
    expect(normaliserPayload({ statut: 'ok', nom: 'ruche 3' }, opts)).toBeNull();
    expect(normaliserPayload('coucou', opts)).toBeNull();
    expect(normaliserPayload(null, opts)).toBeNull();
  });

  it('convertit les grammes en kilos au-delà du seuil', () => {
    expect(normaliserPayload({ weight: 42_300 }, opts)!.poidsKg).toBe(42.3);
    expect(normaliserPayload({ weight_g: 38_500 }, opts)!.poidsKg).toBe(38.5);
    // Juste sous le seuil : on ne touche à rien.
    expect(normaliserPayload({ weight: SEUIL_GRAMMES - 1 }, opts)!.poidsKg).toBe(999);
  });

  it('range vbat / bv en TENSION, jamais en pourcentage de batterie', () => {
    const m = normaliserPayload({ weight: 40, vbat: 3.92 }, opts)!;
    expect(m.tensionV).toBe(3.92);
    expect(m.batteriePct).toBeNull();
  });

  it('ignore les valeurs hors plage plausible', () => {
    const m = normaliserPayload({ weight: 40, temp: -127, humidity: 6553, battery: 250 }, opts)!;
    expect(m.temperatureC).toBeNull();
    expect(m.humidite).toBeNull();
    expect(m.batteriePct).toBeNull();
    expect(m.poidsKg).toBe(40);
  });
});

describe('normaliserPayload — uplink TTN / LoRaWAN', () => {
  const uplink = {
    end_device_ids: { device_id: 'balance-rucher-nord', dev_eui: '70B3D5' },
    received_at: '2026-06-15T09:30:00.000Z',
    uplink_message: {
      f_port: 2,
      decoded_payload: { weight: 46.8, tempC: 19.4, hum: 58, batt: 74 },
      rx_metadata: [{ rssi: -103, snr: 7.2 }],
      settings: { frequency: '868300000', data_rate: { lora: { spreading_factor: 7 } } },
    },
  };

  it('lit decoded_payload, le device_id et le RSSI', () => {
    const m = normaliserPayload(uplink, opts)!;
    expect(m.poidsKg).toBe(46.8);
    expect(m.temperatureC).toBe(19.4);
    expect(m.humidite).toBe(58);
    expect(m.batteriePct).toBe(74);
    expect(m.signalDbm).toBe(-103);
    expect(m.identifiantExterne).toBe('balance-rucher-nord');
    expect(m.mesureeAt.toISOString()).toBe('2026-06-15T09:30:00.000Z');
  });

  it('ne confond JAMAIS la porteuse radio 868 MHz avec une fréquence sonore', () => {
    expect(normaliserPayload(uplink, opts)!.frequenceHz).toBeNull();
  });
});

describe('normaliserPayload — BEEP', () => {
  it('lit les clés courtes de BEEP (t / t_i / h / weight_kg / bv)', () => {
    const m = normaliserPayload(
      {
        key: 'ABCD1234',
        time: '2026-06-15 08:00:00',
        weight_kg: 51.25,
        t: 18.9,
        t_i: 34.2,
        h: 61,
        h_i: 52,
        bv: 4.05,
        rssi: -87,
      },
      { ...opts, naifEnUtc: true },
    )!;
    expect(m.poidsKg).toBe(51.25);
    expect(m.temperatureC).toBe(18.9);
    expect(m.temperatureIntC).toBe(34.2);
    expect(m.humidite).toBe(61);
    expect(m.humiditeIntPct).toBe(52);
    expect(m.tensionV).toBe(4.05);
    expect(m.signalDbm).toBe(-87);
    expect(m.identifiantExterne).toBe('ABCD1234');
    expect(m.mesureeAt.toISOString()).toBe('2026-06-15T08:00:00.000Z');
  });
});

describe('normaliserLot', () => {
  it('accepte un objet seul comme un tableau et compte les rejets', () => {
    const r = normaliserLot([{ weight: 40 }, { rien: 1 }, { weight: 41, ts: 'bidon' }], opts);
    expect(r.mesures).toHaveLength(1);
    expect(r.rejetees).toBe(2);
    expect(normaliserLot({ weight: 40 }, opts).mesures).toHaveLength(1);
  });
});
