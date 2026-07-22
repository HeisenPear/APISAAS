/**
 * Simulateur de ruche sur balance connectée.
 *
 * Produit une série physiquement PLAUSIBLE, pas des nombres au hasard : les
 * règles d'alerte ne peuvent être validées que face à une vraie dynamique de
 * colonie. Aucun matériel n'étant disponible pour tester, ce simulateur EST
 * notre balance de référence.
 *
 * Phénomènes reproduits, tous documentés en apiculture :
 *  - rythme circadien : les butineuses sortent le matin (la ruche perd du
 *    « poids vivant »), rentrent le soir chargées ;
 *  - miellée : gain net journalier, fonction de la météo ;
 *  - évaporation nocturne : le nectar (~80 % d'eau) devient du miel (~18 %),
 *    donc la ruche PERD du poids la nuit même sans activité ;
 *  - pluie : butinage nul, la colonie consomme ses réserves ;
 *  - température interne régulée à ~35 °C par la colonie, quoi qu'il fasse
 *    dehors — c'est la signature d'un couvain vivant ;
 *  - décharge de batterie, accentuée par le froid ;
 *  - essaimage : départ brutal en pleine journée ;
 *  - récolte : retrait des hausses ;
 *  - transmissions manquées, que tout capteur de terrain subit.
 *
 * Générateur pseudo-aléatoire déterministe : un test doit être reproductible.
 */

export interface PointSimule {
  ts: string;
  /** Poids brut sur la balance, tare NON déduite. */
  poidsBrut: number;
  tExt: number;
  tInt: number;
  humidite: number;
  batterie: number;
  tension: number;
  rssi: number;
  snr: number;
  meteo: 'beau' | 'mitige' | 'pluie';
  evenement: string | null;
}

export interface OptionsSimulation {
  debut: string;
  jours?: number;
  pasMinutes?: number;
  poidsInitialBrut?: number;
  tare?: number;
  /** Index du jour où un essaim part (0 = premier jour). */
  essaimageLeJour?: number | null;
  /** Masse de l'essaim (kg). Un essaim primaire pèse 1,5 à 3 kg. */
  tailleEssaimKg?: number;
  recolteLeJour?: number | null;
  /**
   * Index du jour où la ruche DISPARAÎT du plateau (vol). De nuit, comme dans la
   * réalité. La balance ne mesure plus ensuite que son propre plateau : le poids
   * net devient franchement négatif, signature que `balance_vol` doit attraper.
   */
  volLeJour?: number | null;
  tauxPerteTransmission?: number;
  graine?: number;
}

const arrondi = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function simulerRuche(o: OptionsSimulation): {
  points: PointSimule[];
  tare: number;
  meteoJour: Array<'beau' | 'mitige' | 'pluie'>;
} {
  const jours = o.jours ?? 30;
  const pasMinutes = o.pasMinutes ?? 60;
  const tare = o.tare ?? 22;
  const tauxPerte = o.tauxPerteTransmission ?? 0.04;

  let s = o.graine ?? 12345;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const bruit = (amp: number) => (rnd() - 0.5) * 2 * amp;

  const points: PointSimule[] = [];
  let poids = o.poidsInitialBrut ?? 42;
  let batterie = 100;
  let volee = false;
  const t0 = new Date(o.debut).getTime();
  const pasMs = pasMinutes * 60 * 1000;
  const pasParJour = (24 * 60) / pasMinutes;

  const meteoJour: Array<'beau' | 'mitige' | 'pluie'> = [];
  for (let j = 0; j < jours; j++) {
    const r = rnd();
    meteoJour.push(r < 0.18 ? 'pluie' : r < 0.35 ? 'mitige' : 'beau');
  }

  for (let j = 0; j < jours; j++) {
    const meteo = meteoJour[j]!;
    // Gain net du jour. Une belle journée d'acacia dépasse 4 kg ; sous la
    // pluie, la colonie puise dans ses réserves.
    const gainJour =
      meteo === 'beau'
        ? 1.8 + rnd() * 2.6
        : meteo === 'mitige'
          ? 0.3 + rnd() * 0.9
          : -0.35 - rnd() * 0.3;

    for (let p = 0; p < pasParJour; p++) {
      const ts = new Date(t0 + (j * pasParJour + p) * pasMs);
      const heure = ts.getUTCHours() + ts.getUTCMinutes() / 60;

      const activite = meteo === 'pluie' ? 0 : Math.max(0, Math.sin(((heure - 6) / 12) * Math.PI));
      const poidsVivantDehors = -1.4 * activite;
      const partJour = meteo === 'pluie' ? 0 : activite / (pasParJour * 0.28);
      const apport = gainJour > 0 ? gainJour * partJour : 0;
      const evaporation = -(0.45 / pasParJour) * (1 + (heure < 6 || heure > 21 ? 1.4 : 0));
      const consommation = gainJour < 0 ? gainJour / pasParJour : 0;

      if (!volee) {
        poids += apport + evaporation + consommation;
        if (meteo === 'pluie') poids += 0.004;
      }

      let evenement: string | null = null;
      // De nuit : personne au rucher, et la colonie est rentrée.
      if (o.volLeJour === j && Math.abs(heure - 3) < 0.5 && !volee) {
        const restant = 0.2 + rnd() * 0.4; // le plateau nu de la balance
        evenement = `vol -${arrondi(poids - restant)} kg`;
        poids = restant;
        volee = true;
      }
      if (o.essaimageLeJour === j && Math.abs(heure - 13) < 0.5) {
        const essaim = o.tailleEssaimKg ?? 1.6 + rnd() * 1.4;
        poids -= essaim;
        evenement = `essaimage -${arrondi(essaim)} kg`;
      }
      if (o.recolteLeJour === j && Math.abs(heure - 10) < 0.5) {
        const recolte = 16 + rnd() * 8;
        poids -= recolte;
        evenement = `recolte -${arrondi(recolte)} kg`;
      }

      const tExt =
        14 + 9 * Math.sin(((heure - 9) / 12) * Math.PI) + (meteo === 'pluie' ? -4 : 0) + bruit(1.2);
      const tInt = 34.6 + bruit(0.7) + (tExt > 30 ? 0.8 : 0);
      const humidite = meteo === 'pluie' ? 82 + bruit(6) : 55 + bruit(12);

      batterie -= 0.018 + (tExt < 8 ? 0.02 : 0);

      // Transmission manquée : le point existe physiquement mais n'arrive pas.
      // On ÉPARGNE les points porteurs d'un événement : un test doit rester
      // déterministe, et perdre au hasard la mesure de l'essaimage ne
      // testerait plus rien. (La perte de ce point reste un cas réel — elle
      // est couverte par les tests de tolérance aux trous, pas ici.)
      if (!evenement && rnd() < tauxPerte) continue;

      points.push({
        ts: ts.toISOString(),
        // Plus de ruche, plus de butineuses qui s'envolent : seul le bruit du capteur.
        poidsBrut: arrondi(poids + (volee ? 0 : poidsVivantDehors) + bruit(0.06)),
        tExt: arrondi(tExt, 1),
        tInt: arrondi(tInt, 1),
        humidite: Math.round(Math.min(99, Math.max(20, humidite))),
        batterie: Math.max(0, Math.round(batterie)),
        tension: arrondi(3.2 + (batterie / 100) * 1.0),
        rssi: Math.round(-70 - rnd() * 45),
        snr: arrondi(10 - rnd() * 14, 1),
        meteo,
        evenement,
      });
    }
  }

  return { points, tare, meteoJour };
}

// ─── Habillages : le MÊME point vu par trois familles de capteurs ───────────

/** Format BEEP — noms de champs relevés sur l'API réelle (api.beep.nl). */
export function enveloppeBeep(p: PointSimule): Record<string, unknown> {
  return {
    weight_kg: p.poidsBrut,
    weight_kg_corrected: p.poidsBrut,
    t: p.tExt,
    t_i: p.tInt,
    h: p.humidite,
    bv: p.tension,
    rssi: p.rssi,
    snr: p.snr,
    time: p.ts,
  };
}

/** Format uplink The Things Network / LoRaWAN. */
export function enveloppeTtn(p: PointSimule): Record<string, unknown> {
  return {
    end_device_ids: { device_id: 'ruche-sim-01' },
    received_at: p.ts,
    uplink_message: {
      decoded_payload: {
        weight: p.poidsBrut,
        tempC: p.tExt,
        tempIn: p.tInt,
        humidity: p.humidite,
        vbat: p.tension,
        battery: p.batterie,
      },
      // Piège : c'est la porteuse radio (868 MHz), surtout pas une fréquence sonore.
      settings: { frequency: '868300000' },
      rx_metadata: [{ rssi: p.rssi, snr: p.snr }],
    },
  };
}

/** Capteur générique qui émet en GRAMMES (cas fréquent des cartes maison). */
export function enveloppeGrammes(p: PointSimule): Record<string, unknown> {
  return {
    poids: Math.round(p.poidsBrut * 1000),
    temperature: p.tExt,
    humidite: p.humidite,
    battery: p.batterie,
    timestamp: p.ts,
  };
}
