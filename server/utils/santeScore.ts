export interface InspectionRow {
  rucheId: string;
  numero: string;
  rucherId: string;
  statut: string;
  qualiteReine: string | null;
  dateVisite: Date | string | null;
  forceColonie: number | null;
  couvain: number | null;
  reserves: number | null;
  reineVue: boolean | null;
  varroa: number | null;
  comportement: string | null;
  signeEssaimage: boolean | null;
  maladieObservee: string | null;
}

export function computeScore(row: InspectionRow): number {
  if (!row.dateVisite) {
    const fallback: Record<string, number> = {
      active: 50,
      faible: 30,
      orpheline: 20,
      morte: 0,
      vendue: 0,
      fusionnee: 0,
      essaimee: 0,
    };
    return fallback[row.statut] ?? 50;
  }

  let score = 0;

  // forceColonie (1-5) → 25 pts
  if (row.forceColonie != null) score += (row.forceColonie / 5) * 25;
  // couvain (0-5) → 20 pts
  if (row.couvain != null) score += (row.couvain / 5) * 20;
  // reserves (1-5) → 15 pts
  if (row.reserves != null) score += (row.reserves / 5) * 15;
  // reineVue → 10 pts
  if (row.reineVue) score += 10;
  // varroa → 15 pts
  if (row.varroa != null) {
    if (row.varroa <= 1) score += 15;
    else if (row.varroa <= 3) score += 10;
    else if (row.varroa <= 5) score += 5;
  }
  // comportement → 5 pts
  if (row.comportement === 'calme') score += 5;
  else if (row.comportement === 'nerveuse') score += 2;
  // penalites
  if (row.signeEssaimage) score -= 10;
  if (row.maladieObservee && row.maladieObservee.trim() !== '') score -= 10;
  // qualiteReine bonus
  const reineBonus: Record<string, number> = {
    excellente: 5,
    bonne: 3,
    moyenne: 0,
    faible: -3,
    absente: -5,
  };
  if (row.qualiteReine != null && row.qualiteReine in reineBonus) {
    score += reineBonus[row.qualiteReine] ?? 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Bon';
  if (score >= 50) return 'Correct';
  if (score >= 40) return 'Attention';
  return 'Critique';
}

export function scoreColor(score: number): string {
  if (score >= 70) return '#34A853';
  if (score >= 40) return '#F5A623';
  return '#D93025';
}
