import {
  getRuchers,
  getRuchesSante,
  getInterventionsRecentes,
  getStocks,
  getFinances,
  getAlertes,
  getMeteoRucher,
  type RucheSante,
  type MeteoResultat,
} from '~~/server/utils/copilote-data';
import { SAVOIR, SUGGESTIONS_FALLBACK, type ArticleSavoir } from '~~/server/utils/copilote-savoir';

/**
 * Moteur Copilote LOCAL — 100 % embarqué, zéro appel externe, zéro coût.
 *
 * Pipeline : normaliser → détecter une intention d'ACTION (interroge les
 * données du compte) → sinon chercher dans la base de SAVOIR (réponses
 * pré-rédigées) → sinon repli avec suggestions. Le tout en TypeScript pur :
 * c'est un système expert, pas un LLM — léger et instantané.
 */

export interface CopiloteReponse {
  /** Texte markdown de la réponse */
  texte: string;
  /** Libellé d'« activité » (donnée consultée) — affiché comme pour un outil */
  source?: string;
  /** Questions de rebond proposées à l'utilisateur */
  suggestions?: string[];
  /** true si le moteur n'a pas su répondre (utile pour l'escalade Claude) */
  manque: boolean;
}

// ─── Normalisation ───────────────────────────────────────────────────────────

function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents (combining marks)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Détection d'intentions d'action ─────────────────────────────────────────

type IntentId =
  | 'ruches_visiter'
  | 'sante'
  | 'stocks'
  | 'finances'
  | 'meteo'
  | 'alertes'
  | 'ruchers'
  | 'interventions';

interface Intent {
  id: IntentId;
  /** Expressions déclencheuses (normalisées) — au moins une doit matcher */
  triggers: string[];
}

// Ordre = priorité (le premier qui matche gagne)
const INTENTS: Intent[] = [
  {
    id: 'ruches_visiter',
    triggers: [
      'visiter',
      'a visiter',
      'quelle ruche',
      'quelles ruches',
      'priorite',
      'prioritaire',
      'pas ete visitee',
      'derniere visite',
      'planifier visite',
    ],
  },
  {
    id: 'sante',
    triggers: [
      'sante',
      'point sante',
      'etat de mes ruches',
      'etat des ruches',
      'etat des colonies',
      'score',
      'colonies vont bien',
      'ruches faibles',
      'ruche en danger',
      'comment vont',
    ],
  },
  {
    id: 'stocks',
    triggers: [
      'stock',
      'stocks',
      'materiel',
      'reste de',
      'inventaire',
      'sous le seuil',
      'reapprovisionner',
      'commander',
    ],
  },
  {
    id: 'finances',
    triggers: [
      'finance',
      'finances',
      'chiffre d affaire',
      'chiffre d affaires',
      'ca ',
      'mon ca',
      'ventes',
      'vendu',
      'gagne',
      'impaye',
      'impayes',
      'facture en retard',
      'factures en retard',
      'rentabilite',
      'combien rapporte',
    ],
  },
  {
    id: 'meteo',
    triggers: [
      'meteo',
      'temps',
      'fait il beau',
      'demain',
      'sortir les ruches',
      'conditions de visite',
      'pluie',
      'vent',
      'temperature',
    ],
  },
  {
    id: 'alertes',
    triggers: ['alerte', 'alertes', 'a faire', 'urgent', 'que dois je faire', 'rappel', 'rappels'],
  },
  {
    id: 'ruchers',
    triggers: [
      'rucher',
      'ruchers',
      'combien de ruches',
      'combien de ruchers',
      'nombre de ruches',
      'mon cheptel',
      'cheptel',
    ],
  },
  {
    id: 'interventions',
    triggers: [
      'intervention',
      'interventions',
      'derniere intervention',
      'qu ai je fait',
      'historique',
      'derniers actes',
      'recap',
    ],
  },
];

function detecterIntent(norm: string): IntentId | null {
  for (const intent of INTENTS) {
    if (intent.triggers.some((t) => norm.includes(t))) return intent.id;
  }
  return null;
}

// ─── Extraction d'entités ────────────────────────────────────────────────────

function extraireAnnee(norm: string): number | undefined {
  const m = norm.match(/\b(20\d{2})\b/);
  if (m) return Number(m[1]);
  if (/\bderniere annee\b|\ban dernier\b|\bannee derniere\b/.test(norm))
    return new Date().getFullYear() - 1;
  return undefined;
}

/** Cherche un nom de rucher de l'utilisateur cité dans la question */
function extraireRucher(norm: string, nomsRuchers: string[]): string | undefined {
  for (const nom of nomsRuchers) {
    if (normaliser(nom).length >= 3 && norm.includes(normaliser(nom))) return nom;
  }
  return undefined;
}

// ─── Mise en forme française ─────────────────────────────────────────────────

function dateFr(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function euros(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function pluriel(n: number, sing: string, plur: string): string {
  return n > 1 ? plur : sing;
}

const VISITE_SEUIL_JOURS = 21;

function rendreRuchesVisiter(ruches: RucheSante[]): string {
  const actives = ruches.filter((r) => r.statut === 'active');
  if (actives.length === 0)
    return "Vous n'avez pas encore de ruche active enregistrée. Ajoutez vos ruches depuis le module **Ruches** pour que je puisse vous aider à planifier les visites.";

  const aVisiter = actives
    .filter((r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= VISITE_SEUIL_JOURS)
    .sort((a, b) => (b.joursDepuisVisite ?? 9999) - (a.joursDepuisVisite ?? 9999));

  if (aVisiter.length === 0)
    return `Bonne nouvelle : **toutes vos ${actives.length} ruches actives ont été visitées il y a moins de ${VISITE_SEUIL_JOURS} jours.** Rien d'urgent côté visites.`;

  const lignes = aVisiter
    .slice(0, 8)
    .map((r) => {
      const delai =
        r.joursDepuisVisite == null
          ? 'jamais visitée'
          : `${r.joursDepuisVisite} j (dernière le ${dateFr(r.derniereVisite)})`;
      return `- **Ruche ${r.numero}** (${r.rucher}) — ${delai}`;
    })
    .join('\n');

  const reste = aVisiter.length > 8 ? `\n\n…et ${aVisiter.length - 8} autre(s).` : '';
  return `**${aVisiter.length} ${pluriel(aVisiter.length, 'ruche', 'ruches')} à visiter en priorité** (plus de ${VISITE_SEUIL_JOURS} jours sans contrôle), de la plus urgente à la moins urgente :\n\n${lignes}${reste}`;
}

function rendreSante(ruches: RucheSante[]): string {
  const actives = ruches.filter((r) => r.statut === 'active');
  if (actives.length === 0)
    return 'Aucune ruche active enregistrée pour le moment. Dès que vous saisirez vos visites de contrôle, je pourrai calculer un score de santé par colonie.';

  const avecScore = actives.filter((r) => r.derniereVisite != null);
  const moyenne = avecScore.length
    ? Math.round(avecScore.reduce((s, r) => s + r.scoreSante, 0) / avecScore.length)
    : null;
  const critiques = actives.filter((r) => r.derniereVisite != null && r.scoreSante < 40);
  const maladies = actives.filter((r) => r.maladieObservee);

  let txt = `**Point santé de vos ${actives.length} ruches actives**\n\n`;
  txt += moyenne != null ? `- Score de santé moyen : **${moyenne}/100**\n` : '';
  txt += `- ${avecScore.length} ${pluriel(avecScore.length, 'ruche évaluée', 'ruches évaluées')} (avec au moins une visite de contrôle)\n`;

  if (critiques.length) {
    const liste = critiques
      .slice(0, 6)
      .map(
        (r) =>
          `**${r.numero}** (${r.scoreSante}/100${r.maladieObservee ? `, ${r.maladieObservee}` : ''})`,
      )
      .join(', ');
    txt += `\n⚠️ **${critiques.length} ${pluriel(critiques.length, 'colonie', 'colonies')} sous surveillance** (score < 40) : ${liste}. Une visite rapprochée est recommandée.`;
  } else if (avecScore.length) {
    txt += `\n✅ Aucune colonie en zone critique. Continuez le suivi régulier.`;
  }
  if (maladies.length)
    txt += `\n\n🩺 ${maladies.length} ${pluriel(maladies.length, 'ruche présente', 'ruches présentent')} une observation sanitaire à surveiller — en cas de doute, rapprochez-vous d'un vétérinaire ou agent sanitaire.`;
  return txt;
}

function rendreStocks(stocks: Awaited<ReturnType<typeof getStocks>>): string {
  if (stocks.length === 0)
    return "Aucun article en stock pour l'instant. Le module **Stocks** vous permet de suivre miel, matériel, nourrissement et traitements, avec des seuils d'alerte.";
  const bas = stocks.filter((s) => s.sousLeSeuil);
  if (bas.length === 0)
    return `Vos **${stocks.length} ${pluriel(stocks.length, 'article', 'articles')}** en stock sont au-dessus de leurs seuils d'alerte. Rien à réapprovisionner dans l'immédiat. ✅`;
  const lignes = bas
    .slice(0, 10)
    .map(
      (s) =>
        `- **${s.nom}** : ${s.quantite ?? 0} ${s.unite ?? ''} (seuil : ${s.seuilAlerte} ${s.unite ?? ''})`,
    )
    .join('\n');
  return `⚠️ **${bas.length} ${pluriel(bas.length, 'article est', 'articles sont')} sous le seuil d'alerte** :\n\n${lignes}\n\nPensez à réapprovisionner avant d'en manquer.`;
}

function rendreFinances(f: Awaited<ReturnType<typeof getFinances>>): string {
  let txt = `**Bilan financier ${f.annee}**\n\n`;
  txt += `- Chiffre d'affaires (ventes) : **${euros(f.caVentesEuros)}** sur ${f.nbVentes} ${pluriel(f.nbVentes, 'facture', 'factures')}\n`;
  txt += `- Production de miel récoltée : **${f.productionMielKg.toLocaleString('fr-FR')} kg**\n`;
  if (f.facturesEnRetard > 0)
    txt += `\n⚠️ **${f.facturesEnRetard} ${pluriel(f.facturesEnRetard, 'facture impayée', 'factures impayées')}** en retard, pour **${euros(f.montantImpayeEuros)}**. Pensez à relancer depuis le module Finances.`;
  else txt += `\n✅ Aucune facture en retard de paiement.`;
  if (f.caVentesEuros === 0 && f.nbVentes === 0)
    txt += `\n\n_(Aucune vente enregistrée pour ${f.annee} — saisissez vos ventes dans Finances pour suivre votre chiffre d'affaires.)_`;
  return txt;
}

function rendreMeteo(res: MeteoResultat | { erreur: string }): string {
  if ('erreur' in res) {
    if (res.erreur === 'aucun_rucher')
      return "Je n'ai pas trouvé de rucher à analyser. Ajoutez un rucher avec ses coordonnées GPS pour obtenir la météo et les conditions de visite.";
    return "Ce rucher n'a pas de coordonnées GPS enregistrées : je ne peux pas récupérer la météo. Ajoutez sa latitude/longitude dans sa fiche.";
  }
  const lignes = res.previsions
    .slice(0, 5)
    .map((j) => {
      const icone = j.scoreVisite >= 70 ? '🟢' : j.scoreVisite >= 45 ? '🟡' : '🔴';
      return `- ${icone} **${dateFr(j.date)}** : ${j.conditions}, ${Math.round(j.tempMax)}°C, vent ${Math.round(j.ventMaxKmh)} km/h, pluie ${j.pluieMm} mm — visite ${j.scoreVisite}/100`;
    })
    .join('\n');
  const meilleur = [...res.previsions].sort((a, b) => b.scoreVisite - a.scoreVisite)[0];
  const conseil =
    meilleur && meilleur.scoreVisite >= 60
      ? `\n\n💡 Meilleure fenêtre pour ouvrir les ruches : **${dateFr(meilleur.date)}** (score ${meilleur.scoreVisite}/100).`
      : `\n\n💡 Conditions moyennes sur la période — privilégiez les créneaux les plus doux et secs, et évitez d'ouvrir par vent fort ou pluie.`;
  return `**Conditions de visite — rucher ${res.rucher}** (5 jours)\n\n${lignes}${conseil}`;
}

function rendreAlertes(alertes: Awaited<ReturnType<typeof getAlertes>>): string {
  if (alertes.length === 0)
    return "Vous n'avez **aucune alerte active** en ce moment. Tout est à jour ! ✅";
  const parPrio = (p: string | null) => (p === 'critique' ? 0 : p === 'haute' ? 1 : 2);
  const triees = [...alertes].sort((a, b) => parPrio(a.priorite) - parPrio(b.priorite));
  const lignes = triees
    .slice(0, 10)
    .map((a) => {
      const badge = a.priorite === 'critique' ? '🔴' : a.priorite === 'haute' ? '🟠' : '🟡';
      return `- ${badge} **${a.titre}**${a.message ? ` — ${a.message}` : ''}`;
    })
    .join('\n');
  return `Vous avez **${alertes.length} ${pluriel(alertes.length, 'alerte active', 'alertes actives')}**, par priorité :\n\n${lignes}`;
}

function rendreRuchers(ruchers: Awaited<ReturnType<typeof getRuchers>>): string {
  if (ruchers.length === 0)
    return "Vous n'avez pas encore de rucher enregistré. Créez votre premier rucher pour commencer à suivre vos colonies.";
  const total = ruchers.reduce((s, r) => s + r.nbRuchesActives, 0);
  const lignes = ruchers
    .map(
      (r) =>
        `- **${r.nom}**${r.commune ? ` (${r.commune})` : ''} : ${r.nbRuchesActives} ${pluriel(r.nbRuchesActives, 'ruche active', 'ruches actives')}`,
    )
    .join('\n');
  return `Vous gérez **${total} ${pluriel(total, 'ruche active', 'ruches actives')}** réparties sur **${ruchers.length} ${pluriel(ruchers.length, 'rucher', 'ruchers')}** :\n\n${lignes}`;
}

function rendreInterventions(items: Awaited<ReturnType<typeof getInterventionsRecentes>>): string {
  if (items.length === 0)
    return "Aucune intervention enregistrée pour l'instant. Chaque visite, traitement ou récolte saisi alimente votre registre et le suivi de vos colonies.";
  const lignes = items
    .slice(0, 10)
    .map(
      (i) =>
        `- **${dateFr(i.date)}** — ${i.type ?? 'intervention'}${i.ruche ? ` (ruche ${i.ruche})` : ''}`,
    )
    .join('\n');
  return `Vos **${items.length} dernières interventions** :\n\n${lignes}`;
}

// ─── Salutations & méta ──────────────────────────────────────────────────────

function estSalutation(norm: string): boolean {
  return /^(bonjour|salut|coucou|hello|bonsoir|hey|yo|merci|au revoir|bonne journee)\b/.test(norm);
}

const APERCU_CAPACITES =
  "Je suis le **Copilote APIGO**. Je peux :\n\n- 📋 **agir sur vos données** : ruches à visiter, point santé, stocks bas, finances, météo de vos ruchers, alertes ;\n- 📚 **répondre à vos questions d'apiculture** : biologie de l'abeille, conduite du rucher, varroa et maladies, réglementation (déclaration, registre), produits de la ruche, calendrier apicole.\n\nPosez votre question simplement, en une phrase.";

// ─── Recherche dans la base de savoir ────────────────────────────────────────

interface MatchSavoir {
  article: ArticleSavoir;
  score: number;
}

/** Racine grossière : retire le s/x final des mots ≥ 4 lettres (varroas→varroa, hausses→hausse) */
function racine(mot: string): string {
  return mot.length >= 4 ? mot.replace(/[sx]$/, '') : mot;
}

function chercherSavoir(norm: string): MatchSavoir | null {
  const tousMots = norm.split(' ').filter(Boolean).map(racine);
  const motsForts = new Set(tousMots.filter((m) => m.length >= 3));
  const tousSet = new Set(tousMots);
  let best: MatchSavoir | null = null;

  for (const article of SAVOIR) {
    let score = 0;
    for (const cle of article.motsCles) {
      const tokens = normaliser(cle).split(' ').filter(Boolean).map(racine);
      if (tokens.length > 1) {
        // Expression : match si TOUS ses mots sont présents (ordre/position
        // libres) — plus robuste que le substring (« déclarer MES ruches »).
        if (tokens.every((t) => tousSet.has(t))) score += 4;
      } else if (tokens[0] && motsForts.has(tokens[0])) {
        // Mot-clé seul : déjà spécifique (varroa, essaimage…) → poids suffisant
        score += 3;
      }
    }
    // Bonus léger si des mots du titre apparaissent (plafonné)
    let bonusTitre = 0;
    for (const motTitre of normaliser(article.titre).split(' ').map(racine)) {
      if (motTitre.length >= 4 && motsForts.has(motTitre)) bonusTitre += 1;
    }
    score += Math.min(bonusTitre, 2);

    if (score > 0 && (!best || score > best.score)) best = { article, score };
  }
  // Seuil : un mot-clé spécifique seul, une expression, ou un faisceau d'indices
  return best && best.score >= 3 ? best : null;
}

// ─── Classification (pure, sans accès base) ──────────────────────────────────

export type Classification =
  | { kind: 'salutation' }
  | { kind: 'action'; intent: IntentId }
  | { kind: 'savoir'; articleId: string }
  | { kind: 'inconnu' };

/**
 * Décide quoi faire d'une question, SANS toucher la base — testable et
 * réutilisable. La priorité : salutation courte → action → savoir → repli.
 */
export function classifier(question: string): Classification {
  const norm = normaliser(question);

  if (estSalutation(norm) && norm.split(' ').length <= 3) return { kind: 'salutation' };

  const intent = detecterIntent(norm);
  if (intent) return { kind: 'action', intent };

  const savoir = chercherSavoir(norm);
  if (savoir) return { kind: 'savoir', articleId: savoir.article.id };

  return { kind: 'inconnu' };
}

// ─── Pipeline principal ──────────────────────────────────────────────────────

export async function repondreLocal(userId: string, question: string): Promise<CopiloteReponse> {
  const décision = classifier(question);

  switch (décision.kind) {
    case 'salutation':
      return { texte: APERCU_CAPACITES, manque: false };

    case 'action':
      return executerIntent(userId, décision.intent, normaliser(question));

    case 'savoir': {
      const article = SAVOIR.find((a) => a.id === décision.articleId)!;
      return {
        texte: article.contenu,
        source: '📚 Base de connaissances apicole',
        suggestions: article.voirAussi,
        manque: false,
      };
    }

    case 'inconnu':
      return {
        texte: `Je n'ai pas bien saisi votre demande. ${APERCU_CAPACITES}`,
        suggestions: SUGGESTIONS_FALLBACK,
        manque: true,
      };
  }
}

async function executerIntent(
  userId: string,
  intent: IntentId,
  norm: string,
): Promise<CopiloteReponse> {
  switch (intent) {
    case 'ruches_visiter': {
      const ruches = await getRuchesSante(userId);
      return {
        texte: rendreRuchesVisiter(ruches),
        source: '🐝 Vos ruches',
        suggestions: ['Fais-moi un point santé', 'La météo est-elle favorable ?'],
        manque: false,
      };
    }
    case 'sante': {
      const ruches = await getRuchesSante(userId);
      return {
        texte: rendreSante(ruches),
        source: '🐝 Vos ruches',
        suggestions: ['Quelles ruches visiter en priorité ?', 'Comment traiter le varroa ?'],
        manque: false,
      };
    }
    case 'stocks': {
      return {
        texte: rendreStocks(await getStocks(userId)),
        source: '📦 Vos stocks',
        manque: false,
      };
    }
    case 'finances': {
      const annee = extraireAnnee(norm);
      return {
        texte: rendreFinances(await getFinances(userId, annee)),
        source: '💶 Vos finances',
        manque: false,
      };
    }
    case 'meteo': {
      const ruchers = await getRuchers(userId);
      const rucherNom = extraireRucher(
        norm,
        ruchers.map((r) => r.nom),
      );
      return {
        texte: rendreMeteo(await getMeteoRucher(userId, rucherNom)),
        source: '🌤️ Météo',
        manque: false,
      };
    }
    case 'alertes': {
      return {
        texte: rendreAlertes(await getAlertes(userId)),
        source: '🔔 Vos alertes',
        manque: false,
      };
    }
    case 'ruchers': {
      return {
        texte: rendreRuchers(await getRuchers(userId)),
        source: '📍 Vos ruchers',
        manque: false,
      };
    }
    case 'interventions': {
      return {
        texte: rendreInterventions(await getInterventionsRecentes(userId)),
        source: '📝 Vos interventions',
        manque: false,
      };
    }
  }
}
