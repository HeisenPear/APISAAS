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
import {
  analyserIntervention,
  detecterNavigation,
  estActionEcriture,
  extraireRucheSeule,
  previsualiserIntervention,
  type InterventionParsee,
  type NavigationCible,
} from '~~/server/utils/copilote-actions';

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
  /** Raccourci proposé (deep-link) — le Copilote ouvre la bonne page du SaaS. */
  navigation?: { label: string; to: string };
  /** Action d'écriture à confirmer avant exécution (jamais d'écriture aveugle). */
  confirmation?: { actionId: 'intervention'; params: Record<string, unknown> };
}

// ─── Normalisation ───────────────────────────────────────────────────────────

export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents (combining marks)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// \u2500\u2500\u2500 Nombres en toutes lettres \u2192 chiffres (pr\u00eat pour la saisie vocale) \u2500\u2500\u2500\u2500\u2500\u2500\u2500

const MOT_NOMBRE: Record<string, number> = {
  zero: 0,
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  vingts: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  cent: 100,
  cents: 100,
  mille: 1000,
};

/** Lit un nombre fran\u00e7ais \u00e0 partir de `tokens[start]` ; renvoie sa valeur et sa longueur. */
function lireNombre(tokens: string[], start: number): { value: number; len: number } {
  let i = start;
  let total = 0;
  let current = 0;
  let vu = false;
  while (i < tokens.length) {
    const t = tokens[i] ?? '';
    if (t === 'et') {
      const suivant = tokens[i + 1] ?? '';
      if (vu && (MOT_NOMBRE[suivant] !== undefined || suivant === 'quatre')) {
        i++;
        continue;
      }
      break;
    }
    // \u00ab quatre-vingt(s) \u00bb = 80 (et non 4 + 20)
    if (t === 'quatre' && (tokens[i + 1] === 'vingt' || tokens[i + 1] === 'vingts')) {
      current += 80;
      i += 2;
      vu = true;
      continue;
    }
    const v = MOT_NOMBRE[t];
    if (v === undefined) break;
    if (v === 100) {
      current = (current || 1) * 100;
      vu = true;
    } else if (v === 1000) {
      total += (current || 1) * 1000;
      current = 0;
      vu = true;
    } else {
      current += v;
      vu = true;
    }
    i++;
  }
  return vu ? { value: total + current, len: i - start } : { value: 0, len: 0 };
}

/**
 * Remplace les nombres \u00e9crits en toutes lettres par des chiffres
 * (\u00ab ruche douze \u00bb \u2192 \u00ab ruche 12 \u00bb, \u00ab quatre-vingt-douze \u00bb \u2192 \u00ab 92 \u00bb). Appliqu\u00e9
 * dans les chemins d'ACTION (extraction de ruche, d'ann\u00e9e), pas dans la
 * recherche de savoir, pour ne pas transformer les articles \u00ab un / une \u00bb.
 */
export function convertirNombres(s: string): string {
  const tokens = s.split(' ').filter(Boolean);
  const out: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const { value, len } = lireNombre(tokens, i);
    if (len > 0) {
      out.push(String(value));
      i += len;
    } else {
      out.push(tokens[i] ?? '');
      i++;
    }
  }
  return out.join(' ');
}

// \u2500\u2500\u2500 Synonymes (robustesse C1) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Synonymes question \u2192 forme \u00ab canonique \u00bb utilis\u00e9e dans les mots-cl\u00e9s.
 * Appliqu\u00e9 mot \u00e0 mot sur la question normalis\u00e9e (jamais sur les mots-cl\u00e9s).
 * Volontairement conservateur : chaque entr\u00e9e renvoie vers un terme r\u00e9ellement
 * pr\u00e9sent dans les triggers/mots-cl\u00e9s, sans risque de capter du hors-sujet
 * (cf. test \u00ab capitale du P\u00e9rou \u00bb \u2192 inconnu).
 */
const SYNONYMES: Record<string, string> = {
  // Soin / traitement
  soigner: 'traiter',
  soigne: 'traiter',
  soin: 'traitement',
  medicament: 'traitement',
  medicaments: 'traitement',
  medoc: 'traitement',
  medocs: 'traitement',
  remede: 'traitement',
  traiter: 'traiter',
  // Commercialisation
  commercialiser: 'vendre',
  ecouler: 'vendre',
  revendre: 'vendre',
  // M\u00e9t\u00e9o
  climat: 'meteo',
  meteorologie: 'meteo',
  previsions: 'meteo',
  prevision: 'meteo',
  // Finances
  revenu: 'finances',
  revenus: 'finances',
  benefice: 'finances',
  benefices: 'finances',
  argent: 'finances',
  gain: 'finances',
  gains: 'finances',
  tresorerie: 'finances',
  rentabilite: 'finances',
  // Mortalit\u00e9 / pertes
  crever: 'mortalite',
  crevent: 'mortalite',
  morte: 'mortalite',
  mortes: 'mortalite',
  deces: 'mortalite',
  // Divers vocabulaire
  acarien: 'varroa',
  acariens: 'varroa',
  varroas: 'varroa',
  predateur: 'frelon',
  predateurs: 'frelon',
  hivernent: 'hivernage',
  hiverner: 'hivernage',
  butineuse: 'ouvriere',
  butineuses: 'ouvriere',
  nourrir: 'nourrissement',
};

/**
 * Expressions courantes \u2192 forme canonique, appliqu\u00e9es AVANT le dictionnaire de
 * mots. Permet de mapper des tournures famili\u00e8res/vocales sur le vocabulaire des
 * fiches (\u00ab mouches \u00e0 miel \u00bb \u2192 \u00ab abeille \u00bb, \u00ab combien je gagne \u00bb \u2192 \u00ab finances \u00bb).
 */
const SYNONYMES_PHRASES: Array<[RegExp, string]> = [
  [/\bmouches? a miel\b/g, 'abeille'],
  [/\bdonner a manger\b/g, 'nourrissement'],
  [/\bgagner de l argent\b/g, 'finances'],
  [/\bcombien je gagne\b/g, 'finances'],
  [/\bchiffre d affaires?\b/g, 'finances'],
  [/\bfaux bourdon\b/g, 'male'],
  [/\babeilles? mortes?\b/g, 'mortalite'],
  [/\bperte de colonie\b/g, 'mortalite'],
  [/\bmettre une hausse\b/g, 'hausse'],
  [/\bquel temps\b/g, 'meteo'],
];

/** Remplace expressions puis mots par leur forme canonique. */
function appliquerSynonymes(norm: string): string {
  let s = norm;
  for (const [re, rep] of SYNONYMES_PHRASES) s = s.replace(re, rep);
  return s
    .split(' ')
    .map((mot) => SYNONYMES[mot] ?? mot)
    .join(' ');
}

// \u2500\u2500\u2500 Tol\u00e9rance aux fautes de frappe \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * true si la distance d'\u00e9dition entre `a` et `b` est \u2264 1 (insertion,
 * suppression ou substitution). Court-circuite d\u00e8s la 2\u1d49 divergence \u2014 s\u00fbr et
 * rapide. R\u00e9serv\u00e9 aux mots longs (\u2265 5 lettres) c\u00f4t\u00e9 appelant pour \u00e9viter les
 * faux positifs sur les mots courts.
 */
function distanceMax1(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
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

/**
 * Vrai si le trigger `t` apparaît dans `norm` **aligné sur un début de mot**.
 * Évite les faux positifs en plein mot (« vent » ⊂ « interventions ») tout en
 * tolérant les flexions en suffixe (« stock » → « stocks », « alerte » →
 * « alertes »). Sans regex pour rester rapide et sûr.
 */
export function contientTrigger(norm: string, t: string): boolean {
  let from = 0;
  for (;;) {
    const idx = norm.indexOf(t, from);
    if (idx < 0) return false;
    if (idx === 0 || norm[idx - 1] === ' ') return true;
    from = idx + 1;
  }
}

function detecterIntent(norm: string): IntentId | null {
  for (const intent of INTENTS) {
    if (intent.triggers.some((t) => contientTrigger(norm, t))) return intent.id;
  }
  return null;
}

// ─── Extraction d'entités ────────────────────────────────────────────────────

function extraireAnnee(norm: string): number | undefined {
  const conv = convertirNombres(norm); // « deux mille vingt-quatre » → « 2024 »
  const m = conv.match(/\b(20\d{2})\b/);
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

// ─── Contextualisation du savoir (C2) ────────────────────────────────────────

/** Conseil saisonnier par mois (index 0 = janvier) — pur, sans accès base. */
const CONSEILS_MOIS: string[] = [
  'cœur de l’hiver : colonies en grappe, surveillez le poids des ruches et traitez le varroa hors couvain ; n’ouvrez pas par grand froid.',
  'fin d’hiver : premières sorties par beau temps, vérifiez les réserves et préparez votre matériel.',
  'reprise de printemps : c’est la période de la visite de printemps — contrôlez la ponte et le niveau des réserves.',
  'pleine reprise : surveillez l’essaimage et posez les premières hausses (colza, fruitiers).',
  'mois de l’essaimage : visites rapprochées, pose des hausses, miellée d’acacia.',
  'pleine saison : gestion des hausses, miellées d’été, vigilance sur l’essaimage.',
  'récoltes d’été : tilleul, châtaignier, tournesol — récoltez le miel mûr et operculé.',
  'fin des miellées : dernière récolte puis traitement varroa ; la pression du frelon monte.',
  'préparation de l’hivernage : traitement varroa, complément de réserves, et déclaration annuelle des ruches.',
  'mise en hivernage : réduction des entrées, dernières réserves, vigilance frelon.',
  'entrée d’hiver : colonies au repos, surveillance à distance, entretien du matériel.',
  'hiver : repos des colonies, traitement à l’acide oxalique hors couvain, préparation de la saison à venir.',
];

/** Note datée injectée en tête des fiches saisonnières. */
function contexteSaison(maintenant = new Date()): string {
  const mois = maintenant.toLocaleDateString('fr-FR', { month: 'long' });
  return `💡 _Nous sommes en ${mois} — ${CONSEILS_MOIS[maintenant.getMonth()]}_\n\n`;
}

/** Rappel du cheptel actif, injecté en tête des fiches liées aux ruches. */
async function contexteRuches(userId: string): Promise<string> {
  try {
    const ruches = await getRuchesSante(userId);
    const actives = ruches.filter((r) => r.statut === 'active').length;
    if (actives === 0) return '';
    return `🐝 _Pour votre exploitation : vous suivez actuellement **${actives}** ${pluriel(actives, 'ruche active', 'ruches actives')}._\n\n`;
  } catch {
    // La contextualisation est un bonus : son échec ne doit jamais priver
    // l'utilisateur de la fiche de savoir demandée.
    return '';
  }
}

// ─── Salutations & méta ──────────────────────────────────────────────────────

function estSalutation(norm: string): boolean {
  return /^(bonjour|salut|coucou|hello|bonsoir|hey|yo|merci|merci beaucoup|au revoir|bonne journee|bonne soiree|a bientot|bonne nuit)\b/.test(
    norm,
  );
}

/** Question « méta » sur le Copilote lui-même (que sais-tu faire, qui es-tu…). */
function estCapacites(norm: string): boolean {
  return (
    /\b(que (peux|sais)[ -]?tu faire|tu peux faire quoi|a quoi (tu sers|sers tu|sert (le|ce) copilote)|tu sers a quoi|qui es[ -]?tu|comment ca marche|comment tu fonctionnes|tes capacites|tu fais quoi)\b/.test(
      norm,
    ) || /^(aide|help|capacites|menu|options)$/.test(norm)
  );
}

const APERCU_CAPACITES =
  "Je suis le **Copilote APIGO**. Je peux :\n\n- 📋 **agir sur vos données** : ruches à visiter, point santé, stocks bas, finances, météo de vos ruchers, alertes ;\n- 📚 **répondre à vos questions d'apiculture** : biologie de l'abeille, conduite du rucher, varroa et maladies, réglementation (déclaration, registre), produits de la ruche, calendrier apicole.\n\nPosez votre question simplement, en une phrase.";

/** Réponse de courtoisie adaptée au type de salutation détecté. */
function reponseSalutation(norm: string): string {
  if (/^merci/.test(norm))
    return 'Avec plaisir ! 🐝 Je reste à votre disposition pour vos ruches comme pour vos questions d’apiculture.';
  if (/^(au revoir|bonne journee|bonne soiree|a bientot|bonne nuit)/.test(norm))
    return 'Belle journée au rucher ! 🐝 À bientôt sur APIGO.';
  return `Bonjour 👋\n\n${APERCU_CAPACITES}`;
}

// ─── Recherche dans la base de savoir ────────────────────────────────────────

interface MatchSavoir {
  article: ArticleSavoir;
  score: number;
}

/** Racine grossière : retire le s/x final des mots ≥ 4 lettres (varroas→varroa, hausses→hausse) */
function racine(mot: string): string {
  return mot.length >= 4 ? mot.replace(/[sx]$/, '') : mot;
}

/** Seuil de score à partir duquel une fiche est jugée pertinente. */
const SEUIL_SAVOIR = 3;

/**
 * Score toutes les fiches pour une question normalisée et renvoie la liste
 * triée par pertinence décroissante (score > 0 uniquement). Expose les scores
 * pour permettre la désambiguïsation (cf. `clarifier`).
 */
function rechercherArticles(norm: string): MatchSavoir[] {
  const tousMots = norm.split(' ').filter(Boolean).map(racine);
  const motsForts = new Set(tousMots.filter((m) => m.length >= 3));
  const tousSet = new Set(tousMots);
  // Mots longs de la question, candidats à un rapprochement « tolérant aux
  // fautes de frappe » avec un mot-clé long (varoa → varroa).
  const motsLongs = tousMots.filter((m) => m.length >= 5);
  const matches: MatchSavoir[] = [];

  for (const article of SAVOIR) {
    let score = 0;
    for (const cle of article.motsCles) {
      const tokens = normaliser(cle).split(' ').filter(Boolean).map(racine);
      if (tokens.length > 1) {
        // Expression : match si TOUS ses mots sont présents (ordre/position
        // libres) — plus robuste que le substring (« déclarer MES ruches »).
        if (tokens.every((t) => tousSet.has(t))) score += 4;
      } else if (tokens[0]) {
        const cle0 = tokens[0];
        if (motsForts.has(cle0)) {
          // Mot-clé seul : déjà spécifique (varroa, essaimage…) → poids suffisant
          score += 3;
        } else if (cle0.length >= 5 && motsLongs.some((m) => distanceMax1(m, cle0))) {
          // Tolérance fautes de frappe sur mots-clés longs (varoa → varroa)
          score += 3;
        }
      }
    }
    // Bonus léger si des mots du titre apparaissent (plafonné)
    let bonusTitre = 0;
    for (const motTitre of normaliser(article.titre).split(' ').map(racine)) {
      if (motTitre.length >= 4 && motsForts.has(motTitre)) bonusTitre += 1;
    }
    score += Math.min(bonusTitre, 2);

    if (score > 0) matches.push({ article, score });
  }
  return matches.sort((a, b) => b.score - a.score);
}

function chercherSavoir(norm: string): MatchSavoir | null {
  const best = rechercherArticles(norm)[0];
  // Seuil : un mot-clé spécifique seul, une expression, ou un faisceau d'indices
  return best && best.score >= SEUIL_SAVOIR ? best : null;
}

/**
 * Désambiguïsation : si les deux meilleures fiches sont à **égalité stricte**
 * de score (et au-dessus du seuil), le moteur ne devine pas — il propose les
 * deux pistes. Conservateur par construction (les égalités sont rares, le bonus
 * de titre les départage le plus souvent), donc sans gêne sur le flux normal.
 */
function clarifier(norm: string): { titres: [string, string] } | null {
  const tops = rechercherArticles(norm);
  const a = tops[0];
  const b = tops[1];
  if (a && b && a.score >= SEUIL_SAVOIR && a.score === b.score && a.article.id !== b.article.id) {
    return { titres: [a.article.titre, b.article.titre] };
  }
  return null;
}

// ─── Classification (pure, sans accès base) ──────────────────────────────────

export type Classification =
  | { kind: 'salutation' }
  | { kind: 'capacites' }
  | { kind: 'action'; intent: IntentId }
  | { kind: 'savoir'; articleId: string }
  | { kind: 'inconnu' };

/**
 * Décide quoi faire d'une question isolée, SANS toucher la base — testable et
 * réutilisable. Priorité : salutation courte → capacités → action → savoir →
 * repli. Brique de base du moteur de conversation (cf. `classifierTour`).
 */
export function classifier(question: string): Classification {
  const brut = normaliser(question);
  // La salutation se juge sur la forme brute (avant synonymes) : « bonjour »,
  // « merci »… ne doivent pas être réécrits.
  if (estSalutation(brut) && brut.split(' ').length <= 3) return { kind: 'salutation' };
  if (estCapacites(brut)) return { kind: 'capacites' };

  // Synonymes appliqués pour la détection d'intention et la recherche de savoir.
  const norm = appliquerSynonymes(brut);

  const intent = detecterIntent(norm);
  if (intent) return { kind: 'action', intent };

  const savoir = chercherSavoir(norm);
  if (savoir) return { kind: 'savoir', articleId: savoir.article.id };

  return { kind: 'inconnu' };
}

// ─── Couche conversation (mémoire courte + désambiguïsation) ──────────────────

export interface MessageTour {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Décision d'un tour de conversation. Étend `Classification` avec :
 * - `capacites` (déjà dans Classification),
 * - `suivi` sur les actions (la question reprend l'intention du tour précédent),
 * - `clarification` (deux fiches à égalité → on demande de préciser).
 */
export type DecisionTour =
  | { kind: 'salutation'; texteBrut: string }
  | { kind: 'capacites' }
  | { kind: 'navigation'; cible: NavigationCible }
  | { kind: 'ecriture'; parse: InterventionParsee }
  | { kind: 'action'; intent: IntentId; suivi: boolean }
  | { kind: 'savoir'; articleId: string }
  | { kind: 'clarification'; titres: [string, string] }
  | { kind: 'suggestion'; titres: string[] }
  | { kind: 'inconnu' };

/** Dernier message de l'utilisateur dans l'historique (vide si aucun). */
function dernierMessageUtilisateur(messages: MessageTour[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return (messages[i]?.content ?? '').trim();
  }
  return '';
}

/** Classification du tour utilisateur juste avant le tour courant (mémoire courte). */
function contextePrecedent(messages: MessageTour[]): Classification | null {
  const tours = messages.filter((m) => m.role === 'user');
  if (tours.length < 2) return null;
  const precedent = tours[tours.length - 2]?.content ?? '';
  return classifier(precedent);
}

/**
 * Début de question d'INFORMATION (« comment… », « pourquoi… », « combien… »).
 * Sert à ne pas confondre une question avec un ordre d'écriture/navigation.
 * Exclut volontairement « peux-tu / peut-on » (formulations polies d'un ordre).
 */
const INTERRO_INFO =
  /^(comment|pourquoi|quand|quel|quelle|quels|quelles|combien|qui|qu|que|a quoi|c est quoi|est ce|dois je|faut il|y a t il)\b/;

/**
 * Si le tour précédent était une écriture d'intervention à qui il manquait la
 * ruche, renvoie sa version parsée (pour la compléter avec la ruche du tour
 * courant — slot-filling conversationnel).
 */
function ecriturePrecedenteSansRuche(messages: MessageTour[]): InterventionParsee | null {
  const tours = messages.filter((m) => m.role === 'user');
  if (tours.length < 2) return null;
  const prev = tours[tours.length - 2]?.content ?? '';
  const prevNorm = normaliser(prev);
  if (!estActionEcriture(prevNorm)) return null;
  const parse = analyserIntervention(prevNorm, prev);
  return parse.manque.includes('ruche') ? parse : null;
}

/** Mots/marqueurs déictiques signalant un approfondissement du tour précédent. */
const SUIVI_DEICTIQUES = [
  'detaille',
  'detail',
  'explique',
  'developpe',
  'precise',
  'encore',
  'pourquoi',
  'comment',
  'ensuite',
  'apres',
  'suite',
  'pareil',
  'idem',
  'actualise',
  'rafraichis',
  'maintenant',
  'a jour',
];

/**
 * Détecte une question de **suivi elliptique** : elle n'a de sens que par
 * rapport au tour précédent (« et 2024 ? », « détaille », « actualise »).
 * N'est consultée que lorsque la question, prise isolément, est `inconnu` :
 * une vraie nouvelle intention (« et mes stocks ? ») est déjà comprise en amont.
 */
function estSuivi(brut: string): boolean {
  if (!brut) return false;
  if (/^et\b/.test(brut)) return true; // « et 2024 ? », « et pour le rucher… »
  if (/^20\d{2}\b/.test(brut)) return true; // une année seule en rebond
  const mots = brut.split(' ');
  if (mots.length <= 3 && SUIVI_DEICTIQUES.some((d) => brut.includes(d))) return true;
  return false;
}

/**
 * Compréhension d'un **tour de conversation** complet. Pur (sans accès base) :
 * réutilise `classifier` sur le tour courant, puis mobilise la mémoire courte
 * (tour précédent) pour résoudre les suivis elliptiques, et propose une
 * clarification quand deux fiches sont strictement à égalité.
 */
export function classifierTour(messages: MessageTour[]): DecisionTour {
  const question = dernierMessageUtilisateur(messages);
  const brut = normaliser(question);
  // Garde-fou d'entrée : rien d'exploitable → on présente les capacités.
  if (!brut) return { kind: 'capacites' };

  const base = classifier(question);

  if (base.kind === 'salutation') return { kind: 'salutation', texteBrut: brut };
  if (base.kind === 'capacites') return { kind: 'capacites' };

  // Une question d'information (« comment… », « pourquoi… », « … ? ») n'est pas
  // un ordre : on n'écrit pas et on ne navigue pas dessus.
  const infoQuestion = INTERRO_INFO.test(brut);
  const estQuestion = infoQuestion || question.includes('?');

  // Actions explicites (écrire, naviguer) AVANT les intentions de lecture :
  // « note une intervention… » ne doit pas être lu comme « mes interventions ».
  if (!infoQuestion && estActionEcriture(brut, estQuestion))
    return { kind: 'ecriture', parse: analyserIntervention(brut, question) };
  if (!infoQuestion) {
    const cible = detecterNavigation(brut);
    if (cible) return { kind: 'navigation', cible };
  }

  if (base.kind === 'action') return { kind: 'action', intent: base.intent, suivi: false };
  if (base.kind === 'savoir') {
    const clar = clarifier(appliquerSynonymes(brut));
    if (clar) return { kind: 'clarification', titres: clar.titres };
    return { kind: 'savoir', articleId: base.articleId };
  }

  // base.kind === 'inconnu'
  // 1) Slot-filling : « la 12 » en réponse à une écriture où il manquait la ruche.
  const rucheSeule = extraireRucheSeule(brut);
  if (rucheSeule) {
    const prevWrite = ecriturePrecedenteSansRuche(messages);
    if (prevWrite) {
      prevWrite.rucheNumero = rucheSeule;
      prevWrite.manque = prevWrite.manque.filter((x) => x !== 'ruche');
      return { kind: 'ecriture', parse: prevWrite };
    }
  }
  // 2) Reprise du contexte précédent (suivi elliptique : « et 2024 ? »).
  if (estSuivi(brut)) {
    const prec = contextePrecedent(messages);
    if (prec?.kind === 'action') return { kind: 'action', intent: prec.intent, suivi: true };
    if (prec?.kind === 'savoir') return { kind: 'savoir', articleId: prec.articleId };
  }
  // 3) Near-miss : plutôt qu'un échec sec, proposer les fiches les plus proches
  //    (≥ 2 points : un indice sérieux, mais sous le seuil de réponse directe).
  const proches = rechercherArticles(appliquerSynonymes(brut))
    .filter((m) => m.score >= 2)
    .slice(0, 3)
    .map((m) => m.article.titre);
  if (proches.length) return { kind: 'suggestion', titres: proches };

  return { kind: 'inconnu' };
}

// ─── Pipeline principal ──────────────────────────────────────────────────────

/**
 * Point d'entrée du moteur local en mode **conversation** : reçoit tout
 * l'historique, en tire une décision (avec mémoire courte) et produit la
 * réponse. Ne jette jamais : toute défaillance retombe sur un repli lisible.
 */
export async function repondreConversation(
  userId: string,
  messages: MessageTour[],
): Promise<CopiloteReponse> {
  try {
    const decision = classifierTour(messages);
    const norm = appliquerSynonymes(normaliser(dernierMessageUtilisateur(messages)));

    switch (decision.kind) {
      case 'salutation':
        return { texte: reponseSalutation(decision.texteBrut), manque: false };

      case 'capacites':
        return { texte: APERCU_CAPACITES, suggestions: SUGGESTIONS_FALLBACK, manque: false };

      case 'navigation':
        return {
          texte: `Voici le raccourci vers **${decision.cible.label}**.`,
          navigation: { label: decision.cible.label, to: decision.cible.to },
          manque: false,
        };

      case 'ecriture': {
        const prev = await previsualiserIntervention(userId, decision.parse);
        if (prev.ok) {
          return {
            texte: prev.apercu,
            confirmation: { actionId: 'intervention', params: prev.params },
            manque: false,
          };
        }
        return { texte: prev.message, navigation: prev.navigation, manque: true };
      }

      case 'action':
        return executerIntent(userId, decision.intent, norm);

      case 'savoir':
        return rendreArticle(userId, decision.articleId);

      case 'clarification':
        return {
          texte: `Je veux être sûr de bien vous répondre. Vous parlez plutôt de :`,
          suggestions: [`${decision.titres[0]} ?`, `${decision.titres[1]} ?`],
          manque: false,
        };

      case 'suggestion':
        return {
          texte: "Je ne suis pas sûr d'avoir bien compris. Vous vouliez peut-être :",
          suggestions: decision.titres.map((t) => `${t} ?`),
          manque: true,
        };

      case 'inconnu':
        return {
          texte: `Je n'ai pas bien saisi votre demande. ${APERCU_CAPACITES}`,
          suggestions: SUGGESTIONS_FALLBACK,
          manque: true,
        };
    }
  } catch (err) {
    console.error(
      '[copilote] repondreConversation échec:',
      err instanceof Error ? err.message : err,
    );
    return {
      texte:
        'Je rencontre un souci technique momentané. Réessayez dans un instant — vos données ne sont pas affectées.',
      manque: true,
    };
  }
}

/** Compatibilité : réponse à une question isolée (un seul tour utilisateur). */
export function repondreLocal(userId: string, question: string): Promise<CopiloteReponse> {
  return repondreConversation(userId, [{ role: 'user', content: question }]);
}

/** Rendu d'une fiche de savoir, avec contextualisation optionnelle en tête. */
async function rendreArticle(userId: string, articleId: string): Promise<CopiloteReponse> {
  const article = SAVOIR.find((a) => a.id === articleId);
  if (!article) {
    // Garde-fou : id introuvable (ne devrait pas arriver) → repli propre.
    return {
      texte: `Je n'ai pas trouvé la fiche correspondante. ${APERCU_CAPACITES}`,
      suggestions: SUGGESTIONS_FALLBACK,
      manque: true,
    };
  }
  // Contextualisation optionnelle (cf. champ `contexte` des fiches) :
  // une note datée (saison) ou un rappel du cheptel, en tête de réponse.
  let prefixe = '';
  if (article.contexte === 'saison') prefixe = contexteSaison();
  else if (article.contexte === 'ruches') prefixe = await contexteRuches(userId);
  return {
    texte: prefixe + article.contenu,
    source: '📚 Base de connaissances apicole',
    suggestions: article.voirAussi,
    manque: false,
  };
}

/** Libellé du domaine d'un intent — pour un message d'erreur lisible. */
const LIBELLE_DOMAINE: Record<IntentId, string> = {
  ruches_visiter: 'vos ruches',
  sante: 'l’état de vos ruches',
  stocks: 'vos stocks',
  finances: 'vos finances',
  meteo: 'la météo',
  alertes: 'vos alertes',
  ruchers: 'vos ruchers',
  interventions: 'vos interventions',
};

/** Filtre une liste de ruches sur un rucher cité dans la question, le cas échéant. */
function scoperRuches(
  ruches: RucheSante[],
  norm: string,
): { ruches: RucheSante[]; cible?: string } {
  const noms = [...new Set(ruches.map((r) => r.rucher))];
  const cible = extraireRucher(norm, noms);
  return cible ? { ruches: ruches.filter((r) => r.rucher === cible), cible } : { ruches };
}

async function executerIntent(
  userId: string,
  intent: IntentId,
  norm: string,
): Promise<CopiloteReponse> {
  try {
    return await executerIntentInterne(userId, intent, norm);
  } catch (err) {
    // Dégradation gracieuse : un domaine en échec (pooler gelé, requête lente)
    // ne casse jamais la conversation — on le dit clairement.
    console.error(`[copilote] intent ${intent} échec:`, err instanceof Error ? err.message : err);
    return {
      texte: `Je n'ai pas pu récupérer ${LIBELLE_DOMAINE[intent]} à l'instant. Réessayez dans un moment — ce n'est qu'un souci temporaire.`,
      manque: true,
    };
  }
}

async function executerIntentInterne(
  userId: string,
  intent: IntentId,
  norm: string,
): Promise<CopiloteReponse> {
  switch (intent) {
    case 'ruches_visiter': {
      const { ruches, cible } = scoperRuches(await getRuchesSante(userId), norm);
      return {
        texte: (cible ? `_Rucher **${cible}**._\n\n` : '') + rendreRuchesVisiter(ruches),
        source: '🐝 Vos ruches',
        suggestions: ['Fais-moi un point santé', 'La météo est-elle favorable ?'],
        manque: false,
      };
    }
    case 'sante': {
      const { ruches, cible } = scoperRuches(await getRuchesSante(userId), norm);
      return {
        texte: (cible ? `_Rucher **${cible}**._\n\n` : '') + rendreSante(ruches),
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
