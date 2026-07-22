import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
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
import { voix, seedVoix } from '~~/server/utils/maya-voix';

/**
 * « Point du jour » de Maya — synthèse proactive déterministe et CONVERSATIONNELLE :
 * elle salue l'apiculteur par son prénom selon le moment de la journée, enchaîne
 * par une intro naturelle, puis liste ce qui mérite son attention sous forme de
 * blocs cliquables. La composition est PURE (testable) ; `briefDuJour` charge les
 * données puis l'appelle.
 */

export interface BriefItem {
  icone: string;
  texte: string;
  ton: 'honey' | 'sage' | 'clay' | 'neutre';
  to?: string;
}

export interface Brief {
  /** Salutation personnalisée, ex. « Bonjour Antoine ». */
  salutation: string;
  /** Phrase d'introduction, ton compagnon. */
  intro: string;
  items: BriefItem[];
}

const VISITE_SEUIL_JOURS = 21;

const SAISON: string[] = [
  'je surveillerais le poids des ruches et le varroa hors couvain.',
  'c’est le moment de préparer le matériel pour la reprise.',
  'place à la visite de printemps : ponte et réserves à vérifier.',
  'garde un œil sur l’essaimage et pose les premières hausses.',
  'pleine saison d’essaimage — des visites rapprochées s’imposent.',
  'gère les hausses et profite des miellées d’été.',
  'c’est la récolte : vise un miel mûr et bien operculé.',
  'après la dernière récolte, pense au traitement varroa.',
  'complète les réserves et prépare la déclaration des ruches.',
  'réduis les entrées et reste vigilant face au frelon.',
  'les colonies se reposent : entretenez le matériel.',
  'un traitement à l’acide oxalique hors couvain est idéal.',
];

/** Fenêtre « depuis cette nuit » : les ~18 dernières heures. */
const FENETRE_VEILLE_MS = 18 * 3600 * 1000;

function msDe(x: string | Date | null | undefined): number | null {
  if (!x) return null;
  const t = x instanceof Date ? x.getTime() : Date.parse(x);
  return Number.isNaN(t) ? null : t;
}

/**
 * Verdict de « veille nocturne » : ce qui a changé depuis la nuit.
 * S'appuie sur les alertes récentes (delta) et les conditions de la nuit/journée
 * (1ʳᵉ prévision = ~la nuit qui s'achève au moment du brief matinal).
 * Renvoie une phrase prête à afficher, jamais vide.
 */
function verdictVeille(
  alertes: AlerteRow[],
  meteo: MeteoResultat | { erreur: string },
  maintenantMs: number,
): string {
  const faits: string[] = [];

  const nouvelles = alertes.filter((a) => {
    const t = msDe(a.createdAt);
    return t != null && maintenantMs - t <= FENETRE_VEILLE_MS && maintenantMs - t >= 0;
  });
  if (nouvelles.length) {
    faits.push(
      `${nouvelles.length} nouvelle${nouvelles.length > 1 ? 's' : ''} alerte${nouvelles.length > 1 ? 's' : ''} depuis hier`,
    );
  }

  if (!('erreur' in meteo) && meteo.previsions.length) {
    const nuit = meteo.previsions[0];
    if (nuit) {
      if (nuit.tempMin <= 1) faits.push(`gelée nocturne (jusqu'à ${Math.round(nuit.tempMin)} °C)`);
      if (/orage/i.test(nuit.conditions)) faits.push('orage');
      else if (nuit.ventMaxKmh >= 45) faits.push(`vent fort (${Math.round(nuit.ventMaxKmh)} km/h)`);
    }
  }

  const opener = voix('veilleNuit');
  if (!faits.length) return `${opener} ${voix('veilleRAS')}.`;

  // Capitalise le 1ᵉʳ fait, liste le reste.
  const liste = faits.join(',');
  return `${opener} À signaler : ${liste}.`;
}

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** Salutation selon l'heure (0-23) : matin / après-midi / soir. */
function salutationMoment(heure: number, prenom?: string): string {
  const nom = prenom ? ` ${prenom}` : '';
  if (heure < 7) return `Déjà debout${nom}`;
  if (heure < 12) return `Bonjour${nom}`;
  if (heure < 18) return `Bon après-midi${nom}`;
  return `Bonsoir${nom}`;
}

export type ContexteBrief = 'ruches' | 'meteo';

export function composerBrief(input: {
  prenom?: string;
  heure: number;
  ruches: RucheSante[];
  alertes: AlerteRow[];
  stocks: StockRow[];
  meteo: MeteoResultat | { erreur: string };
  mois: number;
  /** Si défini, brief ciblé pour une page (carte contextuelle). */
  contexte?: ContexteBrief;
  /** Horodatage de référence pour le delta de veille (défaut : maintenant). */
  maintenant?: number;
}): Brief {
  const { prenom, heure, ruches, alertes, stocks, meteo, mois, contexte } = input;
  const maintenant = input.maintenant ?? Date.now();
  const items: BriefItem[] = [];

  // 1. Meilleure fenêtre météo de visite
  if (!('erreur' in meteo) && meteo.previsions.length) {
    const meilleur = [...meteo.previsions].sort((a, b) => b.scoreVisite - a.scoreVisite)[0];
    if (meilleur && meilleur.scoreVisite >= 60) {
      items.push({
        icone: '',
        texte: `Belle fenêtre pour ouvrir les ruches ${dateCourte(meilleur.date)} — j'en profiterais à ta place`,
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
      icone: '',
      texte: `${aVisiter.length} de tes ruches n'${aVisiter.length > 1 ? 'ont' : 'a'} pas reçu de visite depuis un moment — un petit tour leur ferait du bien.`,
      ton: 'honey',
      to: '/ruches',
    });
  }

  // 3. Colonies sous surveillance (score < 40)
  const critiques = actives.filter((r) => r.derniereVisite != null && r.scoreSante < 40);
  if (critiques.length) {
    items.push({
      icone: '',
      texte: `${critiques.length} colonie${critiques.length > 1 ? 's me semblent fragiles' : 'me semble fragile'} — je garderais un œil dessus.`,
      ton: 'clay',
      to: '/ruches',
    });
  }

  // 4. Alertes prioritaires
  const prioritaires = alertes.filter((a) => a.priorite === 'critique' || a.priorite === 'haute');
  if (prioritaires.length) {
    items.push({
      icone: '',
      texte: `${prioritaires.length} alerte${prioritaires.length > 1 ? 's' : ''} à regarder en priorité dès que tu as un moment.`,
      ton: 'clay',
      to: '/alertes',
    });
  }

  // 5. Stocks sous le seuil
  const stocksBas = stocks.filter((s) => s.sousLeSeuil);
  if (stocksBas.length) {
    items.push({
      icone: '',
      texte: `${stocksBas.length} produit${stocksBas.length > 1 ? 's passent' : 'passe'} sous le seuil — un petit réappro éviterait la panne.`,
      ton: 'honey',
      to: '/stocks',
    });
  }

  // 6. Note de saison (toujours présente, en dernier, dans la voix de Maya)
  items.push({
    icone: '',
    texte: `En cette saison, ${SAISON[mois] ?? 'suis tes colonies au rythme de l’année apicole.'}`,
    ton: 'neutre',
  });

  // Carte contextuelle : on ne garde que ce qui concerne la page courante.
  if (contexte) {
    const pertinents = items.filter((it) =>
      contexte === 'ruches' ? it.to === '/ruches' : it.to === '/meteo',
    );
    const introCtx = pertinents.length
      ? voix(contexte === 'ruches' ? 'contexteRuches' : 'contexteMeteo')
      : voix('contexteCalme');
    return { salutation: '', intro: introCtx, items: pertinents };
  }

  // Le brief matinal s'ouvre sur la « veille nocturne » : Maya a surveillé le
  // rucher et dit ce qui a changé (ou que tout est calme), avant la liste à faire.
  const intro = verdictVeille(alertes, meteo, maintenant);
  return { salutation: salutationMoment(heure, prenom), intro, items };
}

export async function briefDuJour(userId: string, contexte?: ContexteBrief): Promise<Brief> {
  const heure = Number(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  );

  const [profil, ruches, alertes, stocks, meteo] = await Promise.all([
    db.select({ prenom: profils.prenom }).from(profils).where(eq(profils.id, userId)).limit(1),
    getRuchesSante(userId),
    getAlertes(userId),
    getStocks(userId),
    getMeteoRucher(userId),
  ]);

  // Voix déterministe sur la journée : le brief reste identique à chaque
  // navigation du même utilisateur le même jour (composerBrief est synchrone).
  const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  seedVoix(`${userId}:${jour}`);

  return composerBrief({
    prenom: profil[0]?.prenom ?? undefined,
    heure: Number.isNaN(heure) ? 9 : heure,
    ruches,
    alertes,
    stocks,
    meteo,
    mois: new Date().getMonth(),
    contexte,
  });
}
