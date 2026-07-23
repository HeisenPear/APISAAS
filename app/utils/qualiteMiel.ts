// ═══════════════════════════════════════════════════════════════════════════
// QUALITÉ DU MIEL — évaluation d'un lot sur des critères MESURABLES et
// réglementaires : teneur en eau (réfractomètre) et HMF. C'est le volet
// « qualité » du suivi récolte → mise en pot (l'éco-score en est le volet
// « environnement », cf. ecoScore.ts). Pur, déterministe, testable hors ligne.
//
// Références : directive 2001/110/CE (miel). Teneur en eau < 20 % en général
// (bruyère callune tolérée jusqu'à ~23 %). HMF ≤ 40 mg/kg (miel frais < 15).
// Au-delà de 20 % d'eau, risque de fermentation → non commercialisable en l'état.
// ═══════════════════════════════════════════════════════════════════════════

export interface EntreesQualiteMiel {
  /** Teneur en eau en %, lue au réfractomètre. */
  teneurEauPct: number;
  /** HMF en mg/kg (vieillissement / surchauffe). Optionnel : rarement mesuré en amateur. */
  hmfMgKg?: number | null;
  /** Type de miel — la bruyère (callune) tolère une teneur en eau plus élevée. */
  typeMiel?: string | null;
}

export type NoteQualite = 'excellent' | 'tres_bon' | 'conforme' | 'non_conforme';

export interface CritereQualite {
  valeur: number;
  seuil: number;
  ok: boolean;
}

export interface ResultatQualiteMiel {
  note: NoteQualite;
  /** Respecte les seuils réglementaires (eau + HMF si fourni). */
  conforme: boolean;
  teneurEau: CritereQualite;
  /** Présent seulement si le HMF a été renseigné. */
  hmf?: CritereQualite;
  /** Messages lisibles (conseils / alertes) pour l'apiculteur. */
  messages: string[];
}

/** Seuil réglementaire d'eau selon le type de miel (callune tolérée plus haut). */
const SEUIL_EAU_STANDARD = 20;
const SEUIL_EAU_CALLUNE = 23;
const SEUIL_HMF = 40;

function estCallune(typeMiel?: string | null): boolean {
  if (!typeMiel) return false;
  const t = typeMiel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return t.includes('callune') || t.includes('bruyere');
}

/**
 * Évalue la qualité d'un lot. La note est tirée du critère le plus limitant :
 * un HMF hors norme dégrade la note même si l'eau est parfaite.
 */
export function evaluerQualiteMiel(e: EntreesQualiteMiel): ResultatQualiteMiel {
  const seuilEau = estCallune(e.typeMiel) ? SEUIL_EAU_CALLUNE : SEUIL_EAU_STANDARD;
  const eau = e.teneurEauPct;
  const eauOk = eau <= seuilEau;

  const messages: string[] = [];
  if (!eauOk) {
    messages.push(
      `Teneur en eau de ${eau} % au-dessus du seuil de ${seuilEau} % : risque de fermentation, non commercialisable en l'état.`,
    );
  } else if (eau > 18.5) {
    messages.push('Teneur en eau correcte mais à consommer sans trop attendre.');
  }

  const teneurEau: CritereQualite = { valeur: eau, seuil: seuilEau, ok: eauOk };
  const resultat: ResultatQualiteMiel = {
    note: 'conforme',
    conforme: eauOk,
    teneurEau,
    messages,
  };

  let hmfOk = true;
  if (e.hmfMgKg != null) {
    hmfOk = e.hmfMgKg <= SEUIL_HMF;
    resultat.hmf = { valeur: e.hmfMgKg, seuil: SEUIL_HMF, ok: hmfOk };
    if (!hmfOk) {
      messages.push(
        `HMF de ${e.hmfMgKg} mg/kg au-dessus de ${SEUIL_HMF} : miel vieilli ou surchauffé.`,
      );
    }
  }

  resultat.conforme = eauOk && hmfOk;

  // Note : le critère le plus limitant commande.
  if (!resultat.conforme) {
    resultat.note = 'non_conforme';
  } else if (eau <= 17.5 && hmfOk && (e.hmfMgKg == null || e.hmfMgKg <= 15)) {
    resultat.note = 'excellent';
  } else if (eau <= 18.5) {
    resultat.note = 'tres_bon';
  } else {
    resultat.note = 'conforme';
  }

  return resultat;
}
