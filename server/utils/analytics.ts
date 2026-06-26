// Moteur analytics « pilotage de rentabilité » — fonctions pures, zéro I/O, testables.
// Trois analyses réelles :
//  1. Rentabilité par rucher : production exacte (recoltes) → kg/ruche + valorisation
//     estimée (prix moyen) − coûts répartis. Le kg/ruche est exact ; valorisation &
//     coûts sont des estimations (ventes/achats ne sont pas rattachés à un rucher).
//  2. Comparaison entre saisons (année N vs N-1), mensuelle.
//  3. Corrélation météo ↔ production (coefficient de Pearson sur la saison active).

/** Prix de repli (€/kg de miel) si aucune vente ne permet de le dériver — marché FR amateur. */
export const PRIX_MIEL_DEFAUT_EUR_KG = 12;

// ─── 1. Rentabilité par rucher ──────────────────────────────────────────────

export interface ProductionRucher {
  rucherId: string;
  kg: number;
}
export interface RucherInfo {
  rucherId: string;
  nom: string;
  nbRuches: number;
}
export interface RentabiliteRucher {
  rucherId: string;
  nom: string;
  nbRuches: number;
  /** Production de miel réelle (kg) — exacte, issue des récoltes. */
  productionKg: number;
  /** Productivité réelle (kg/ruche) — le signal le plus fiable pour comparer ses ruchers. */
  kgParRuche: number;
  /** Valorisation estimée = production × prix moyen (€). Estimation. */
  valorisationEur: number;
  /** Coûts répartis au prorata de la production (€). Estimation. */
  coutsEur: number;
  /** Marge estimée = valorisation − coûts répartis (€). */
  margeEur: number;
}

/** Prix moyen réalisé (€/kg) = CA ÷ production. Repli sur un prix marché si indéterminable. */
export function prixMoyenKg(caTotal: number, productionKg: number): number {
  if (productionKg > 0 && caTotal > 0) return Math.round((caTotal / productionKg) * 100) / 100;
  return PRIX_MIEL_DEFAUT_EUR_KG;
}

export function rentabiliteRuchers(
  ruchers: RucherInfo[],
  production: ProductionRucher[],
  prixKg: number,
  coutsTotal: number,
): RentabiliteRucher[] {
  const prodMap = new Map(production.map((p) => [p.rucherId, p.kg]));
  const totalKg = production.reduce((s, p) => s + p.kg, 0);
  const totalRuches = ruchers.reduce((s, r) => s + r.nbRuches, 0);

  return ruchers
    .map((r) => {
      const kg = prodMap.get(r.rucherId) ?? 0;
      // Coûts répartis : au prorata de la production, à défaut au prorata des ruches.
      const part = totalKg > 0 ? kg / totalKg : totalRuches > 0 ? r.nbRuches / totalRuches : 0;
      const valorisation = kg * prixKg;
      const couts = coutsTotal * part;
      return {
        rucherId: r.rucherId,
        nom: r.nom,
        nbRuches: r.nbRuches,
        productionKg: Math.round(kg * 10) / 10,
        kgParRuche: r.nbRuches > 0 ? Math.round((kg / r.nbRuches) * 10) / 10 : 0,
        valorisationEur: Math.round(valorisation),
        coutsEur: Math.round(couts),
        margeEur: Math.round(valorisation - couts),
      };
    })
    .sort((a, b) => b.productionKg - a.productionKg);
}

// ─── 2. Comparaison entre saisons (YoY) ─────────────────────────────────────

export interface MoisValeur {
  mois: number; // 1-12
  valeur: number;
}
export interface CompMois {
  mois: number;
  n: number;
  n1: number;
  delta: number;
}

/** Replie des lignes {mois, valeur} sur un tableau de 12 cases (index 0 = janvier). */
export function alignerMensuel(rows: MoisValeur[]): number[] {
  const out = new Array(12).fill(0);
  for (const r of rows) if (r.mois >= 1 && r.mois <= 12) out[r.mois - 1] += r.valeur;
  return out;
}

export function comparaisonMensuelle(n: number[], n1: number[]): CompMois[] {
  return Array.from({ length: 12 }, (_, i) => {
    const vn = Math.round((n[i] ?? 0) * 10) / 10;
    const vn1 = Math.round((n1[i] ?? 0) * 10) / 10;
    return { mois: i + 1, n: vn, n1: vn1, delta: Math.round((vn - vn1) * 10) / 10 };
  });
}

/** Variation en % (N vs N-1). `null` = aucune base de comparaison (N-1 nul). */
export function deltaPct(n: number, n1: number): number | null {
  if (n1 === 0) return n === 0 ? 0 : null;
  return Math.round(((n - n1) / n1) * 100);
}

// ─── 3. Corrélation météo ↔ production ──────────────────────────────────────

export interface MeteoMois {
  mois: number; // 1-12
  tMax: number; // température max moyenne (°C)
  sunHours: number; // ensoleillement moyen (h/jour)
  precip: number; // cumul de précipitations (mm)
}

/** Coefficient de corrélation de Pearson (-1..1). 0 si dégénéré (n<2 ou variance nulle). */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = n * sxy - sx * sy;
  const dx = n * sxx - sx * sx;
  const dy = n * syy - sy * sy;
  if (dx <= 0 || dy <= 0) return 0;
  return Math.round((cov / Math.sqrt(dx * dy)) * 100) / 100;
}

/** Indice 0-100 de favorabilité au butinage : chaleur (optimum ~24 °C) + ensoleillement. */
export function indiceFavorabilite(m: { tMax: number; sunHours: number }): number {
  const tScore = Math.max(0, 100 - Math.abs(m.tMax - 24) * 6);
  const sScore = Math.min(100, (m.sunHours / 10) * 100);
  return Math.round(tScore * 0.5 + sScore * 0.5);
}

export type ForceCorrelation = 'forte' | 'modérée' | 'faible' | 'nulle';

export interface CorrelationPoint {
  mois: number;
  production: number;
  favorabilite: number;
  tMax: number;
  sunHours: number;
}
export interface CorrelationResult {
  coefficient: number;
  force: ForceCorrelation;
  points: CorrelationPoint[];
  insight: string;
}

function forceDe(c: number): ForceCorrelation {
  const a = Math.abs(c);
  if (a >= 0.6) return 'forte';
  if (a >= 0.3) return 'modérée';
  if (a > 0.1) return 'faible';
  return 'nulle';
}

/**
 * Corrèle la production mensuelle (12 cases) à la favorabilité météo, sur la
 * fenêtre de la saison active (du 1er au dernier mois ayant produit) pour éviter
 * la corrélation triviale « hiver froid = 0 récolte ».
 */
export function correlationMeteoProduction(prod: number[], meteo: MeteoMois[]): CorrelationResult {
  const meteoMap = new Map(meteo.map((m) => [m.mois, m]));
  const points: CorrelationPoint[] = Array.from({ length: 12 }, (_, i) => {
    const m = meteoMap.get(i + 1);
    return {
      mois: i + 1,
      production: Math.round((prod[i] ?? 0) * 10) / 10,
      favorabilite: m ? indiceFavorabilite(m) : 0,
      tMax: m ? Math.round(m.tMax * 10) / 10 : 0,
      sunHours: m ? Math.round(m.sunHours * 10) / 10 : 0,
    };
  });

  const moisProductifs = points.filter((p) => p.production > 0).map((p) => p.mois);
  if (moisProductifs.length < 2) {
    return {
      coefficient: 0,
      force: 'nulle',
      points,
      insight:
        'Pas encore assez de récoltes pour révéler un lien météo ↔ production. Revenez après votre saison de miellée.',
    };
  }

  const min = Math.min(...moisProductifs);
  const max = Math.max(...moisProductifs);
  const fenetre = points.filter((p) => p.mois >= min && p.mois <= max && meteoMap.has(p.mois));
  const coefficient = pearson(
    fenetre.map((p) => p.favorabilite),
    fenetre.map((p) => p.production),
  );
  const force = forceDe(coefficient);
  const signe = coefficient >= 0 ? '+' : '−';
  const valAbs = Math.abs(coefficient).toFixed(2).replace('.', ',');

  let insight: string;
  if (force === 'forte' && coefficient > 0) {
    insight = `Vos meilleures récoltes tombent sur les mois les plus chauds et ensoleillés (corrélation forte ${signe}${valAbs}). La météo explique largement vos écarts de production.`;
  } else if (force === 'modérée' && coefficient > 0) {
    insight = `Les mois favorables produisent plutôt plus, mais d'autres facteurs jouent aussi (corrélation modérée ${signe}${valAbs}).`;
  } else if (coefficient < -0.1) {
    insight = `Vos pics de récolte ne suivent pas la météo « idéale » (corrélation ${signe}${valAbs}) — emplacement et miellées locales priment sur la chaleur.`;
  } else {
    insight = `Peu de lien direct météo ↔ production cette saison — vos résultats dépendent surtout d'autres facteurs (emplacement, conduite, miellées).`;
  }

  return { coefficient, force, points, insight };
}

// ─── 4. Analyse pluriannuelle (Expert) ──────────────────────────────────────

export interface SaisonAgg {
  annee: number;
  productionKg: number;
  ca: number;
  /** Marge RÉELLE de la saison = CA encaissé − achats (€). */
  margeEur: number;
}

export type Tendance = 'hausse' | 'baisse' | 'stable';

/** Tendance qualitative d'une série chronologique (régression linéaire, seuil 5 %). */
export function tendance(values: number[]): Tendance {
  const n = values.length;
  if (n < 2) return 'stable';
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * ((values[i] ?? 0) - yMean);
    den += (i - xMean) ** 2;
  }
  if (den === 0) return 'stable';
  const pente = num / den;
  const seuil = Math.abs(yMean) * 0.05;
  if (pente > seuil) return 'hausse';
  if (pente < -seuil) return 'baisse';
  return 'stable';
}

export interface SyntheseSaisons {
  tendanceProduction: Tendance;
  tendanceCa: Tendance;
  meilleure: SaisonAgg | null;
  pire: SaisonAgg | null;
  productionMoyenne: number;
  caMoyen: number;
}

export function syntheseSaisons(saisons: SaisonAgg[]): SyntheseSaisons {
  if (saisons.length === 0) {
    return {
      tendanceProduction: 'stable',
      tendanceCa: 'stable',
      meilleure: null,
      pire: null,
      productionMoyenne: 0,
      caMoyen: 0,
    };
  }
  const tri = [...saisons].sort((a, b) => a.annee - b.annee); // chronologique
  const avecProd = tri.filter((s) => s.productionKg > 0);
  const ref = avecProd.length ? avecProd : tri;
  const parProd = [...ref].sort((a, b) => b.productionKg - a.productionKg);
  return {
    tendanceProduction: tendance(tri.map((s) => s.productionKg)),
    tendanceCa: tendance(tri.map((s) => s.ca)),
    meilleure: parProd[0] ?? null,
    pire: parProd[parProd.length - 1] ?? null,
    productionMoyenne:
      Math.round((tri.reduce((s, x) => s + x.productionKg, 0) / tri.length) * 10) / 10,
    caMoyen: Math.round(tri.reduce((s, x) => s + x.ca, 0) / tri.length),
  };
}

// ─── Centroïde (pour la requête météo d'archive) ────────────────────────────

export interface Coord {
  lat: number;
  lng: number;
}

/** Barycentre simple d'une liste de points géographiques. `null` si vide. */
export function centroide(coords: Coord[]): Coord | null {
  if (coords.length === 0) return null;
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}
