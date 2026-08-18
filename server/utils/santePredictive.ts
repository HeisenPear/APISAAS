import type { InspectionRow } from './santeScore';
import { computeScore } from './santeScore';

export interface PredictionResult {
  scoreActuel: number;
  scorePrediction30j: number;
  tendance: 'hausse' | 'stable' | 'baisse';
  risques: string[];
  suggestions: string[];
  urgence: 'normale' | 'attention' | 'urgente';
}

/**
 * Prédit l'état de santé d'une ruche à 30 jours
 * basé sur les tendances des dernières inspections.
 *
 * `maintenant` est l'instant de référence : il traverse jusqu'à la décote de
 * fraîcheur de `computeScore`, ce qui rend la prédiction reproductible.
 */
export function predictSante(
  rows: InspectionRow[],
  historique: InspectionRow[],
  maintenant: Date = new Date(),
): PredictionResult {
  const scoreActuel = computeScore(rows[0] ?? ({} as InspectionRow), maintenant);

  // Calcul tendance sur les 3 dernières visites
  const scores = historique.slice(0, 3).map((r) => computeScore(r, maintenant));

  let tendanceDelta = 0;
  if (scores.length >= 2) {
    const diffs: number[] = [];
    for (let i = 0; i < scores.length - 1; i++) {
      diffs.push((scores[i] ?? 0) - (scores[i + 1] ?? 0));
    }
    tendanceDelta = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  const scorePrediction30j = Math.max(
    0,
    Math.min(100, Math.round(scoreActuel + tendanceDelta * 2)),
  );

  const tendance: PredictionResult['tendance'] =
    tendanceDelta > 3 ? 'hausse' : tendanceDelta < -3 ? 'baisse' : 'stable';

  const current = rows[0];
  const risques: string[] = [];
  const suggestions: string[] = [];

  // Analyse des facteurs de risque
  if (current?.varroa != null && current.varroa > 5) {
    risques.push('Infestation varroa critique');
    suggestions.push('Traitement varroa urgent recommandé');
  } else if (current?.varroa != null && current.varroa > 3) {
    risques.push('Niveau varroa élevé');
    suggestions.push('Surveiller le varroa et envisager un traitement');
  }

  if (current?.forceColonie != null && current.forceColonie <= 2) {
    risques.push('Colonie faible');
    suggestions.push('Renforcer la colonie ou vérifier la reine');
  }

  if (current?.reineVue === false) {
    risques.push('Reine non observée');
    suggestions.push('Vérifier la présence de la reine lors de la prochaine visite');
  }

  if (current?.reserves != null && current.reserves <= 2) {
    risques.push('Réserves insuffisantes');
    suggestions.push('Nourrir la colonie');
  }

  if (current?.signeEssaimage === true) {
    risques.push("Signes d'essaimage détectés");
    suggestions.push('Agrandir le nid ou diviser la colonie');
  }

  if (current?.maladieObservee && current.maladieObservee.trim() !== '') {
    risques.push(`Maladie observée : ${current.maladieObservee}`);
    suggestions.push('Consulter un vétérinaire apicole');
  }

  // Vérification fréquence des visites
  if (current?.dateVisite) {
    const daysSinceLastVisit = Math.floor(
      (maintenant.getTime() - new Date(current.dateVisite).getTime()) / 86400000,
    );
    if (daysSinceLastVisit > 21) {
      risques.push(`Pas de visite depuis ${daysSinceLastVisit} jours`);
      suggestions.push('Planifier une visite prochainement');
    }
  } else {
    risques.push('Aucune inspection enregistrée');
    suggestions.push('Effectuer une première inspection et saisir les données');
  }

  if (suggestions.length === 0) {
    suggestions.push('Colonie en bonne santé — continuer le suivi régulier');
  }

  const urgence: PredictionResult['urgence'] =
    scoreActuel < 30 || risques.length >= 3
      ? 'urgente'
      : scoreActuel < 50 || risques.length >= 2
        ? 'attention'
        : 'normale';

  return {
    scoreActuel,
    scorePrediction30j,
    tendance,
    risques,
    suggestions,
    urgence,
  };
}
