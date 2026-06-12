import {
  getRuchesSante,
  getAlertes,
  getStocks,
  getMeteoRucher,
  type RucheSante,
  type AlerteRow,
  type StockRow,
  type MeteoResultat,
} from '~~/server/utils/copilote-data';

/**
 * « Brief du jour » de Maya — synthèse proactive déterministe qui croise
 * météo, visites en retard, santé, alertes, stocks et saison. Affiché en carte
 * sur le dashboard. La composition est PURE (testable) ; `briefDuJour` charge
 * les données via copilote-data puis l'appelle.
 */

export interface BriefItem {
  icone: string;
  texte: string;
  ton: 'honey' | 'sage' | 'clay' | 'neutre';
  to?: string;
}

export interface Brief {
  salutation: string;
  items: BriefItem[];
}

const VISITE_SEUIL_JOURS = 21;

/** Conseil court par mois (index 0 = janvier). */
const SAISON: string[] = [
  'surveillez le poids des ruches et traitez le varroa hors couvain.',
  'préparez le matériel ; premières sorties par beau temps.',
  'c’est la visite de printemps : contrôlez ponte et réserves.',
  'surveillez l’essaimage et posez les premières hausses.',
  'pleine saison d’essaimage — visites rapprochées.',
  'gestion des hausses et miellées d’été.',
  'récoltes d’été : récoltez le miel mûr et operculé.',
  'dernière récolte puis traitement varroa.',
  'complétez les réserves et pensez à la déclaration annuelle des ruches.',
  'réduisez les entrées et restez vigilant face au frelon.',
  'colonies au repos : entretien du matériel.',
  'traitement à l’acide oxalique hors couvain.',
];

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function composerBrief(input: {
  ruches: RucheSante[];
  alertes: AlerteRow[];
  stocks: StockRow[];
  meteo: MeteoResultat | { erreur: string };
  mois: number;
}): Brief {
  const { ruches, alertes, stocks, meteo, mois } = input;
  const items: BriefItem[] = [];

  // 1. Meilleure fenêtre météo de visite
  if (!('erreur' in meteo) && meteo.previsions.length) {
    const meilleur = [...meteo.previsions].sort((a, b) => b.scoreVisite - a.scoreVisite)[0];
    if (meilleur && meilleur.scoreVisite >= 60) {
      items.push({
        icone: '🌤️',
        texte: `Bonne fenêtre pour ouvrir les ruches : ${dateCourte(meilleur.date)} (${meilleur.scoreVisite}/100).`,
        ton: 'sage',
        to: '/meteo',
      });
    }
  }

  // 2. Ruches à visiter (en retard)
  const actives = ruches.filter((r) => r.statut === 'active');
  const aVisiter = actives.filter(
    (r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= VISITE_SEUIL_JOURS,
  );
  if (aVisiter.length) {
    items.push({
      icone: '🐝',
      texte: `${aVisiter.length} ruche${aVisiter.length > 1 ? 's' : ''} à visiter (plus de ${VISITE_SEUIL_JOURS} jours sans contrôle).`,
      ton: 'honey',
      to: '/ruches',
    });
  }

  // 3. Colonies sous surveillance (score < 40)
  const critiques = actives.filter((r) => r.derniereVisite != null && r.scoreSante < 40);
  if (critiques.length) {
    items.push({
      icone: '⚠️',
      texte: `${critiques.length} colonie${critiques.length > 1 ? 's' : ''} sous surveillance (score de santé bas).`,
      ton: 'clay',
      to: '/ruches',
    });
  }

  // 4. Alertes prioritaires
  const prioritaires = alertes.filter((a) => a.priorite === 'critique' || a.priorite === 'haute');
  if (prioritaires.length) {
    items.push({
      icone: '🔔',
      texte: `${prioritaires.length} alerte${prioritaires.length > 1 ? 's' : ''} prioritaire${prioritaires.length > 1 ? 's' : ''} à traiter.`,
      ton: 'clay',
      to: '/alertes',
    });
  }

  // 5. Stocks sous le seuil
  const stocksBas = stocks.filter((s) => s.sousLeSeuil);
  if (stocksBas.length) {
    items.push({
      icone: '📦',
      texte: `${stocksBas.length} article${stocksBas.length > 1 ? 's' : ''} sous le seuil — pensez à réapprovisionner.`,
      ton: 'honey',
      to: '/stocks',
    });
  }

  // 6. Note de saison (toujours présente, en dernier)
  items.push({
    icone: '📅',
    texte: `En cette saison, ${SAISON[mois] ?? 'suivez vos colonies au rythme de l’année apicole.'}`,
    ton: 'neutre',
  });

  // Si rien d'urgent au-dessus de la note de saison.
  const salutation =
    items.length <= 1
      ? 'Tout est au vert aujourd’hui 🌿 Profitez-en pour observer vos colonies.'
      : 'Voici votre point du jour 🐝';

  return { salutation, items };
}

export async function briefDuJour(userId: string): Promise<Brief> {
  const [ruches, alertes, stocks, meteo] = await Promise.all([
    getRuchesSante(userId),
    getAlertes(userId),
    getStocks(userId),
    getMeteoRucher(userId),
  ]);
  return composerBrief({ ruches, alertes, stocks, meteo, mois: new Date().getMonth() });
}
