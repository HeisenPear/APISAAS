// ═══════════════════════════════════════════════════════════════════════════
// ÉCO-SCORE d'un lot de miel — note environnementale (0-100 + lettre A→E),
// calculée sur des données RÉELLES du lot (pas un label marketing). Inspiré du
// différenciateur du concurrent Api'Track, mais adossé à NOTRE traçabilité :
// transhumance, traitements, diversité florale, naturalité, environnement.
//
// Module PUR et testable. Le câblage aux données de traçabilité des lots et la
// page publique scannable (« l'histoire de ce pot ») viennent ensuite — ici on
// verrouille le MODÈLE de calcul, honnête et déterministe.
//
// NB couleur : le rendu visuel choisira une échelle CHAUDE (miel → clay), pas le
// vert habituel des éco-scores — cohérence avec la charte « zéro vert ».
// ═══════════════════════════════════════════════════════════════════════════

export interface EntreesEcoScore {
  /** Distance de transhumance du lot, en km (0 = rucher sédentaire / local). */
  distanceTranshumanceKm: number;
  /** Part des traitements varroa NON chimiques (acides organiques, mécanique), 0..1. */
  partTraitementsDoux: number;
  /** Nombre de floraisons distinctes butinées (diversité mellifère). */
  diversiteFlorale: number;
  /** Part de nourrissement au sucre plutôt que miel laissé, 0..1 (0 = aucun sucre). */
  partNourrissementSucre: number;
  /** Vendu en circuit court / vente directe ? */
  circuitCourt: boolean;
  /** Rucher en zone préservée (bio à proximité, éloigné des grandes cultures) ? */
  environnementPreserve: boolean;
}

export type NoteEco = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DetailEcoScore {
  critere: string;
  points: number;
  max: number;
}

export interface ResultatEcoScore {
  /** Score global, 0 à 100. */
  score: number;
  /** Lettre A (excellent) → E (à améliorer). */
  note: NoteEco;
  /** Décomposition par critère — c'est ce qu'on montre au client, transparent. */
  details: DetailEcoScore[];
}

function borne(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Barème (somme = 100). Exposé pour que l'UI affiche les max sans les redéclarer. */
export const ECO_BAREME = {
  transport: 25,
  traitements: 25,
  diversite: 20,
  naturalite: 15,
  environnement: 15,
} as const;

/** Distance (km) au-delà de laquelle le critère transport tombe à 0. */
const TRANSPORT_KM_MAX = 150;
/** Nombre de floraisons pour le plein de diversité. */
const DIVERSITE_CIBLE = 5;

/**
 * Calcule l'éco-score d'un lot. Déterministe, borné, sans effet de bord.
 * Chaque critère est motivé :
 *  - Transport : moins on déplace les ruches, plus l'empreinte est faible.
 *  - Traitements : acides organiques / mécanique > varroacides de synthèse.
 *  - Diversité florale : un miel de terroir varié vaut mieux qu'une monoculture.
 *  - Naturalité : laisser du miel aux abeilles plutôt que nourrir au sucre.
 *  - Environnement & circuit : zone préservée + vente directe.
 */
export function calculerEcoScore(e: EntreesEcoScore): ResultatEcoScore {
  const transport = Math.round(
    borne(
      ECO_BAREME.transport * (1 - e.distanceTranshumanceKm / TRANSPORT_KM_MAX),
      0,
      ECO_BAREME.transport,
    ),
  );
  const traitements = Math.round(
    borne(ECO_BAREME.traitements * e.partTraitementsDoux, 0, ECO_BAREME.traitements),
  );
  const diversite = Math.round(
    borne(ECO_BAREME.diversite * (e.diversiteFlorale / DIVERSITE_CIBLE), 0, ECO_BAREME.diversite),
  );
  const naturalite = Math.round(
    borne(ECO_BAREME.naturalite * (1 - e.partNourrissementSucre), 0, ECO_BAREME.naturalite),
  );
  const environnement = (e.environnementPreserve ? 10 : 0) + (e.circuitCourt ? 5 : 0);

  const score = borne(transport + traitements + diversite + naturalite + environnement, 0, 100);
  const note: NoteEco =
    score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'E';

  return {
    score,
    note,
    details: [
      { critere: 'Transport & transhumance', points: transport, max: ECO_BAREME.transport },
      { critere: 'Traitements respectueux', points: traitements, max: ECO_BAREME.traitements },
      { critere: 'Diversité florale', points: diversite, max: ECO_BAREME.diversite },
      {
        critere: 'Naturalité (peu de nourrissement)',
        points: naturalite,
        max: ECO_BAREME.naturalite,
      },
      {
        critere: 'Environnement & circuit court',
        points: environnement,
        max: ECO_BAREME.environnement,
      },
    ],
  };
}
