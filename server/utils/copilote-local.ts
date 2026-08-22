import {
  getRuchers,
  getRuchesSante,
  getInterventionsRecentes,
  getStocks,
  getFinances,
  getAlertes,
  getMeteoRucher,
  getSerie12Mois,
  getInspectionsParRuche,
  getReines,
  getBalances,
  getTranshumance,
  getClients,
  getLots,
  getSessionsGreffage,
  comparerFinances,
  type RucheSante,
  type MeteoResultat,
  type MeteoJour,
  type AlerteRow,
  type RucherRow,
  type InterventionRow,
  type InspectionsRuche,
  type ReineRow,
  type BalanceRow,
  type TranshumanceData,
  type PlanTranshumanceRow,
  type EmplacementRow,
  type ClientRow,
  type LotRow,
  type LotsData,
  type SessionGreffageRow,
  type ComparaisonFinances,
} from '~~/server/utils/copilote-data';
import { SAVOIR, SUGGESTIONS_FALLBACK, type ArticleSavoir } from '~~/server/utils/copilote-savoir';
import { corrigerTexte } from '~~/server/utils/copilote-orthographe';
import { evaluerQualiteMiel } from '~~/app/utils/qualiteMiel';
import {
  lireCriteres,
  lireCriteresNourrissement,
  lireUsageRuche,
  recommanderNourrissement,
  recommanderRuche,
  recommanderVarroacide,
  rendreRecommandation,
  rendreRecommandationNourrissement,
  rendreRecommandationRuche,
  viseNourrissement,
  viseTypeRuche,
  viseVarroacide,
  identifierProduitParMarque,
  identifierFournisseur,
  rendreFicheProduit,
  rendreFicheFournisseur,
  viseFicheProduit,
  viseFicheFournisseur,
} from '~~/server/utils/copilote-produits';
import {
  analyserClient,
  analyserRecolteProd,
  analyserStock,
  analyserIntervention,
  manqueRequisIntervention,
  detecterNavigation,
  estActionAuto,
  resoudreFluxIntervention,
  previsualiserAction,
  LIBELLES_TYPES_INTERVENTION,
  type NavigationCible,
  type ActionId,
  type Ecriture,
  type InterventionParsee,
} from '~~/server/utils/copilote-actions';
import {
  extraireCibles,
  estCommandeLotEcriture,
  libelleCible,
  type CibleRuches,
} from '~~/server/utils/copilote-cibles';
import { decouperSequence } from '~~/server/utils/copilote-splitter';
import { refusDeLecture } from '~~/server/utils/copilote-gating';
import { palierScore } from '~~/server/utils/meteo';
import { resoudreSeuils, SEUIL_MIELLEE_KG } from '~~/server/utils/balances/alertes';
import type { Plan } from '~~/app/config/plans';
import { predictSante } from '~~/server/utils/santePredictive';
import { consequencesDe, type Consequence } from '~~/server/utils/maya-consequences';
import {
  construirePlanLot,
  construirePlanSequence,
  planEnBloc,
  type PlanMaya,
  type EtapeResolue,
} from '~~/server/utils/copilote-plan';
import { resoudreCibles } from '~~/server/utils/copilote-executeur';
import { voix, gabarit, resetVoix } from '~~/server/utils/maya-voix';

/**
 * Moteur Copilote LOCAL — 100 % embarqué, zéro appel externe, zéro coût.
 *
 * Pipeline : normaliser → détecter une intention d'ACTION (interroge les
 * données du compte) → sinon chercher dans la base de SAVOIR (réponses
 * pré-rédigées) → sinon repli avec suggestions. Le tout en TypeScript pur :
 * c'est un système expert, pas un LLM — léger et instantané.
 */

/** Bloc structuré « riche » accompagnant une réponse de Maya (graphes, tableaux…). */
export type BlocMaya =
  | {
      type: 'stats';
      items: { label: string; valeur: string; ton?: 'honey' | 'sage' | 'clay' | 'neutre' }[];
    }
  | { type: 'tableau'; titre?: string; colonnes: string[]; lignes: (string | number)[][] }
  | {
      type: 'graphe';
      titre?: string;
      forme?: 'barres' | 'ligne';
      serie: { label: string; valeur: number }[];
    }
  | {
      type: 'carte';
      titre?: string;
      texte?: string;
      actions: { label: string; to: string; icone?: string }[];
    }
  | {
      /** Aperçu consolidé d'un PLAN en lot (multi-étapes) avant confirmation. */
      type: 'plan';
      titre: string;
      resume: string[];
      etapes: { libelle: string; detail?: string }[];
    };

export interface CopiloteReponse {
  /** Texte markdown de la réponse */
  texte: string;
  /** Libellé d'« activité » (donnée consultée) — affiché comme pour un outil */
  source?: string;
  /** Questions de rebond proposées à l'utilisateur */
  suggestions?: string[];
  /** true si le moteur n'a pas su répondre (utile pour l'escalade Claude) */
  manque: boolean;
  /** Raccourci proposé (deep-link) — Maya ouvre la bonne page du SaaS.
   * `auto: true` => le client navigue automatiquement (Maya « le fait »). */
  navigation?: { label: string; to: string; auto?: boolean };
  /** Action d'écriture à confirmer avant exécution (réservé au sensible). */
  confirmation?: { actionId: ActionId; params: Record<string, unknown> };
  /** PLAN en lot à confirmer (fan-out multi-ruches) — exécution transactionnelle. */
  confirmationPlan?: { plan: PlanMaya };
  /** Action réversible à exécuter DIRECTEMENT (autonomie) — la route l'exécute
   * puis propose « Annuler ». Jamais cumulée avec `confirmation`. */
  autoExecute?: { actionId: ActionId; params: Record<string, unknown> };
  /** Blocs riches (stats, tableaux, graphes) affichés sous le texte. */
  blocs?: BlocMaya[];
}

// ─── Normalisation ───────────────────────────────────────────────────────────

export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents (combining marks)
    .replace(/(\d)[.,](\d)/g, '$1.$2') // prot\u00e8ge les d\u00e9cimaux : \u00ab 1,5 \u00bb / \u00ab 1.5 \u00bb \u2192 \u00ab 1.5 \u00bb
    .replace(/[^a-z0-9.\s]/g, ' ') // on conserve le point (s\u00e9parateur d\u00e9cimal)
    .replace(/\.(?!\d)/g, ' ') // tout point NON suivi d'un chiffre = ponctuation \u2192 espace
    .replace(/([a-z])\1{2,}/g, '$1') // lettres r\u00e9p\u00e9t\u00e9es (vocal/expressif) : \u00ab merciiii \u00bb \u2192 \u00ab merci \u00bb (chiffres intacts)
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
  // Fautes fréquentes sur « traitement » où l'écart dépasse la distance 1 que le
  // correcteur orthographique tolère (lettres muettes sautées) : « traitmen
  // contre le varoa » basculait sinon sur la fiche « qu'est-ce que le varroa »
  // au lieu du traitement (corpus Maya).
  traitmen: 'traitement',
  traitment: 'traitement',
  traitemen: 'traitement',
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
  // Vocabulaire élargi (familier / variantes) → terme canonique présent dans les mots-clés
  filles: 'colonies',
  fumee: 'enfumoir',
  gaufre: 'cire',
  refracto: 'refractometre',
  floraison: 'miellee',
  subvention: 'aide',
  subventions: 'aide',
  crabro: 'frelon',
  assurer: 'assurance',
};

/**
 * Expressions courantes \u2192 forme canonique, appliqu\u00e9es AVANT le dictionnaire de
 * mots. Permet de mapper des tournures famili\u00e8res/vocales sur le vocabulaire des
 * fiches (\u00ab mouches \u00e0 miel \u00bb \u2192 \u00ab abeille \u00bb, \u00ab combien je gagne \u00bb \u2192 \u00ab finances \u00bb).
 */
const SYNONYMES_PHRASES: Array<[RegExp, string]> = [
  // Perte de reine → ORPHELINAGE. IMPÉRATIVEMENT en tête, AVANT « abeilles
  // mortes → mortalité » et le mot « morte → mortalité » : sans ça, « reine
  // morte » / « je vois plus la reine » basculent sur l'aperçu des maladies
  // (la fiche « mortalité »). Or l'apiculteur qui ne voit plus sa reine décrit
  // un orphelinage, pas une épidémie. Les mots-clés « reine morte » ajoutés à la
  // fiche orpheline étaient MORTS : le dictionnaire réécrivait « morte » avant
  // même la recherche de savoir (corpus Maya : « je vois pas la reine, elle est
  // morte ? » partait sur maladies-apercu).
  [
    /\b(vois|voi|voit|voyais|vu|trouve|trouves|trouver|retrouve|apercois|apercoit|aperçu|ai) (plus|pas|point|nulle part|jamais) (la |ma |de |une |cette |ta )?reine\b/g,
    'orpheline',
  ],
  [
    /\breine (est |a ete |semble |parait |serait |est peut etre )?(morte|disparue|perdue|absente|introuvable|partie|plus la)\b/g,
    'orpheline',
  ],
  [/\b(plus|pas|point) (de |d )(reine|ponte|couvain|oeufs)\b/g, 'orpheline'],
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
  | 'prediction'
  | 'reines'
  | 'elevage'
  | 'balances'
  | 'transhumance'
  | 'clients'
  | 'lots'
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
  /**
   * Formulations qui NEUTRALISENT l'intention, même si un déclencheur matche.
   *
   * Un déclencheur court est pratique mais devient faux dès que le produit
   * s'enrichit : `score` visait la santé des colonies, et a commencé à capturer
   * l'ÉCO-score du miel — deux notions qui n'ont ni la même page ni le même
   * sens. Plutôt que de retirer le mot court (et de perdre « c'est quoi mon
   * score ? »), on nomme ce qui doit l'emporter sur lui.
   */
  exclusions?: string[];
}

/**
 * CES FORMULATIONS NE DEMANDENT JAMAIS UN INVENTAIRE.
 *
 * Elles interrogent le FONCTIONNEMENT ou la POSSIBILITÉ — « comment marche ma
 * balance ? », « à quoi sert le marquage de mes reines ? ». Le possessif est
 * bien là, et pourtant la bonne réponse est une fiche de savoir, pas une liste.
 *
 * La leçon a été apprise deux fois. D'abord avec les reines : des déclencheurs
 * nus ont volé quatre fiches au corpus. J'ai cru que le possessif suffisait —
 * puis « comment marche MA balance ? » en a volé deux de plus. Ce qui distingue
 * n'est pas le possessif, c'est la forme interrogative.
 *
 * ⚠️ PARTAGÉE, et pas recopiée dans chaque intention. Quatre copies de la même
 * règle divergeraient, et le trou se rouvrirait sur celle qu'on aurait oubliée
 * — c'est exactement ce qui est arrivé entre `ROUTE_GATES` et le gating de Maya.
 */
const EXCLUSIONS_QUESTION_DE_SAVOIR = [
  'comment marche',
  'comment ca marche',
  'comment fonctionne',
  'a quoi sert',
  'a quoi ca sert',
  'c est quoi',
  'qu est ce que c est',
  'je peux suivre',
  'peut on suivre',
  // Ajoutés en back-portant le garde sur les 7 intentions anciennes :
  // « sur quoi repose le score ? » partait sur l'inventaire santé, et
  // « je peux suivre mes finances ? » n'était couvert qu'au singulier.
  'sur quoi repose',
  'sur quoi se base',
] as const;

// Ordre = priorité (le premier qui matche gagne)
const INTENTS: Intent[] = [
  {
    id: 'ruches_visiter',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
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
      'laquelle visiter',
      'qui visiter',
    ],
  },
  {
    /**
     * PLACÉE AVANT `sante`, et c'est délibéré : l'ordre de cette liste vaut
     * priorité. « comment va évoluer la santé de mes ruches » contient
     * « santé » ; sans cette position, la question sur l'AVENIR recevrait une
     * réponse sur le PRÉSENT, ce qui est précisément ce qu'on veut éviter.
     */
    id: 'prediction',
    triggers: [
      /**
       * ⚠️ PAS de « prevision » ici : `SYNONYMES` le réécrit en « meteo » avant
       * que la détection ne tourne (l'apiculteur qui dit « prévisions » parle du
       * temps, dans l'immense majorité des cas). Le déclencheur ne pourrait
       * jamais mordre — vérifié en exécutant le classifieur, pas en le lisant.
       */
      'previsionnel',
      'projection',
      'projeter',
      'anticiper',
      'a venir',
      'dans 30 jours',
      'le mois prochain',
      'va evoluer',
      'vont evoluer',
      'evolution',
      'tendance',
      'que risque',
      'quels risques',
      'quel risque',
      'ce qui peut arriver',
      'qu est ce qui peut arriver',
      'si je ne fais rien',
    ],
    /**
     * Ce que ces exclusions protègent VRAIMENT — mesuré, pas supposé.
     *
     * Elles ne servent PAS pour « prévisions météo » : les synonymes ont déjà
     * transformé le mot bien avant. Elles servent pour « quelle est la tendance
     * météo », « évolution du vent cette semaine », « quel temps à venir » —
     * trois formulations qui portent un déclencheur de projection (`tendance`,
     * `evolution`, `a venir`) et parlent pourtant du ciel. Sans elles, les
     * trois partent sur la santé des colonies.
     */
    exclusions: [
      ...EXCLUSIONS_QUESTION_DE_SAVOIR,
      'meteo',
      'temps',
      'pluie',
      'vent',
      'temperature',
    ],
  },
  {
    /**
     * L'ÉLEVAGE avant les REINES : « greffage » et « lignée » sont des mots du
     * seul élevage, tandis que « reine » apparaît dans les deux. Sans cet
     * ordre, « ma session de greffage » partirait sur le module Reine — deux
     * domaines, deux plans, deux réponses différentes.
     */
    /**
     * ⚠️ TOUS CES DÉCLENCHEURS PORTENT UN POSSESSIF OU UNE FORME D'INVENTAIRE.
     *
     * Première version : « greffage », « lignee », « cellule royale » nus. Ils
     * ont volé QUATRE fiches de savoir au corpus (86 → 82) — « remérage par
     * cage à reine », « comment savoir si ma reine est bonne », « je vois pas
     * la reine, elle est morte ? ». Toutes des questions de CONNAISSANCE, à qui
     * on répondait par un inventaire.
     *
     * La frontière n'est pas le vocabulaire, c'est la CIBLE : « comment
     * marquer une reine » relève du savoir, « où en sont mes marquages »
     * relève des données. Un déclencheur sans possessif ne sait pas trancher —
     * et comme les intentions passent avant le savoir, c'est toujours le savoir
     * qui perd.
     */
    id: 'elevage',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'mes greffages',
      'mes sessions',
      'ma session de greffage',
      'sessions de greffage',
      'mon taux d acceptation',
      'mon elevage',
      'mes lignees',
      'mes souches',
      'mes reines meres',
      'combien de cellules',
      'cellules acceptees',
      'cellules greffees',
    ],
  },
  {
    id: 'transhumance',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'mes transhumances',
      'ma transhumance',
      'mes emplacements',
      'mes deplacements',
      'transhumance prevue',
      'transhumances prevues',
      'prochaine transhumance',
      'accord signe',
      'accords signes',
      'terrain sans accord',
    ],
  },
  {
    id: 'clients',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'mes clients',
      'mon client',
      'ma clientele',
      'qui me doit',
      'qui me doivent',
      'me doit de l argent',
      'mes impayes',
      'factures impayees',
      'reglements en attente',
      'mes acheteurs',
      'mes meilleurs clients',
    ],
  },
  {
    id: 'lots',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'mes lots',
      'mon lot',
      'ma tracabilite',
      'tracabilite de mes',
      'numeros de lot',
      'numero de lot',
      'mes conditionnements',
      'mise en pot',
      'teneur en eau de mes',
    ],
  },
  {
    id: 'balances',
    triggers: [
      'mes balances',
      'ma balance',
      'poids de mes ruches',
      'poids des ruches',
      'combien pesent',
      'combien pese',
      'prise de poids',
      'miellee en cours',
      'balance connectee',
      'balances connectees',
    ],
    /**
     * LE POSSESSIF NE SUFFIT PAS ICI, et c'est la leçon que les reines
     * m'avaient déjà apprise à moitié.
     *
     * « comment marche MA balance ? » est possessif, et pourtant c'est une
     * question de FONCTIONNEMENT — la fiche `balance-connectee` y répond, pas
     * un relevé de poids. Idem pour « je peux suivre le poids de mes ruches ? »,
     * qui interroge une CAPACITÉ du produit avant d'être une demande de donnée.
     * Les deux ont été volées au corpus (86 → 84) avant cette exclusion.
     *
     * Ce qui distingue n'est plus le possessif mais la forme interrogative :
     * demander comment ça marche, ou si c'est possible, n'est jamais une
     * demande d'inventaire.
     */
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
  },
  {
    id: 'reines',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'mes reines',
      'age de mes reines',
      'ages de mes reines',
      'combien de reines',
      'quelles reines',
      'mes marquages',
      'reines a remplacer',
      'reines agees',
      'reines les plus vieilles',
      'liste de mes reines',
      'etat de mes reines',
    ],
  },
  {
    id: 'sante',
    // « score » ci-dessous vise le score de SANTÉ des colonies. Depuis que le
    // miel a le sien, ces formulations doivent partir sur la fiche éco-score.
    exclusions: [
      ...EXCLUSIONS_QUESTION_DE_SAVOIR,
      'eco score',
      'ecoscore',
      'score environnemental',
      'note environnementale',
    ],
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
      'comment vont les ruches',
      'comment vont mes ruches',
      'comment vont les colonies',
      'comment vont mes colonies',
      'comment se portent',
      'reserves',
      'mes reserves',
      'colonies faibles',
      'condition colonies',
      // « état sanitaire du cheptel » tombait sur l'intention `ruchers` (le mot
      // « cheptel » y est déclencheur) : on nomme explicitement la formulation.
      'etat sanitaire',
      'sanitaire',
      // Formulations de DÉBUTANT, qui n'emploie pas le mot « santé » (corpus Maya).
      'va bien',
      'vont bien',
      'se porte',
    ],
  },
  {
    id: 'stocks',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'stock',
      'stocks',
      'materiel',
      'reste de',
      'inventaire',
      'sous le seuil',
      'reapprovisionner',
      'commander',
      'pas de miel',
      'plus de miel',
      'pots de miel',
      'plus de pots',
      'combien de pots',
      'pots a vendre',
    ],
  },
  {
    id: 'finances',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'finance',
      'finances',
      'chiffre d affaire',
      'chiffre d affaires',
      'mon ca',
      // JAMAIS « ca » nu : la normalisation retire l'accent, donc « ça va » et
      // « ça marche » deviendraient des questions de chiffre d'affaires.
      'ca du',
      'ca mensuel',
      'ca annuel',
      'en banque',
      'en caisse',
      'tresorerie',
      'combien j ai',
      'combien en banque',
      'ventes',
      'vendu',
      'gagne',
      'impaye',
      'impayes',
      'facture en retard',
      'factures en retard',
      'rentabilite',
      'combien rapporte',
      'ca rapporte quoi',
      'ce que ca rapporte',
      // Comparaison inter-années (« compare 2023 vs 2024 ») → branche comparaison.
      'compare',
      'comparer',
      'comparaison',
      'par rapport',
      'versus',
      'vs',
    ],
  },
  {
    id: 'meteo',
    triggers: [
      'meteo',
      // ⚠️ PAS de « temps » nu : il attrapait « combien de temps vit une
      // abeille » et répondait la météo — sur LA question la plus basique
      // qu'un débutant puisse poser. On n'accepte que des tournures qui ne
      // peuvent désigner que le climat (corpus Maya, 22/07/2026).
      'quel temps',
      'temps qu il',
      'temps aujourd',
      'temps demain',
      'temps cette semaine',
      'temps prevu',
      'beau temps',
      'mauvais temps',
      'fait il beau',
      'demain',
      'sortir les ruches',
      'conditions de visite',
      'pluie',
      'vent',
      'temperature',
      'orage',
      'trop froid',
      'conditions de sortie',
    ],
  },
  {
    id: 'alertes',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
    triggers: [
      'alerte',
      'alertes',
      'a faire',
      'urgent',
      'que dois je faire',
      'rappel',
      'rappels',
      'quoi de neuf',
      'du neuf',
      'qu est ce qui m attend',
      'agenda semaine',
      'agenda du mois',
    ],
  },
  {
    id: 'ruchers',
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
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
    exclusions: [...EXCLUSIONS_QUESTION_DE_SAVOIR],
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
    if (idx === 0 || norm[idx - 1] === ' ') {
      // La FIN du mot est exigée, avec la seule tolérance du pluriel.
      //
      // Sans elle, un déclencheur court happait n'importe quel mot commençant
      // pareil : « vent » (météo) attrapait « une vente », si bien que TOUTE
      // vente partait sur la météo. Le pluriel reste toléré, car les
      // déclencheurs sont écrits au singulier (« finance » → « finances »,
      // « rucher » → « ruchers »). Trouvé par le corpus Maya, 22/07/2026.
      let fin = idx + t.length;
      if (norm[fin] === 's') fin += 1;
      if (fin >= norm.length || norm[fin] === ' ') return true;
    }
    from = idx + 1;
  }
}

function detecterIntent(norm: string): IntentId | null {
  for (const intent of INTENTS) {
    // L'exclusion passe AVANT les déclencheurs : une formulation plus précise
    // doit pouvoir désarmer un mot-clé large, jamais l'inverse.
    if (intent.exclusions?.some((e) => contientTrigger(norm, e))) continue;
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

/** Toutes les années (20XX) citées, dédupliquées et triées — sert à la comparaison. */
function extraireAnnees(norm: string): number[] {
  const conv = convertirNombres(norm);
  const set = new Set<number>();
  for (const m of conv.matchAll(/\b(20\d{2})\b/g)) set.add(Number(m[1]));
  return [...set].sort((a, b) => a - b);
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
    return "Tu n'as pas encore de ruche active enregistrée. Ajoute tes ruches depuis le module **Ruches** pour que je puisse t’aider à planifier les visites.";

  const aVisiter = actives
    .filter((r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= VISITE_SEUIL_JOURS)
    .sort((a, b) => (b.joursDepuisVisite ?? 9999) - (a.joursDepuisVisite ?? 9999));

  if (aVisiter.length === 0)
    return `Bonne nouvelle : **toutes tes ${actives.length} ruches actives ont été visitées il y a moins de ${VISITE_SEUIL_JOURS} jours.** Rien d'urgent côté visites.`;

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
    return 'Aucune ruche active enregistrée pour le moment. Dès que tu saisiras tes visites de contrôle, je pourrai calculer un score de santé par colonie.';

  const avecScore = actives.filter((r) => r.derniereVisite != null);
  const moyenne = avecScore.length
    ? Math.round(avecScore.reduce((s, r) => s + r.scoreSante, 0) / avecScore.length)
    : null;
  const critiques = actives.filter((r) => r.derniereVisite != null && r.scoreSante < 40);
  const maladies = actives.filter((r) => r.maladieObservee);

  let txt = `**Point santé de tes ${actives.length} ruches actives**\n\n`;
  txt += moyenne != null ? `- Score de santé moyen : **${moyenne}/100**\n` : '';
  txt += `- ${avecScore.length} ${pluriel(avecScore.length, 'ruche évaluée', 'ruches évaluées')} (avec au moins une visite de contrôle)\n`;

  if (critiques.length) {
    const liste = critiques
      .slice(0, 6)
      .map(
        (r) =>
          `**${r.numero}** (${r.scoreSante}/100${r.maladieObservee ? `, ${r.maladieObservee}` : ''})`,
      )
      .join(',');
    txt += `\n **${critiques.length} ${pluriel(critiques.length, 'colonie', 'colonies')} sous surveillance** (score < 40) : ${liste}. Une visite rapprochée est recommandée.`;
  } else if (avecScore.length) {
    txt += `\n Aucune colonie en zone critique. Continuez le suivi régulier.`;
  }
  if (maladies.length)
    txt += `\n\n${maladies.length} ${pluriel(maladies.length, 'ruche présente', 'ruches présentent')} une observation sanitaire à surveiller — en cas de doute, rapproche-toi d'un vétérinaire ou agent sanitaire.`;
  return txt;
}

function rendreStocks(stocks: Awaited<ReturnType<typeof getStocks>>): string {
  if (stocks.length === 0)
    return "Aucun article en stock pour l'instant. Le module **Stocks** te permet de suivre miel, matériel, nourrissement et traitements, avec des seuils d'alerte.";
  const bas = stocks.filter((s) => s.sousLeSeuil);
  if (bas.length === 0)
    return `Tes **${stocks.length} ${pluriel(stocks.length, 'article', 'articles')}** en stock sont au-dessus de leurs seuils d'alerte. Rien à réapprovisionner dans l'immédiat.`;
  const lignes = bas
    .slice(0, 10)
    .map(
      (s) =>
        `- **${s.nom}** : ${s.quantite ?? 0} ${s.unite ?? ''} (seuil : ${s.seuilAlerte} ${s.unite ?? ''})`,
    )
    .join('\n');
  return ` **${bas.length} ${pluriel(bas.length, 'article est', 'articles sont')} sous le seuil d'alerte** :\n\n${lignes}\n\nPensez à réapprovisionner avant d'en manquer.`;
}

function rendreFinances(f: Awaited<ReturnType<typeof getFinances>>): string {
  let txt = `**Bilan financier ${f.annee}**\n\n`;
  txt += `- Chiffre d'affaires (ventes) : **${euros(f.caVentesEuros)}** sur ${f.nbVentes} ${pluriel(f.nbVentes, 'facture', 'factures')}\n`;
  txt += `- Production de miel récoltée : **${f.productionMielKg.toLocaleString('fr-FR')} kg**\n`;
  if (f.facturesEnRetard > 0)
    txt += `\n **${f.facturesEnRetard} ${pluriel(f.facturesEnRetard, 'facture impayée', 'factures impayées')}** en retard, pour **${euros(f.montantImpayeEuros)}**. Pense à relancer depuis le module Finances.`;
  else txt += `\n Aucune facture en retard de paiement.`;
  if (f.caVentesEuros === 0 && f.nbVentes === 0)
    txt += `\n\n_(Aucune vente enregistrée pour ${f.annee} — saisissez tes ventes dans Finances pour suivre ton chiffre d'affaires.)_`;
  return txt;
}

// ─── Blocs riches (Maya) — purs, construits depuis les données déjà chargées ──

export function blocsSante(ruches: RucheSante[]): BlocMaya[] {
  const actives = ruches.filter((r) => r.statut === 'active');
  const avecScore = actives.filter((r) => r.derniereVisite != null);
  if (avecScore.length === 0) return [];
  const moyenne = Math.round(avecScore.reduce((s, r) => s + r.scoreSante, 0) / avecScore.length);
  const critiques = avecScore.filter((r) => r.scoreSante < 40);
  const bonnes = avecScore.filter((r) => r.scoreSante >= 70).length;
  const moyennes = avecScore.filter((r) => r.scoreSante >= 40 && r.scoreSante < 70).length;

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        {
          label: 'Score moyen',
          valeur: `${moyenne}/100`,
          ton: moyenne >= 70 ? 'sage' : moyenne >= 40 ? 'honey' : 'clay',
        },
        { label: 'Évaluées', valeur: String(avecScore.length), ton: 'neutre' },
        {
          label: 'Sous surveillance',
          valeur: String(critiques.length),
          ton: critiques.length ? 'clay' : 'sage',
        },
      ],
    },
    {
      type: 'graphe',
      titre: 'Répartition des colonies',
      serie: [
        { label: 'Bonnes', valeur: bonnes },
        { label: 'Moyennes', valeur: moyennes },
        { label: 'Critiques', valeur: critiques.length },
      ],
    },
  ];
  if (critiques.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Colonies à surveiller',
      colonnes: ['Ruche', 'Rucher', 'Score', 'Observation'],
      lignes: [...critiques]
        .sort((a, b) => a.scoreSante - b.scoreSante)
        .slice(0, 8)
        .map((r) => [r.numero, r.rucher, `${r.scoreSante}/100`, r.maladieObservee ?? '—']),
    });
  }
  return blocs;
}

export function blocsRuchesVisiter(ruches: RucheSante[]): BlocMaya[] {
  const aVisiter = ruches
    .filter((r) => r.statut === 'active')
    .filter((r) => r.joursDepuisVisite == null || r.joursDepuisVisite >= VISITE_SEUIL_JOURS)
    .sort((a, b) => (b.joursDepuisVisite ?? 9999) - (a.joursDepuisVisite ?? 9999));
  if (aVisiter.length === 0) return [];
  return [
    {
      type: 'tableau',
      titre: `${aVisiter.length} ${pluriel(aVisiter.length, 'ruche à visiter', 'ruches à visiter')}`,
      colonnes: ['Ruche', 'Rucher', 'Sans visite'],
      lignes: aVisiter
        .slice(0, 12)
        .map((r) => [
          r.numero,
          r.rucher,
          r.joursDepuisVisite == null ? 'jamais' : `${r.joursDepuisVisite} j`,
        ]),
    },
  ];
}

export function blocsFinances(f: Awaited<ReturnType<typeof getFinances>>): BlocMaya[] {
  return [
    {
      type: 'stats',
      items: [
        { label: `CA ${f.annee}`, valeur: euros(f.caVentesEuros), ton: 'honey' },
        { label: 'Ventes', valeur: String(f.nbVentes), ton: 'neutre' },
        {
          label: 'Miel récolté',
          valeur: `${f.productionMielKg.toLocaleString('fr-FR')} kg`,
          ton: 'sage',
        },
        {
          label: 'Impayés',
          valeur: f.facturesEnRetard ? euros(f.montantImpayeEuros) : '—',
          ton: f.facturesEnRetard ? 'clay' : 'neutre',
        },
      ],
    },
  ];
}

/** Résumé texte d'une comparaison inter-années (CA, production, ventes). */
function rendreComparaisonFinances(c: ComparaisonFinances): string {
  const fleche = (d: number) => (d > 0 ? '' : d < 0 ? '' : '');
  const pct = (p: number | null) => (p == null ? '' : `_(${p > 0 ? '+' : ''}${p} %)_`);
  const tendance =
    c.deltaCA > 0
      ? `Belle progression du chiffre d'affaires`
      : c.deltaCA < 0
        ? `Chiffre d'affaires en recul — à surveiller.`
        : `Chiffre d'affaires stable.`;
  return [
    ` **Comparaison ${c.ancienne.annee} → ${c.recente.annee}**`,
    '',
    `- Chiffre d'affaires : **${euros(c.ancienne.caVentesEuros)}** → **${euros(c.recente.caVentesEuros)}** ${fleche(c.deltaCA)}${pct(c.pctCA)}`,
    `- Production de miel : **${c.ancienne.productionMielKg.toLocaleString('fr-FR')} kg** → **${c.recente.productionMielKg.toLocaleString('fr-FR')} kg** ${fleche(c.deltaProduction)}${pct(c.pctProduction)}`,
    `- Ventes : **${c.ancienne.nbVentes}** → **${c.recente.nbVentes}** ${fleche(c.deltaVentes)}`,
    '',
    tendance,
  ].join('\n');
}

/** Blocs riches d'une comparaison inter-années : tableau comparatif + graphe CA. */
export function blocsComparaisonFinances(c: ComparaisonFinances): BlocMaya[] {
  const d = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n).toLocaleString('fr-FR')}`;
  return [
    {
      type: 'tableau',
      titre: `Comparatif ${c.ancienne.annee} vs ${c.recente.annee}`,
      colonnes: ['Indicateur', String(c.ancienne.annee), String(c.recente.annee), 'Δ'],
      lignes: [
        [
          'CA (€)',
          Math.round(c.ancienne.caVentesEuros),
          Math.round(c.recente.caVentesEuros),
          d(c.deltaCA),
        ],
        [
          'Production (kg)',
          c.ancienne.productionMielKg,
          c.recente.productionMielKg,
          d(c.deltaProduction),
        ],
        ['Ventes', c.ancienne.nbVentes, c.recente.nbVentes, d(c.deltaVentes)],
      ],
    },
    {
      type: 'graphe',
      titre: "Chiffre d'affaires (€)",
      forme: 'barres',
      serie: [
        { label: String(c.ancienne.annee), valeur: Math.round(c.ancienne.caVentesEuros) },
        { label: String(c.recente.annee), valeur: Math.round(c.recente.caVentesEuros) },
      ],
    },
  ];
}

export function blocsStocks(stocks: Awaited<ReturnType<typeof getStocks>>): BlocMaya[] {
  const bas = stocks.filter((s) => s.sousLeSeuil);
  if (bas.length === 0) return [];
  return [
    {
      type: 'tableau',
      titre: 'Sous le seuil d’alerte',
      colonnes: ['Article', 'Restant', 'Seuil'],
      lignes: bas
        .slice(0, 12)
        .map((s) => [
          s.nom,
          `${s.quantite ?? 0} ${s.unite ?? ''}`.trim(),
          `${s.seuilAlerte ?? ''} ${s.unite ?? ''}`.trim(),
        ]),
    },
  ];
}

/** Carte d'action proposée avec les ruches (planifier / déplacer). */
function carteActionsRuches(): BlocMaya {
  return {
    type: 'carte',
    titre: 'Et maintenant, que faisons-nous ?',
    actions: [
      { label: 'Planifier une visite', to: '/calendrier', icone: 'i-lucide-calendar-plus' },
      { label: 'Déplacer une ruche', to: '/transhumance/emplacements', icone: 'i-lucide-truck' },
    ],
  };
}

/** Graphe de tendance du CA sur 12 mois (null si aucune vente sur la période). */
export function grapheCa12Mois(serie: { labels: string[]; ca: number[] }): BlocMaya | null {
  if (serie.ca.every((v) => v === 0)) return null;
  return {
    type: 'graphe',
    titre: 'Chiffre d’affaires — 12 derniers mois',
    forme: 'ligne',
    serie: serie.labels.map((l, i) => ({ label: l, valeur: serie.ca[i] ?? 0 })),
  };
}

/**
 * LES FABRIQUES DE BLOCS SONT EXPORTÉES, ET C'EST VOLONTAIRE.
 *
 * Ce sont des fonctions PURES : des lignes de données entrent, une figure sort.
 * Elles vivaient toutes en portée de module, donc hors d'atteinte d'un banc —
 * neuf fabriques, zéro test, alors que ce sont elles qui décident de ce que
 * l'apiculteur VOIT. Les exporter ne coûte rien (aucun état, aucun effet) et
 * rend vérifiable ce qui ne l'était pas.
 */

/**
 * Étiquette courte pour un axe de graphe — « lun. 12 », pas « 12 septembre ».
 * Sept étiquettes longues sur un axe étroit se chevauchent ou se tronquent.
 */
export function jourCourt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
}

/**
 * QUATRE INTENTIONS N'AVAIENT AUCUNE FIGURE — météo, alertes, ruchers,
 * interventions. Dix réponses sur cinquante en portaient une, dont quatre
 * seulement un graphe. Or ce sont précisément les questions où une forme dit
 * mieux qu'une phrase : une courbe de score météo se lit d'un coup d'œil, sa
 * version en liste demande de comparer sept nombres de tête.
 *
 * Règle tenue ici : on n'invente aucun type de bloc. Les quatre existants
 * (`stats`, `tableau`, `graphe`, `carte`) sont déjà rendus par MayaChart.
 */

/**
 * LA TRANSHUMANCE — et surtout les terrains sans accord signé.
 *
 * Le signal le plus fort de ce module n'est pas le calendrier : c'est
 * `accord_signe`. Poser des ruches sur un terrain sans accord écrit expose à
 * une mise en demeure, à un déplacement en urgence en pleine miellée, et à la
 * perte du terrain pour les années suivantes. Rien dans le produit ne le
 * remontait à l'apiculteur au moment où il planifie.
 *
 * ⚠️ La RENTABILITÉ ne se calcule que sur les transhumances RÉALISÉES qui ont
 * à la fois une production ET un coût. Une donnée manquante n'est pas un zéro :
 * additionner un coût sans sa production ferait apparaître une transhumance à
 * perte là où la récolte n'a simplement pas encore été saisie.
 */
export interface BilanTranshumance {
  aVenir: PlanTranshumanceRow[];
  realisees: PlanTranshumanceRow[];
  /** Réalisées ET chiffrées des DEUX côtés — les seules comparables. */
  chiffrees: PlanTranshumanceRow[];
  sansAccord: EmplacementRow[];
}

export function bilanTranshumance(data: TranshumanceData, maintenant: Date): BilanTranshumance {
  const maintenantMs = maintenant.getTime();
  const aVenir = data.plans.filter(
    (p) =>
      p.dateRealisee == null &&
      p.statut !== 'annule' &&
      p.datePrevue != null &&
      new Date(p.datePrevue).getTime() >= maintenantMs,
  );
  const realisees = data.plans.filter((p) => p.dateRealisee != null);
  const chiffrees = realisees.filter((p) => p.productionKg != null && p.coutEuros != null);
  return {
    aVenir,
    realisees,
    chiffrees,
    sansAccord: data.emplacements.filter((e) => !e.accordSigne),
  };
}

export function rendreTranshumance(b: BilanTranshumance, annee: number): string {
  if (b.aVenir.length === 0 && b.realisees.length === 0 && b.sansAccord.length === 0)
    return `Je ne vois aucun plan de transhumance pour ${annee}, ni emplacement enregistré. Ajoute tes emplacements et je pourrai suivre tes déplacements, leurs coûts et leur rendement.`;

  const lignes: string[] = [];

  if (b.aVenir.length) {
    lignes.push(
      `**${b.aVenir.length} ${pluriel(b.aVenir.length, 'transhumance prévue', 'transhumances prévues')}** :`,
    );
    for (const p of b.aVenir.slice(0, 5)) {
      const quoi = p.miellee ? `miellée ${p.miellee}` : 'déplacement';
      lignes.push(
        `- **${dateFr(p.datePrevue)}** — ${quoi}, ${p.ruchesPrevues} ${pluriel(p.ruchesPrevues, 'ruche', 'ruches')}${p.destination ? ` vers ${p.destination}` : ''}${p.origine ? ` (depuis ${p.origine})` : ''}`,
      );
    }
  } else if (b.realisees.length) {
    lignes.push(
      `Aucune transhumance à venir — ${b.realisees.length} déjà ${pluriel(b.realisees.length, 'réalisée', 'réalisées')} en ${annee}.`,
    );
  }

  if (b.chiffrees.length) {
    const prod = b.chiffrees.reduce((n, p) => n + (p.productionKg ?? 0), 0);
    const cout = b.chiffrees.reduce((n, p) => n + (p.coutEuros ?? 0), 0);
    lignes.push(
      `Sur ${b.chiffrees.length} ${pluriel(b.chiffrees.length, 'transhumance chiffrée', 'transhumances chiffrées')} : ${Math.round(prod)} kg récoltés pour ${Math.round(cout)} € de carburant.`,
    );
    const nonChiffrees = b.realisees.length - b.chiffrees.length;
    if (nonChiffrees)
      lignes.push(
        `${nonChiffrees} ${pluriel(nonChiffrees, 'transhumance réalisée n’est', 'transhumances réalisées ne sont')} pas ${pluriel(nonChiffrees, 'chiffrée', 'chiffrées')} : ${pluriel(nonChiffrees, 'elle n’entre', 'elles n’entrent')} pas dans ce calcul.`,
      );
  }

  if (b.sansAccord.length)
    lignes.push(
      `⚠️ ${b.sansAccord.length} ${pluriel(b.sansAccord.length, 'emplacement n’a', 'emplacements n’ont')} pas d’accord signé : ` +
        b.sansAccord
          .slice(0, 5)
          .map((e) => `${e.nom}${e.commune ? ` (${e.commune})` : ''}`)
          .join(', ') +
        `. Un terrain sans accord écrit peut se perdre du jour au lendemain, parfois en pleine miellée.`,
    );

  return lignes.join('\n\n');
}

export function blocsTranshumance(b: BilanTranshumance): BlocMaya[] {
  if (b.aVenir.length === 0 && b.realisees.length === 0 && b.sansAccord.length === 0) return [];

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'À venir', valeur: String(b.aVenir.length), ton: 'honey' },
        { label: 'Réalisées', valeur: String(b.realisees.length), ton: 'sage' },
        {
          label: 'Sans accord',
          valeur: String(b.sansAccord.length),
          ton: b.sansAccord.length ? 'clay' : 'sage',
        },
      ],
    },
  ];

  if (b.aVenir.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Prochains déplacements',
      colonnes: ['Date', 'Miellée', 'Ruches', 'Destination'],
      lignes: b.aVenir
        .slice(0, 8)
        .map((p) => [
          dateFr(p.datePrevue),
          p.miellee ?? '—',
          String(p.ruchesPrevues),
          p.destination ?? '—',
        ]),
    });
  }

  // Le rendement se compare entre AU MOINS deux transhumances chiffrées : une
  // seule barre ne dit pas si le déplacement valait le coup.
  if (b.chiffrees.length > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Production par transhumance (kg)',
      forme: 'barres',
      serie: b.chiffrees.map((p) => ({
        label: p.miellee ?? dateFr(p.dateRealisee),
        valeur: Math.round(p.productionKg ?? 0),
      })),
    });
  }

  if (b.sansAccord.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Emplacements sans accord signé',
      colonnes: ['Emplacement', 'Commune', 'Propriétaire'],
      lignes: b.sansAccord
        .slice(0, 8)
        .map((e) => [e.nom, e.commune ?? '—', e.proprietaireTerrain ?? '—']),
    });
  }
  return blocs;
}

/**
 * LE COMMERCE — les clients, et l'argent qui n'est pas rentré.
 *
 * ⚠️ CE QU'EST UN IMPAYÉ EST DÉFINI UNE SEULE FOIS, DANS `getClients`.
 * Une facture est ouverte si son statut est `envoyee` OU `en_retard` : c'est la
 * définition qu'appliquent déjà les factures ouvertes, le rapprochement
 * bancaire et la fiche client. Maya s'y range plutôt que d'en tenir une autre —
 * deux définitions donneraient deux montants dus pour un même client, et
 * l'apiculteur croirait la plus basse.
 */
export interface BilanClients {
  clients: ClientRow[];
  /** Ceux qui ont acheté au moins une fois. */
  acheteurs: ClientRow[];
  /** Ceux qui doivent encore de l'argent. */
  debiteurs: ClientRow[];
  /** Ceux qui ont acheté un jour, mais plus depuis plus d'un an. */
  dormants: ClientRow[];
  caEuros: number;
  impayeEuros: number;
  /** Part du plus gros client dans le chiffre d'affaires (0 à 1), si mesurable. */
  concentration: number | null;
}

/**
 * Un an de silence, et pas moins.
 *
 * La vente de miel est saisonnière : un client qui commande une fois l'an, à la
 * récolte, est un bon client — pas un client perdu. Une fenêtre courte les
 * signalerait tous chaque printemps, et l'alerte perdrait tout son sens. Au-delà
 * d'un cycle complet, en revanche, le silence n'est plus explicable par la
 * saison.
 */
const SILENCE_CLIENT_JOURS = 365;

export function bilanClients(clients: ClientRow[], maintenant: Date): BilanClients {
  const acheteurs = clients.filter((c) => c.nbVentes > 0);
  const limite = maintenant.getTime() - SILENCE_CLIENT_JOURS * 86_400_000;
  const dormants = acheteurs.filter(
    (c) => c.derniereVente != null && new Date(c.derniereVente).getTime() < limite,
  );
  const caEuros = acheteurs.reduce((n, c) => n + c.caEuros, 0);
  const plusGros = acheteurs.reduce((m, c) => Math.max(m, c.caEuros), 0);
  return {
    clients,
    acheteurs,
    debiteurs: clients.filter((c) => c.nbImpayees > 0),
    dormants,
    caEuros,
    impayeEuros: clients.reduce((n, c) => n + c.impayeEuros, 0),
    // Sans chiffre d'affaires, il n'y a pas de part à calculer — et surtout pas
    // une division par zéro maquillée en 0 %.
    concentration: caEuros > 0 ? plusGros / caEuros : null,
  };
}

export function rendreClients(b: BilanClients): string {
  if (b.clients.length === 0)
    return 'Je ne vois aucun client enregistré. Ajoute-les et je pourrai suivre ce que chacun achète, ce qu’il te doit et depuis combien de temps il ne t’a rien commandé.';

  const lignes: string[] = [
    `**${b.clients.length} ${pluriel(b.clients.length, 'client', 'clients')}**, dont ${b.acheteurs.length} ${pluriel(b.acheteurs.length, 'qui a déjà commandé', 'qui ont déjà commandé')} — ${Math.round(b.caEuros)} € au total.`,
  ];

  if (b.debiteurs.length) {
    lignes.push(
      `⚠️ **${Math.round(b.impayeEuros)} € en attente de règlement** sur ${b.debiteurs.length} ${pluriel(b.debiteurs.length, 'client', 'clients')} : ` +
        b.debiteurs
          .slice(0, 5)
          .map((c) => `${c.nom} (${Math.round(c.impayeEuros)} €)`)
          .join(', ') +
        '.',
    );
  }

  if (b.dormants.length) {
    lignes.push(
      `${b.dormants.length} ${pluriel(b.dormants.length, 'client n’a', 'clients n’ont')} rien commandé depuis plus d’un an : ` +
        b.dormants
          .slice(0, 5)
          .map((c) => `${c.nom} (dernière commande ${dateFr(c.derniereVente)})`)
          .join(', ') +
        `. Une saison sautée s’explique ; deux, beaucoup moins — un mot avant la prochaine récolte peut suffire à les faire revenir.`,
    );
  }

  /**
   * LA DÉPENDANCE NE SE MESURE PAS À DEUX.
   *
   * Avec deux acheteurs, le plus gros pèse au moins 50 % par construction : le
   * dire n'apprend rien, et ferait passer un partage parfaitement équilibré pour
   * un risque. À partir de trois, dépasser la moitié signifie peser plus que
   * tous les autres réunis — là, l'information existe.
   *
   * Et elle se dit au CONDITIONNEL : c'est une tendance, pas une fatalité.
   */
  if (b.concentration != null && b.concentration > 0.5 && b.acheteurs.length >= 3) {
    const gros = b.acheteurs[0]!;
    lignes.push(
      `${gros.nom} pèse ${Math.round(b.concentration * 100)} % de ton chiffre d’affaires — plus que tous les autres réunis. S’il changeait de fournisseur, la perte pourrait être difficile à absorber sur une seule saison ; élargir un peu le carnet réduirait ce risque.`,
    );
  }

  return lignes.join('\n\n');
}

export function blocsClients(b: BilanClients): BlocMaya[] {
  if (b.clients.length === 0) return [];

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Clients', valeur: String(b.clients.length), ton: 'neutre' },
        { label: 'Chiffre d’affaires', valeur: `${Math.round(b.caEuros)} €`, ton: 'honey' },
        {
          label: 'En attente',
          valeur: `${Math.round(b.impayeEuros)} €`,
          ton: b.impayeEuros > 0 ? 'clay' : 'sage',
        },
      ],
    },
  ];

  // Un classement suppose au moins deux acheteurs : une barre seule ne compare
  // rien, elle affiche juste un total déjà donné au-dessus.
  const classables = b.acheteurs.filter((c) => c.caEuros > 0);
  if (classables.length > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Chiffre d’affaires par client (€)',
      forme: 'barres',
      serie: classables.slice(0, 8).map((c) => ({
        label: c.nom,
        valeur: Math.round(c.caEuros),
      })),
    });
  }

  if (b.debiteurs.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Règlements en attente',
      colonnes: ['Client', 'Factures', 'Montant'],
      lignes: b.debiteurs
        .slice(0, 8)
        .map((c) => [c.nom, String(c.nbImpayees), `${Math.round(c.impayeEuros)} €`]),
    });
  }

  if (b.dormants.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Sans commande depuis plus d’un an',
      colonnes: ['Client', 'Dernière commande', 'Total acheté'],
      lignes: b.dormants
        .slice(0, 8)
        .map((c) => [c.nom, dateFr(c.derniereVente), `${Math.round(c.caEuros)} €`]),
    });
  }

  return blocs;
}

/**
 * LES LOTS — la traçabilité, du cadre au pot.
 *
 * ⚠️ DEUX PIÈGES ÉVITÉS ICI, ET ILS TIRENT EN SENS INVERSE.
 *
 * 1. Les seuils de conformité ne sont PAS recopiés. La teneur en eau est jugée
 *    par `evaluerQualiteMiel`, qui connaît la directive 2001/110/CE — et sait
 *    que la callune est tolérée à 23 % là où le reste plafonne à 20 %. Écrire
 *    « 20 » ici déclarerait non conforme un miel de bruyère parfaitement légal.
 *
 * 2. Une DDM dépassée n'est PAS une péremption. La fiche de savoir du produit
 *    le dit noir sur blanc : le miel n'a pas de DLC, il reste consommable après
 *    sa date, son goût évolue simplement. Annoncer un lot « périmé » serait
 *    faux, et contredirait ce que Maya explique elle-même deux questions plus
 *    loin.
 *
 * Ce qui est réellement en jeu, c'est le miel SANS numéro de lot : lui seul est
 * intraçable. Le règlement (CE) 178/2002 impose de savoir d'où vient un produit
 * et où il est parti ; un kilo sans lot ne se rattache à rien.
 */
export interface BilanLots {
  lots: LotRow[];
  /** Récoltés mais jamais mis en pot. */
  nonConditionnes: LotRow[];
  /** Teneur en eau au-dessus du seuil réglementaire de leur type de miel. */
  nonConformes: Array<{ lot: LotRow; seuil: number }>;
  kgTotal: number;
  kgSansLot: number;
  nbRecoltesSansLot: number;
}

export function bilanLots(data: LotsData): BilanLots {
  const nonConformes: Array<{ lot: LotRow; seuil: number }> = [];
  for (const lot of data.lots) {
    // Pas de mesure, pas de verdict : un lot non analysé n'est pas un lot
    // non conforme, et le présenter comme tel ferait fuir une conformité qui
    // n'a simplement pas encore été mesurée.
    if (lot.teneurEauPct == null) continue;
    const q = evaluerQualiteMiel({
      teneurEauPct: lot.teneurEauPct,
      hmfMgKg: lot.hmfMgKg,
      typeMiel: lot.typeMiel,
    });
    if (!q.teneurEau.ok) nonConformes.push({ lot, seuil: q.teneurEau.seuil });
  }
  return {
    lots: data.lots,
    nonConditionnes: data.lots.filter((l) => !l.conditionne),
    nonConformes,
    kgTotal: data.lots.reduce((n, l) => n + (l.quantiteKg ?? 0), 0),
    kgSansLot: data.kgSansLot,
    nbRecoltesSansLot: data.nbRecoltesSansLot,
  };
}

export function rendreLots(b: BilanLots): string {
  if (b.lots.length === 0 && b.nbRecoltesSansLot === 0)
    return 'Je ne vois aucune récolte enregistrée, donc aucun lot à tracer. Saisis tes récoltes avec un numéro de lot et je pourrai suivre la chaîne jusqu’au pot.';

  const lignes: string[] = [];

  if (b.lots.length) {
    lignes.push(
      `**${b.lots.length} ${pluriel(b.lots.length, 'lot tracé', 'lots tracés')}** pour ${Math.round(b.kgTotal)} kg récoltés.`,
    );
  }

  if (b.nbRecoltesSansLot) {
    lignes.push(
      `⚠️ ${Math.round(b.kgSansLot)} kg ${pluriel(b.nbRecoltesSansLot, 'sur une récolte', 'répartis sur ' + b.nbRecoltesSansLot + ' récoltes')} n’${pluriel(b.nbRecoltesSansLot, 'a', 'ont')} pas de numéro de lot. Sans lot, ce miel ne se rattache ni à un rucher ni à une date : en cas de contrôle ou de retour client, la chaîne est rompue.`,
    );
  }

  if (b.nonConformes.length) {
    lignes.push(
      `${b.nonConformes.length} ${pluriel(b.nonConformes.length, 'lot dépasse', 'lots dépassent')} le seuil réglementaire de teneur en eau : ` +
        b.nonConformes
          .slice(0, 5)
          .map(({ lot, seuil }) => `${lot.numeroLot} (${lot.teneurEauPct} % pour ${seuil} % admis)`)
          .join(', ') +
        `. Au-dessus du seuil, le miel peut fermenter : il n’est pas commercialisable en l’état.`,
    );
  }

  if (b.nonConditionnes.length) {
    lignes.push(
      `${b.nonConditionnes.length} ${pluriel(b.nonConditionnes.length, 'lot n’a', 'lots n’ont')} pas encore de mise en pot enregistrée : ` +
        b.nonConditionnes
          .slice(0, 5)
          .map((l) => l.numeroLot)
          .join(', ') +
        `. Tant que le conditionnement n’est pas saisi, il manque le dernier maillon entre la récolte et l’étiquette.`,
    );
  }

  return lignes.join('\n\n');
}

export function blocsLots(b: BilanLots): BlocMaya[] {
  if (b.lots.length === 0 && b.nbRecoltesSansLot === 0) return [];

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Lots tracés', valeur: String(b.lots.length), ton: 'honey' },
        {
          label: 'Mis en pot',
          valeur: `${b.lots.length - b.nonConditionnes.length}/${b.lots.length}`,
          ton: b.nonConditionnes.length ? 'clay' : 'sage',
        },
        {
          label: 'Kilos sans lot',
          valeur: `${Math.round(b.kgSansLot)} kg`,
          ton: b.kgSansLot > 0 ? 'clay' : 'sage',
        },
      ],
    },
  ];

  // Comparer les volumes suppose au moins deux lots pesés.
  const peses = b.lots.filter((l) => (l.quantiteKg ?? 0) > 0);
  if (peses.length > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Volume par lot (kg)',
      forme: 'barres',
      serie: peses.slice(0, 8).map((l) => ({
        label: l.numeroLot,
        valeur: Math.round(l.quantiteKg ?? 0),
      })),
    });
  }

  if (b.nonConformes.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Teneur en eau au-dessus du seuil',
      colonnes: ['Lot', 'Miel', 'Teneur en eau', 'Seuil'],
      lignes: b.nonConformes
        .slice(0, 8)
        .map(({ lot, seuil }) => [
          lot.numeroLot,
          lot.typeMiel ?? '—',
          `${lot.teneurEauPct} %`,
          `${seuil} %`,
        ]),
    });
  }

  if (b.nonConditionnes.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Lots sans mise en pot',
      colonnes: ['Lot', 'Miel', 'Quantité', 'Dernière récolte'],
      lignes: b.nonConditionnes
        .slice(0, 8)
        .map((l) => [
          l.numeroLot,
          l.typeMiel ?? '—',
          l.quantiteKg != null ? `${Math.round(l.quantiteKg)} kg` : '—',
          dateFr(l.derniereRecolte),
        ]),
    });
  }

  return blocs;
}

/**
 * LES BALANCES — et surtout celles qui se sont TUES.
 *
 * ⚠️ AUCUN SEUIL N'EST INVENTÉ ICI. Ils viennent tous de
 * `server/utils/balances/alertes.ts`, où ils sont documentés et surchargeables
 * balance par balance : batterie faible à 20 %, silence toléré 12 h (deux
 * relevés manqués sur un capteur à 4-6 h de cadence), miellée à partir de 2 kg
 * sur 24 h. Recopier ces nombres ferait diverger la conversation des alertes,
 * et l'apiculteur recevrait deux verdicts pour une même balance.
 *
 * Le signal le plus utile n'est pas le poids : c'est la balance MUETTE. Un
 * capteur qui a cessé d'émettre est pire qu'une absence de capteur, parce qu'on
 * continue de lui faire confiance — on croit surveiller une ruche qu'on ne
 * surveille plus.
 */
export interface EtatBalance {
  balance: BalanceRow;
  /** Heures écoulées depuis la dernière mesure, ou null si jamais mesurée. */
  silenceHeures: number | null;
  muette: boolean;
  batterieFaible: boolean;
  enMiellee: boolean;
}

export function etatsBalances(balances: BalanceRow[], maintenant: Date): EtatBalance[] {
  return balances.map((b) => {
    const seuils = resoudreSeuils({
      seuilBatteriePct: b.seuilBatteriePct,
      seuilSilenceHeures: b.seuilSilenceHeures,
    });
    const silenceHeures =
      b.mesureeAt == null
        ? null
        : (maintenant.getTime() - new Date(b.mesureeAt).getTime()) / 3_600_000;
    return {
      balance: b,
      silenceHeures,
      // Jamais mesurée = muette elle aussi : elle est posée, elle ne dit rien.
      muette: silenceHeures == null || silenceHeures > seuils.silenceHeures,
      batterieFaible: b.batteriePct != null && b.batteriePct <= seuils.batteriePct,
      enMiellee: (b.variation24hKg ?? 0) >= SEUIL_MIELLEE_KG,
    };
  });
}

export function rendreBalances(etats: EtatBalance[]): string {
  if (etats.length === 0)
    return 'Tu n’as pas encore de balance connectée. Une balance sous une ruche te donne le poids en direct — c’est ce qui montre une miellée le jour où elle démarre, et un essaimage dans l’heure.';

  const vivantes = etats.filter((e) => !e.muette);
  const muettes = etats.filter((e) => e.muette);
  const enMiellee = vivantes.filter((e) => e.enMiellee);
  const batteries = etats.filter((e) => e.batterieFaible);

  const lignes: string[] = [
    `**${etats.length} ${pluriel(etats.length, 'balance', 'balances')}**, dont ${vivantes.length} qui ${pluriel(vivantes.length, 'répond', 'répondent')}.`,
  ];

  for (const e of vivantes.slice(0, 6)) {
    const ou = e.balance.ruche ? `ruche ${e.balance.ruche}` : (e.balance.rucher ?? '—');
    const poids = e.balance.poidsNetKg != null ? `${e.balance.poidsNetKg} kg net` : 'poids inconnu';
    const v = e.balance.variation24hKg;
    const delta =
      v == null ? '' : ` · ${v >= 0 ? '+' : ''}${v} kg sur 24 h${e.enMiellee ? ' — miellée' : ''}`;
    lignes.push(`- **${e.balance.nom}** (${ou}) : ${poids}${delta}`);
  }

  if (enMiellee.length)
    lignes.push(
      `${enMiellee.length} ${pluriel(enMiellee.length, 'ruche prend', 'ruches prennent')} du poids franchement — c’est le moment de surveiller la place disponible.`,
    );

  if (muettes.length)
    lignes.push(
      `⚠️ ${muettes.length} ${pluriel(muettes.length, 'balance ne dit plus rien', 'balances ne disent plus rien')} : ` +
        muettes
          .slice(0, 4)
          .map((e) =>
            e.silenceHeures == null
              ? `${e.balance.nom} (aucune mesure)`
              : `${e.balance.nom} (${Math.round(e.silenceHeures)} h)`,
          )
          .join(', ') +
        `. Une balance muette est pire qu’une absence de balance : on croit surveiller une ruche qu’on ne surveille plus.`,
    );

  if (batteries.length)
    lignes.push(
      `${batteries.length} ${pluriel(batteries.length, 'batterie est faible', 'batteries sont faibles')} — à recharger avant qu’elles ne s’arrêtent.`,
    );

  return lignes.join('\n\n');
}

export function blocsBalances(etats: EtatBalance[]): BlocMaya[] {
  if (etats.length === 0) return [];
  const vivantes = etats.filter((e) => !e.muette);
  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Balances', valeur: String(etats.length), ton: 'honey' },
        {
          label: 'Muettes',
          valeur: String(etats.length - vivantes.length),
          ton: etats.length - vivantes.length ? 'clay' : 'sage',
        },
        {
          label: 'En miellée',
          valeur: String(vivantes.filter((e) => e.enMiellee).length),
          ton: 'sage',
        },
      ],
    },
  ];

  // Le graphe compare des POIDS entre balances : il lui faut au moins deux
  // balances qui répondent ET un poids sur chacune, sinon il ne compare rien.
  const pesees = vivantes.filter((e) => e.balance.poidsNetKg != null);
  if (pesees.length > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Poids net par balance (kg)',
      forme: 'barres',
      serie: pesees.map((e) => ({ label: e.balance.nom, valeur: e.balance.poidsNetKg! })),
    });
  }
  if (etats.length - vivantes.length > 0) {
    blocs.push({
      type: 'tableau',
      titre: 'Balances silencieuses',
      colonnes: ['Balance', 'Emplacement', 'Sans nouvelles depuis'],
      lignes: etats
        .filter((e) => e.muette)
        .slice(0, 8)
        .map((e) => [
          e.balance.nom,
          e.balance.ruche ? `ruche ${e.balance.ruche}` : (e.balance.rucher ?? '—'),
          e.silenceHeures == null ? 'aucune mesure' : `${Math.round(e.silenceHeures)} h`,
        ]),
    });
  }
  return blocs;
}

/**
 * LE CODE COULEUR INTERNATIONAL DE MARQUAGE DES REINES.
 *
 * Convention universelle, reprise telle quelle dans `couleurReineEnum` :
 * la couleur dépend du dernier chiffre de l'année de naissance.
 *
 *   1 ou 6 → blanc · 2 ou 7 → jaune · 3 ou 8 → rouge
 *   4 ou 9 → vert  · 5 ou 0 → bleu
 *
 * Ce n'est pas une coquetterie : sur le terrain, la couleur est ce qui permet
 * de dater une reine d'un coup d'œil, sans ouvrir la fiche. Une couleur qui ne
 * correspond pas à l'année est une information FAUSSE au moment où on en a le
 * plus besoin — et c'est une erreur qu'on ne détecte jamais soi-même, puisque
 * c'est précisément la mémoire qu'on délègue à la marque.
 */
const COULEUR_PAR_CHIFFRE: Record<number, string> = {
  1: 'blanc',
  6: 'blanc',
  2: 'jaune',
  7: 'jaune',
  3: 'rouge',
  8: 'rouge',
  4: 'vert',
  9: 'vert',
  5: 'bleu',
  0: 'bleu',
};

/** La couleur attendue pour une année, ou null si l'année est absente. */
export function couleurAttendue(annee: number | null): string | null {
  if (annee == null || !Number.isFinite(annee)) return null;
  return COULEUR_PAR_CHIFFRE[Math.abs(Math.trunc(annee)) % 10] ?? null;
}

/**
 * Les reines dont le marquage contredit l'année.
 *
 * Une reine sans année OU sans couleur n'est PAS signalée : il n'y a pas de
 * contradiction, seulement une donnée manquante. Confondre les deux ferait
 * crier au loup sur des fiches simplement incomplètes.
 */
export function marquagesIncoherents(reines: ReineRow[]): Array<ReineRow & { attendue: string }> {
  const out: Array<ReineRow & { attendue: string }> = [];
  for (const r of reines) {
    const attendue = couleurAttendue(r.annee);
    if (!attendue || !r.couleur) continue;
    if (r.couleur !== attendue) out.push({ ...r, attendue });
  }
  return out;
}

/** L'âge des reines, réparti par année. Le vieillissement est LE signal du module. */
export function rendreReines(reines: ReineRow[], anneeCourante: number): string {
  if (reines.length === 0)
    return 'Je ne vois aucune ruche active à laquelle rattacher une reine. Ajoute tes ruches, puis renseigne la reine dans la fiche de chacune.';

  const datees = reines.filter((r) => r.annee != null);
  const sansAnnee = reines.length - datees.length;
  const agees = datees.filter((r) => anneeCourante - (r.annee ?? 0) >= 3);
  const faibles = reines.filter((r) => r.qualite === 'faible' || r.qualite === 'absente');
  const incoherentes = marquagesIncoherents(reines);

  const lignes: string[] = [
    `Tu as **${reines.length} ${pluriel(reines.length, 'reine', 'reines')}** sur tes ruches actives.`,
  ];
  if (datees.length) {
    const parAnnee = new Map<number, number>();
    for (const r of datees) parAnnee.set(r.annee!, (parAnnee.get(r.annee!) ?? 0) + 1);
    const detail = [...parAnnee.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([an, n]) => `${n} de ${an}`)
      .join(', ');
    lignes.push(`Par année : ${detail}.`);
  }
  if (agees.length)
    lignes.push(
      `**${agees.length} ${pluriel(agees.length, 'reine a', 'reines ont')} trois ans ou plus** — au-delà, la ponte peut décliner et le renouvellement se prépare.`,
    );
  if (faibles.length)
    lignes.push(
      `${faibles.length} ${pluriel(faibles.length, 'colonie est notée', 'colonies sont notées')} en ponte faible ou sans reine.`,
    );
  if (incoherentes.length)
    lignes.push(
      `⚠️ ${incoherentes.length} ${pluriel(incoherentes.length, 'marquage ne correspond', 'marquages ne correspondent')} pas à l’année (code couleur international) : ` +
        incoherentes
          .slice(0, 4)
          .map((r) => `ruche ${r.ruche} (${r.couleur} pour ${r.annee}, attendu ${r.attendue})`)
          .join(', ') +
        `.`,
    );
  if (sansAnnee)
    lignes.push(
      `${sansAnnee} ${pluriel(sansAnnee, 'reine n’a', 'reines n’ont')} pas d’année renseignée : je ne peux pas juger leur âge.`,
    );
  return lignes.join('\n\n');
}

/** Les figures du module Reine : répartition par année, et les incohérences. */
export function blocsReines(reines: ReineRow[], anneeCourante: number): BlocMaya[] {
  if (reines.length === 0) return [];
  const datees = reines.filter((r) => r.annee != null);
  const agees = datees.filter((r) => anneeCourante - (r.annee ?? 0) >= 3);
  const incoherentes = marquagesIncoherents(reines);

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Reines', valeur: String(reines.length), ton: 'honey' },
        {
          label: '3 ans et plus',
          valeur: String(agees.length),
          ton: agees.length ? 'clay' : 'sage',
        },
        { label: 'Sans année', valeur: String(reines.length - datees.length), ton: 'neutre' },
      ],
    },
  ];

  // Une seule année représentée : le graphe n'aurait qu'une barre.
  const parAnnee = new Map<number, number>();
  for (const r of datees) parAnnee.set(r.annee!, (parAnnee.get(r.annee!) ?? 0) + 1);
  if (parAnnee.size > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Reines par année de naissance',
      forme: 'barres',
      serie: [...parAnnee.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([an, n]) => ({ label: String(an), valeur: n })),
    });
  }
  if (incoherentes.length) {
    blocs.push({
      type: 'tableau',
      titre: 'Marquages à corriger',
      colonnes: ['Ruche', 'Rucher', 'Marquée', 'Attendu'],
      lignes: incoherentes
        .slice(0, 8)
        .map((r) => [r.ruche, r.rucher, `${r.couleur} (${r.annee})`, r.attendue]),
    });
  }
  return blocs;
}

/**
 * L'élevage : le taux d'acceptation, qui est LA mesure du greffeur.
 *
 * ⚠️ Une session non relevée a `acceptees` à NULL. Traiter ce null comme un
 * zéro afficherait un échec là où il n'y a qu'une saisie en attente — et sur un
 * indicateur de savoir-faire, c'est le genre de faux qu'on ne pardonne pas.
 */
export function rendreElevage(sessions: SessionGreffageRow[]): string {
  if (sessions.length === 0)
    return 'Je ne vois aucune session de greffage enregistrée. Dès que tu en saisis une, je peux suivre ton taux d’acceptation et le comparer d’une session à l’autre.';

  const relevees = sessions.filter((s) => s.acceptees != null);
  const greffees = relevees.reduce((n, s) => n + s.greffees, 0);
  const acceptees = relevees.reduce((n, s) => n + (s.acceptees ?? 0), 0);
  const enAttente = sessions.length - relevees.length;

  const lignes: string[] = [
    `**${sessions.length} ${pluriel(sessions.length, 'session', 'sessions')} de greffage** ${pluriel(sessions.length, 'enregistrée', 'enregistrées')}.`,
  ];
  if (relevees.length && greffees > 0) {
    const taux = Math.round((acceptees / greffees) * 100);
    lignes.push(
      `Sur ${relevees.length} ${pluriel(relevees.length, 'session relevée', 'sessions relevées')} : ${acceptees} cellules acceptées sur ${greffees} greffées, soit **${taux} %**.`,
    );
  }
  if (enAttente)
    lignes.push(
      `${enAttente} ${pluriel(enAttente, 'session n’a', 'sessions n’ont')} pas encore de relevé d’acceptation : ${pluriel(enAttente, 'elle n’entre', 'elles n’entrent')} pas dans le calcul.`,
    );

  const derniere = sessions[0];
  if (derniere?.date)
    lignes.push(
      `Dernier greffage : ${dateFr(derniere.date)}${derniere.technique ? ` (${derniere.technique})` : ''}${derniere.lignee ? `, lignée ${derniere.lignee}` : ''}.`,
    );
  return lignes.join('\n\n');
}

/** Les figures de l'élevage : le taux, puis l'historique des sessions. */
export function blocsElevage(sessions: SessionGreffageRow[]): BlocMaya[] {
  if (sessions.length === 0) return [];
  const relevees = sessions.filter((s) => s.acceptees != null);
  const greffees = relevees.reduce((n, s) => n + s.greffees, 0);
  const acceptees = relevees.reduce((n, s) => n + (s.acceptees ?? 0), 0);
  const taux = greffees > 0 ? Math.round((acceptees / greffees) * 100) : null;

  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Sessions', valeur: String(sessions.length), ton: 'honey' },
        {
          label: 'Taux d’acceptation',
          valeur: taux == null ? '—' : `${taux} %`,
          ton: taux == null ? 'neutre' : taux >= 60 ? 'sage' : 'clay',
        },
        {
          label: 'En attente de relevé',
          valeur: String(sessions.length - relevees.length),
          ton: 'neutre',
        },
      ],
    },
  ];
  // Le graphe d'évolution demande AU MOINS deux sessions relevées : une seule
  // barre ne montre aucune progression, qui est tout l'intérêt du suivi.
  if (relevees.length > 1) {
    blocs.push({
      type: 'graphe',
      titre: 'Taux d’acceptation par session (%)',
      forme: 'ligne',
      serie: [...relevees].reverse().map((s) => ({
        label: s.date ? dateFr(s.date) : '—',
        valeur: s.greffees > 0 ? Math.round(((s.acceptees ?? 0) / s.greffees) * 100) : 0,
      })),
    });
  }
  return blocs;
}

/**
 * LA PROJECTION — ce qui peut arriver, jamais ce qui arrivera.
 *
 * Le moteur (`santePredictive.ts`) existait depuis longtemps et n'était servi
 * que par une route unique, `GET /api/ruches/[id]/prediction`. Maya, elle, ne
 * savait pas en parler : elle décrivait le présent, jamais la pente.
 *
 * Ici on l'exécute sur TOUT le cheptel en une passe, on ne garde que les
 * colonies qui portent un risque, et on rattache à chaque risque sa conséquence
 * probable (`maya-consequences.ts`). Le langage y est verrouillé par banc :
 * « peut », jamais « va ».
 */
export interface ProjectionRuche {
  numero: string;
  rucher: string;
  scoreActuel: number;
  score30j: number;
  tendance: 'hausse' | 'stable' | 'baisse';
  urgence: 'normale' | 'attention' | 'urgente';
  risques: string[];
  suggestions: string[];
  consequences: Consequence[];
}

const ORDRE_URGENCE_PROJECTION: Record<ProjectionRuche['urgence'], number> = {
  urgente: 0,
  attention: 1,
  normale: 2,
};

export function projeterCheptel(
  ruches: InspectionsRuche[],
  maintenant: Date,
): { projections: ProjectionRuche[]; sansDonnees: string[] } {
  const projections: ProjectionRuche[] = [];
  const sansDonnees: string[] = [];

  for (const r of ruches) {
    const p = predictSante(r.inspections, r.inspections, maintenant);
    // Aucune donnée : on le DIT, on ne projette pas. Un score plancher présenté
    // comme une prévision serait un chiffre inventé.
    if (p.donneesInsuffisantes) {
      sansDonnees.push(r.numero);
      continue;
    }
    if (p.risques.length === 0) continue; // rien à signaler, on ne meuble pas
    projections.push({
      numero: r.numero,
      rucher: r.rucher,
      scoreActuel: p.scoreActuel,
      score30j: p.scorePrediction30j,
      tendance: p.tendance,
      urgence: p.urgence,
      risques: p.risques,
      suggestions: p.suggestions,
      consequences: consequencesDe(p.risques),
    });
  }

  projections.sort(
    (a, b) =>
      ORDRE_URGENCE_PROJECTION[a.urgence] - ORDRE_URGENCE_PROJECTION[b.urgence] ||
      a.score30j - b.score30j,
  );
  return { projections, sansDonnees };
}

/** Le texte de la projection. Chaque risque est suivi de ce qui PEUT en découler. */
export function rendreProjection(projections: ProjectionRuche[], sansDonnees: string[]): string {
  if (projections.length === 0 && sansDonnees.length === 0)
    return 'Je ne vois aucune ruche active à projeter. Ajoute tes ruches, puis saisis un contrôle : c’est lui qui me donne de quoi anticiper.';

  if (projections.length === 0)
    return (
      `Rien d’inquiétant ne ressort de mes projections. ` +
      (sansDonnees.length
        ? `En revanche, ${sansDonnees.length} ${pluriel(sansDonnees.length, 'ruche n’a', 'ruches n’ont')} aucun contrôle saisi (${sansDonnees.slice(0, 6).join(', ')}) : je ne peux rien anticiper pour ${pluriel(sansDonnees.length, 'elle', 'elles')}.`
        : `Continue le suivi régulier, c’est lui qui rend l’anticipation possible.`)
    );

  const blocs = projections.slice(0, 5).map((p) => {
    const fleche = p.tendance === 'baisse' ? '↘' : p.tendance === 'hausse' ? '↗' : '→';
    const lignes = p.consequences
      .slice(0, 3)
      .map((c) => `  - ${c.risque} — ${c.consequence}.`)
      .join('\n');
    const quoiFaire = p.suggestions[0] ? `\n  → ${p.suggestions[0]}.` : '';
    return `**Ruche ${p.numero}** (${p.rucher}) — ${p.scoreActuel}/100 ${fleche} ${p.score30j}/100 à 30 jours\n${lignes}${quoiFaire}`;
  });

  const reste =
    projections.length > 5
      ? `\n\n_${projections.length - 5} autre${projections.length - 5 > 1 ? 's' : ''} colonie${projections.length - 5 > 1 ? 's' : ''} présente${projections.length - 5 > 1 ? 'nt' : ''} aussi des signaux — ouvre le module Ruches pour le détail._`
      : '';

  const manquantes = sansDonnees.length
    ? `\n\n${sansDonnees.length} ${pluriel(sansDonnees.length, 'ruche est', 'ruches sont')} sans contrôle saisi : je ne peux rien projeter pour ${pluriel(sansDonnees.length, 'elle', 'elles')}.`
    : '';

  /**
   * L'avertissement n'est pas de la modestie de façade. Une projection calculée
   * sur trois visites reste une TENDANCE, et le dire protège la crédibilité de
   * tout le reste : le jour où l'anticipation se trompe, l'apiculteur doit
   * pouvoir se rappeler qu'on ne lui avait rien promis.
   */
  return (
    `**Ce qui peut arriver dans les 30 jours**\n\n${blocs.join('\n\n')}${reste}${manquantes}\n\n` +
    `_Ce sont des tendances calculées sur tes derniers contrôles, pas des certitudes : plus tu saisis, plus elles se resserrent._`
  );
}

/** Les figures de la projection : l'urgence en chiffres, puis le détail. */
export function blocsProjection(projections: ProjectionRuche[]): BlocMaya[] {
  if (projections.length === 0) return [];
  const compte = (u: ProjectionRuche['urgence']) =>
    projections.filter((p) => p.urgence === u).length;
  const enBaisse = projections.filter((p) => p.tendance === 'baisse').length;

  return [
    {
      type: 'stats',
      items: [
        {
          label: 'Colonies à surveiller',
          valeur: String(projections.length),
          ton: compte('urgente') ? 'clay' : 'honey',
        },
        {
          label: 'Urgentes',
          valeur: String(compte('urgente')),
          ton: compte('urgente') ? 'clay' : 'sage',
        },
        { label: 'En baisse', valeur: String(enBaisse), ton: enBaisse ? 'clay' : 'sage' },
      ],
    },
    {
      type: 'tableau',
      titre: 'Projection à 30 jours',
      colonnes: ['Ruche', 'Aujourd’hui', 'Dans 30 j', 'Signal principal'],
      lignes: projections
        .slice(0, 8)
        .map((p) => [p.numero, `${p.scoreActuel}/100`, `${p.score30j}/100`, p.risques[0] ?? '—']),
    },
  ];
}

/**
 * Les deux bouts de la fenêtre météo : quand ouvrir, et quand s'abstenir.
 *
 * Maya ne savait dire que le MEILLEUR jour. C'est la moitié de la question :
 * « quand est-ce que je n'ouvre surtout pas » est au moins aussi utile sur le
 * terrain — une colonie ouverte par vent fort ou sous la pluie se refroidit, et
 * l'apiculteur se déplace pour rien.
 *
 * ⚠️ AUCUN SEUIL INVENTÉ ICI. Les paliers viennent de `palierScore`
 * (`server/utils/meteo.ts`), la même échelle que le reste du produit affiche :
 * excellent ≥ 80, bon ≥ 60, moyen ≥ 40, défavorable en dessous. Recopier un
 * seuil « qui semble raisonnable » créerait deux vérités pour une même donnée.
 */
export interface FenetresVisite {
  meilleur: MeteoJour | null;
  pire: MeteoJour | null;
  /** Les jours du palier « défavorable », du pire au moins pire. */
  aEviter: MeteoJour[];
}

export function fenetresVisite(previsions: MeteoJour[]): FenetresVisite {
  if (previsions.length === 0) return { meilleur: null, pire: null, aEviter: [] };
  const tri = [...previsions].sort((a, b) => b.scoreVisite - a.scoreVisite);
  const aEviter = tri
    .filter((j) => palierScore(j.scoreVisite).cle === 'defavorable')
    .sort((a, b) => a.scoreVisite - b.scoreVisite);
  return {
    meilleur: tri[0] ?? null,
    pire: tri[tri.length - 1] ?? null,
    aEviter,
  };
}

/** Le score de visite jour par jour — la figure qui répond à « quand ouvrir ». */
export function blocsMeteo(res: MeteoResultat): BlocMaya[] {
  const jours = res.previsions.slice(0, 7);
  if (jours.length === 0) return [];
  return [
    {
      type: 'graphe',
      titre: 'Conditions de visite, jour par jour (sur 100)',
      forme: 'barres',
      serie: jours.map((j) => ({ label: jourCourt(j.date), valeur: j.scoreVisite })),
    },
  ];
}

/** Les alertes par priorité, puis le détail. Sans alerte : rien à montrer. */
export function blocsAlertes(alertes: AlerteRow[]): BlocMaya[] {
  if (alertes.length === 0) return [];
  const compte = (p: string) =>
    alertes.filter((a) => (a.priorite ?? '').toLowerCase() === p).length;
  const hautes = compte('haute');
  const moyennes = compte('moyenne');
  // Tout ce qui n'est ni haute ni moyenne tombe en « basse » — y compris une
  // priorité absente. Compter à part laisserait des alertes hors du total.
  const basses = alertes.length - hautes - moyennes;

  return [
    {
      type: 'stats',
      items: [
        { label: 'À traiter', valeur: String(alertes.length), ton: hautes ? 'clay' : 'honey' },
        { label: 'Prioritaires', valeur: String(hautes), ton: hautes ? 'clay' : 'sage' },
        { label: 'Autres', valeur: String(moyennes + basses), ton: 'neutre' },
      ],
    },
    {
      type: 'tableau',
      titre: 'Ce qui demande ton attention',
      colonnes: ['Priorité', 'Alerte', 'Détail'],
      lignes: [...alertes]
        .sort((a, b) => ordrePriorite(a.priorite) - ordrePriorite(b.priorite))
        .slice(0, 8)
        .map((a) => [etiquettePriorite(a.priorite), a.titre, a.message ?? '—']),
    },
  ];
}

const ORDRE_PRIORITE: Record<string, number> = { haute: 0, moyenne: 1, basse: 2 };

function ordrePriorite(p: string | null): number {
  return ORDRE_PRIORITE[(p ?? '').toLowerCase()] ?? 3;
}

function etiquettePriorite(p: string | null): string {
  const v = (p ?? '').toLowerCase();
  if (v === 'haute') return 'Haute';
  if (v === 'moyenne') return 'Moyenne';
  return 'Basse';
}

/** Les ruches par rucher — la répartition du cheptel, d'un coup d'œil. */
export function blocsRuchers(ruchers: RucherRow[]): BlocMaya[] {
  if (ruchers.length === 0) return [];
  const total = ruchers.reduce((s, r) => s + r.nbRuchesActives, 0);
  const blocs: BlocMaya[] = [
    {
      type: 'stats',
      items: [
        { label: 'Ruchers', valeur: String(ruchers.length), ton: 'honey' },
        { label: 'Ruches actives', valeur: String(total), ton: 'sage' },
        {
          label: 'Moyenne par rucher',
          valeur: ruchers.length ? String(Math.round(total / ruchers.length)) : '0',
          ton: 'neutre',
        },
      ],
    },
  ];
  // Un seul rucher : le graphe de répartition n'aurait qu'une barre et ne
  // comparerait rien. On s'abstient plutôt que de meubler.
  if (ruchers.length > 1 && total > 0) {
    blocs.push({
      type: 'graphe',
      titre: 'Ruches actives par rucher',
      forme: 'barres',
      serie: ruchers.map((r) => ({ label: r.nom, valeur: r.nbRuchesActives })),
    });
  }
  return blocs;
}

/** Les interventions récentes par type — ce sur quoi le temps est passé. */
export function blocsInterventions(items: InterventionRow[]): BlocMaya[] {
  if (items.length === 0) return [];
  const parType = new Map<string, number>();
  for (const i of items) {
    const t = (i.type ?? 'autre').trim() || 'autre';
    parType.set(t, (parType.get(t) ?? 0) + 1);
  }
  const serie = [...parType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, valeur]) => ({ label, valeur }));

  const blocs: BlocMaya[] = [
    {
      type: 'tableau',
      titre: 'Dernières interventions',
      colonnes: ['Date', 'Type', 'Ruche'],
      lignes: items.slice(0, 8).map((i) => [dateFr(i.date), i.type ?? '—', i.ruche ?? '—']),
    },
  ];
  // Un seul type d'intervention : le graphe ne dirait rien de plus que le
  // tableau. Deux ou plus, la répartition devient une information.
  if (serie.length > 1) {
    blocs.unshift({
      type: 'graphe',
      titre: 'Répartition par type',
      forme: 'barres',
      serie,
    });
  }
  return blocs;
}

function rendreMeteo(res: MeteoResultat | { erreur: string }): string {
  if ('erreur' in res) {
    if (res.erreur === 'aucun_rucher')
      return "Je n'ai pas trouvé de rucher à analyser. Ajoute un rucher avec ses coordonnées GPS pour obtenir la météo et les conditions de visite.";
    return "Ce rucher n'a pas de coordonnées GPS enregistrées : je ne peux pas récupérer la météo. Ajoute sa latitude/longitude dans sa fiche.";
  }
  const lignes = res.previsions
    .slice(0, 5)
    .map((j) => {
      const icone = j.scoreVisite >= 70 ? '' : j.scoreVisite >= 45 ? '' : '';
      return `- ${icone} **${dateFr(j.date)}** : ${j.conditions}, ${Math.round(j.tempMax)}°C, vent ${Math.round(j.ventMaxKmh)} km/h, pluie ${j.pluieMm} mm — visite ${j.scoreVisite}/100`;
    })
    .join('\n');
  const { meilleur, aEviter } = fenetresVisite(res.previsions);
  const conseil =
    meilleur && meilleur.scoreVisite >= 60
      ? `\n\nMeilleure fenêtre pour ouvrir les ruches : **${dateFr(meilleur.date)}** (score ${meilleur.scoreVisite}/100).`
      : `\n\nConditions moyennes sur la période — privilégiez les créneaux les plus doux et secs, et évitez d'ouvrir par vent fort ou pluie.`;
  /**
   * L'AUTRE BOUT DE LA FENÊTRE. Savoir quand ouvrir ne dit pas quand
   * s'abstenir, et sur le terrain la seconde information vaut la première : une
   * colonie ouverte par vent fort se refroidit, et le déplacement est perdu.
   * On ne nomme que les jours du palier « défavorable » — pas « le moins bon
   * jour », qui pointerait un jour parfaitement praticable dans une bonne semaine.
   */
  const eviter = aEviter.length
    ? `\n\n${aEviter.length > 1 ? 'Jours à éviter' : 'Jour à éviter'} : ` +
      aEviter
        .slice(0, 3)
        .map((j) => `**${dateFr(j.date)}** (${j.scoreVisite}/100, ${j.conditions.toLowerCase()})`)
        .join(', ') +
      ` — n'ouvre pas, la colonie se refroidit pour rien.`
    : '';
  return `**Conditions de visite — rucher ${res.rucher}** (5 jours)\n\n${lignes}${conseil}${eviter}`;
}

function rendreAlertes(alertes: Awaited<ReturnType<typeof getAlertes>>): string {
  if (alertes.length === 0)
    return "Tu n'as **aucune alerte active** en ce moment. Tout est à jour !";
  const parPrio = (p: string | null) => (p === 'critique' ? 0 : p === 'haute' ? 1 : 2);
  const triees = [...alertes].sort((a, b) => parPrio(a.priorite) - parPrio(b.priorite));
  const lignes = triees
    .slice(0, 10)
    .map((a) => {
      const badge = a.priorite === 'critique' ? '' : a.priorite === 'haute' ? '' : '';
      return `- ${badge} **${a.titre}**${a.message ? ` — ${a.message}` : ''}`;
    })
    .join('\n');
  return `Tu as **${alertes.length} ${pluriel(alertes.length, 'alerte active', 'alertes actives')}**, par priorité :\n\n${lignes}`;
}

function rendreRuchers(ruchers: Awaited<ReturnType<typeof getRuchers>>): string {
  if (ruchers.length === 0)
    return "Tu n'as pas encore de rucher enregistré. Crée ton premier rucher pour commencer à suivre tes colonies.";
  const total = ruchers.reduce((s, r) => s + r.nbRuchesActives, 0);
  const lignes = ruchers
    .map(
      (r) =>
        `- **${r.nom}**${r.commune ? ` (${r.commune})` : ''} : ${r.nbRuchesActives} ${pluriel(r.nbRuchesActives, 'ruche', 'ruches')}`,
    )
    .join('\n');
  return `Tu gères **${total} ${pluriel(total, 'ruche', 'ruches')}** réparties sur **${ruchers.length} ${pluriel(ruchers.length, 'rucher', 'ruchers')}** :\n\n${lignes}`;
}

function rendreInterventions(items: Awaited<ReturnType<typeof getInterventionsRecentes>>): string {
  if (items.length === 0)
    return "Aucune intervention enregistrée pour l'instant. Chaque visite, traitement ou récolte saisi alimente ton registre et le suivi de tes colonies.";
  const lignes = items
    .slice(0, 10)
    .map(
      (i) =>
        `- **${dateFr(i.date)}** — ${i.type ?? 'intervention'}${i.ruche ? ` (ruche ${i.ruche})` : ''}`,
    )
    .join('\n');
  return `Tes **${items.length} dernières interventions** :\n\n${lignes}`;
}

// ─── Contextualisation du savoir (C2) ────────────────────────────────────────

/** Conseil saisonnier par mois (index 0 = janvier) — pur, sans accès base. */
const CONSEILS_MOIS: string[] = [
  'cœur de l’hiver : colonies en grappe, surveillez le poids des ruches et traitez le varroa hors couvain ; n’ouvrez pas par grand froid.',
  'fin d’hiver : premières sorties par beau temps, vérifie les réserves et préparez ton matériel.',
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
  return `_Nous sommes en ${mois} — ${CONSEILS_MOIS[maintenant.getMonth()]}_\n\n`;
}

/** Rappel du cheptel actif, injecté en tête des fiches liées aux ruches. */
async function contexteRuches(userId: string): Promise<string> {
  try {
    const ruches = await getRuchesSante(userId);
    const actives = ruches.filter((r) => r.statut === 'active').length;
    if (actives === 0) return '';
    return `_Pour ton exploitation : tu suis actuellement **${actives}** ${pluriel(actives, 'ruche active', 'ruches actives')}._\n\n`;
  } catch {
    // La contextualisation est un bonus : son échec ne doit jamais priver
    // l'utilisateur de la fiche de savoir demandée.
    return '';
  }
}

// ─── Salutations & méta ──────────────────────────────────────────────────────

function estSalutation(norm: string): boolean {
  return /^(bonjour|salut|salutations|coucou|hello|bonsoir|hey|yo|merci|au revoir|bonne journee|bonne soiree|bonne aprem|a bientot|a plus|a demain|bonne nuit|parfait|super|genial|geniale|impeccable|nickel|excellent|bravo|tres bien|avec plaisir|cool|top)\b/.test(
    norm,
  );
}

/** Question « méta » sur le Copilote lui-même (que sais-tu faire, qui es-tu…). */
function estCapacites(norm: string): boolean {
  return (
    /\b(que (peux|sais)[ -]?tu faire|tu peux faire quoi|a quoi (tu sers|sers tu|sert (le|ce) copilote)|tu sers a quoi|qui es[ -]?tu|comment ca marche|comment tu fonctionnes|tes capacites|tu fais quoi|tu sais faire quoi|tu sais faire)\b/.test(
      norm,
    ) || /^(aide|help|capacites|menu|options)$/.test(norm)
  );
}

const APERCU_CAPACITES =
  'Moi c’est **Maya**, ta complice apicole. Concrètement, je peux :\n\n- **agir sur tes données** — ruches à visiter, point santé, stocks bas, finances, météo de tes ruchers, alertes ;\n- **répondre à tes questions d’apiculture** — biologie de l’abeille, conduite du rucher, varroa et maladies, réglementation, produits, calendrier ;\n- **noter une intervention pour toi** et t’emmener sur la bonne page en un mot.\n\nDis-moi simplement ce dont tu as besoin, comme tu le dirais à un voisin apiculteur.';

/**
 * L'apiculteur a-t-il simplement NOMMÉ un produit ou une enseigne ?
 *
 * « C'est quoi l'Apivar ? », « Apitraz », « ICKO », « la Jocondienne » : ce
 * n'est pas une question de choix (« quel traitement contre le varroa ? »,
 * qui appelle un calcul), c'est une demande de fiche. Deux points d'entrée s'y
 * ramènent, et il fallait les couvrir tous les deux :
 *
 *  - `savoir` quand le corpus contient un article proche, qui répondait alors
 *    à côté de la question posée ;
 *  - `inconnu` quand il n'en contient aucun — Maya répondait « je n'ai pas bien
 *    saisi » sur un nom de marque qu'elle connaît pourtant par cœur.
 *
 * Les fiches disent aussi ce qu'elles NE savent pas (une enseigne : ni
 * catalogue, ni prix, ni stock) et se terminent par une proposition d'action.
 * C'est la règle du projet : jamais de donnée inventée, jamais de cul-de-sac.
 */
export function ficheProduitOuEnseigne(norm: string): CopiloteReponse | null {
  if (viseFicheProduit(norm)) {
    const produit = identifierProduitParMarque(norm);
    if (produit) return { texte: rendreFicheProduit(produit), manque: false };
  }
  if (viseFicheFournisseur(norm)) {
    const enseigne = identifierFournisseur(norm);
    if (enseigne) return { texte: rendreFicheFournisseur(enseigne), manque: false };
  }
  return null;
}

/** Réponse de courtoisie adaptée au type de salutation détecté (variée à chaque fois). */
function reponseSalutation(norm: string): string {
  if (/^merci/.test(norm)) return voix('remerciement');
  if (
    /^(au revoir|bonne journee|bonne soiree|bonne aprem|a bientot|a plus|a demain|bonne nuit)/.test(
      norm,
    )
  )
    return voix('adieu');
  if (
    /^(parfait|super|genial|geniale|impeccable|nickel|excellent|bravo|tres bien|avec plaisir|cool|top)/.test(
      norm,
    )
  )
    return voix('compliment');
  if (/^(salut|coucou|hey|yo|hello)/.test(norm)) return voix('salut');
  return `Bonjour ! ${APERCU_CAPACITES}`;
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
/**
 * Nombre de fiches où chaque mot-clé apparaît. Calculé une fois, à la demande.
 *
 * Sert à mesurer le POUVOIR DISCRIMINANT d'un mot : « ruche » figure dans 22
 * fiches et « abeilles » dans 18 — ils ne désignent donc aucune fiche en
 * particulier. À l'inverse, un mot propre à une seule fiche la désigne à lui
 * seul.
 */
let _freqCles: Map<string, number> | null = null;
function freqCles(): Map<string, number> {
  if (_freqCles) return _freqCles;
  const m = new Map<string, number>();
  for (const article of SAVOIR) {
    const vus = new Set<string>();
    for (const cle of article.motsCles) {
      for (const t of normaliser(cle).split(' ').filter(Boolean).map(racine)) vus.add(t);
    }
    for (const t of vus) m.set(t, (m.get(t) ?? 0) + 1);
  }
  _freqCles = m;
  return m;
}

/**
 * Poids d'un mot-clé ISOLÉ. Tous valaient 3, si bien qu'« abeilles » pesait
 * autant que « nourrissement » — et à égalité de score c'est l'ORDRE DE
 * DÉCLARATION qui tranchait, ce qui favorisait mécaniquement les fiches
 * générales, déclarées en tête. D'où « il faut nourrir les abeilles en hiver ? »
 * qui répondait « Les abeilles : l'essentiel » (corpus Maya, 22/07/2026).
 *
 * On BONIFIE la rareté, on ne pénalise jamais : tout mot-clé retenu conserve son
 * poids historique de 3, donc aucune question qui atteignait le seuil ne peut le
 * perdre. Seul le classement change — et c'est précisément ce qu'on veut.
 * (Une première version qui abaissait les mots courants faisait retomber deux
 * questions en « incompris » : le seuil n'était plus atteint.)
 */
function poidsCle(t: string): number {
  const f = freqCles().get(t) ?? 1;
  if (f <= 1) return 6; // n'appartient qu'à une fiche : elle est désignée
  if (f <= 3) return 5;
  if (f <= 6) return 4;
  return 3; // passe-partout — poids historique, jamais moins
}

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
          // Mot-clé seul : pondéré par son pouvoir discriminant (cf. `poidsCle`).
          score += poidsCle(cle0);
        } else if (cle0.length >= 5 && motsLongs.some((m) => distanceMax1(m, cle0))) {
          // Tolérance fautes de frappe sur mots-clés longs (varoa → varroa)
          score += poidsCle(cle0);
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

/**
 * Intention EXPLICITE d'apprendre sur un sujet (« explique-moi… », « parle-moi
 * de… », « dis m'en plus », « c'est quoi… », « tout savoir sur… »). Quand elle
 * est présente, on abaisse le seuil de savoir : l'utilisateur CIBLE un sujet —
 * autant lui donner la fiche la plus proche que le repli « voici mes capacités ».
 * Testée sur la forme normalisée (apostrophes/traits d'union → espaces).
 */
const INTENT_APPRENDRE =
  /\b(explique|expliquer|explication|apprends|apprendre|apprenez|enseigne|enseigner|enseignes|initie moi|initiation|forme moi|parle moi|parle nous|parler de|parler des|dis m en plus|dis moi|dis nous|raconte|presente|c est quoi|qu est ce que|qu est ce qu|je veux savoir|je veux en savoir|en savoir plus|definis|definition|tout savoir|info sur|infos sur)\b/;

/**
 * Intention de RECOMMANDATION / COMPARAISON (« préconise X ou Y », « lequel
 * choisir », « différence entre… »). Route vers une fiche COMPARATIVE dédiée
 * plutôt que vers une simple définition. Ne se déclenche QUE si un terme produit
 * connu est présent (sinon la comparaison d'ANNÉES reste gérée par l'intent
 * finances, testé avant).
 */
const INTENT_COMPARAISON =
  /\b(preconise|preconises|preconiser|recommande|recommandes|recommander|conseille|conseilles|conseiller|choisir|lequel|laquelle|quel varroacide|quel traitement|quel modele|quelle ruche|difference entre|differences entre|mieux vaut|vaut mieux|plutot que|versus|comparer|comparaison|avantages|inconvenients)\b/;

/** Termes produits → fiche comparative. Comparaison si (verbe + ≥1 terme) OU ≥2 termes. */
const COMPARATIFS: { termes: string[]; articleId: string }[] = [
  {
    termes: [
      'varroacide',
      'varroacides',
      'apivar',
      'amitraze',
      'apitraz',
      'apistan',
      'fluvalinate',
      'oxalique',
      'formique',
      'thymol',
      'apiguard',
      'lanieres',
    ],
    articleId: 'comparatif-varroacides',
  },
  {
    termes: ['sirop', 'candi', 'proteique', 'nourrissement', 'nourrir'],
    articleId: 'comparatif-nourrissement',
  },
  {
    termes: ['dadant', 'langstroth', 'warre', 'kenyane'],
    articleId: 'types-ruches',
  },
];

/**
 * DÉLIBÉRATION : l'apiculteur pèse deux options (« je récolte maintenant OU
 * j'attends ? », « je traite maintenant ou plus tard ? »). C'est une demande de
 * CONSEIL, pas de lecture — même si un mot (« beau temps », « demain ») a
 * déclenché une intention de navigation. Motifs volontairement resserrés autour
 * de « … ou j'attends / ou attendre / maintenant ou … » pour ne pas capter un
 * « ou » de simple énumération.
 */
const DELIBERATION =
  /\b(maintenant ou|aujourd hui ou|tout de suite ou|ce soir ou|ou j attends|ou j attend|ou attendre|ou est ce que je dois|ou est ce qu il faut|ou est il preferable|vaut il mieux|ou vaut il mieux|ou plutot attendre|ou je patiente)\b/;

/** Fiche comparative visée si le message est une comparaison de produits, sinon null. Pur. */
function routerComparaison(norm: string): string | null {
  const verbe = INTENT_COMPARAISON.test(norm);
  for (const c of COMPARATIFS) {
    const presents = c.termes.filter((t) => contientTrigger(norm, t)).length;
    if ((verbe && presents >= 1) || presents >= 2) return c.articleId;
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
  // Correction orthographique des mots logiques (fautes qui bloquent la
  // compréhension) AVANT toute détection → bénéficie aux intents ET au savoir.
  const brut = corrigerTexte(normaliser(question));
  // La salutation se juge sur la forme brute (avant synonymes).
  const estSal = estSalutation(brut);
  // Salutation manifestement « pure » (courte) → courtoisie directe.
  if (estSal && brut.split(' ').length <= 3) return { kind: 'salutation' };
  if (estCapacites(brut)) return { kind: 'capacites' };

  // Synonymes appliqués pour la détection d'intention et la recherche de savoir.
  const norm = appliquerSynonymes(brut);

  const intent = detecterIntent(norm);
  if (intent) {
    // DÉLIBÉRATION (« je récolte maintenant ou j'attends le beau temps ? ») :
    // ce n'est PAS une demande de lecture. Un mot y déclenche parfois une
    // intention (ici « beau temps » → météo), mais l'apiculteur pèse une
    // décision — l'envoyer sur une page météo lui laisse refaire le raisonnement
    // tout seul. Si le savoir sait répondre, on raisonne plutôt qu'on navigue.
    if (DELIBERATION.test(norm)) {
      const s = chercherSavoir(norm);
      if (s) return { kind: 'savoir', articleId: s.article.id };
    }
    return { kind: 'action', intent };
  }

  // Recommandation/comparaison de PRODUITS (« préconise Apivar ou oxalique »,
  // « dadant ou langstroth ») → fiche comparative dédiée, jamais une définition.
  const comparaison = routerComparaison(norm);
  if (comparaison) return { kind: 'savoir', articleId: comparaison };

  const savoir = chercherSavoir(norm);
  if (savoir) return { kind: 'savoir', articleId: savoir.article.id };

  // Intention explicite d'apprendre (« explique-moi X », « dis m'en plus sur X ») :
  // seuil abaissé → on renvoie la meilleure fiche même faiblement matchée.
  if (INTENT_APPRENDRE.test(brut)) {
    const best = rechercherArticles(norm)[0];
    if (best && best.score >= 1) return { kind: 'savoir', articleId: best.article.id };
  }

  // Salutation longue mais SANS rien d'actionnable derrière (« bonne nuit mon
  // ami », « merci beaucoup de tout ») → courtoisie plutôt que repli sec.
  if (estSal) return { kind: 'salutation' };

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
  | { kind: 'ecriture'; ecriture: Ecriture }
  | { kind: 'lot'; cible: CibleRuches; template: InterventionParsee }
  | { kind: 'sequence'; clauses: string[] }
  | { kind: 'choisir_type' }
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
 * La même interrogation, mais REJETÉE EN FIN DE PHRASE — c'est ainsi qu'on parle.
 *
 * `INTERRO_INFO` est ancré au début : il attrape « comment traiter le varroa »
 * et rate « la ruche a essaimé je fais quoi ». Or la seconde forme est la plus
 * courante à l'oral, et c'est celle du débutant inquiet qui raconte d'abord ce
 * qu'il voit et demande ensuite quoi faire.
 *
 * L'enjeu n'est pas cosmétique. Faute d'être reconnue comme une question, la
 * phrase repart dans la détection d'ÉCRITURE : « la ruche a essaimé je fais
 * quoi » ouvrait un formulaire d'intervention, et « comment faire du sirop »
 * aussi. Maya proposait de noter une visite à quelqu'un qui appelait à l'aide.
 */
const INTERRO_FINALE =
  /\b(je fais quoi|on fait quoi|quoi faire|je dois faire quoi|c est quoi|pourquoi|comment|comment faire|quand)\s*[?!.]*\s*$/;

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
  // Forme corrigée pour la DÉTECTION (intents/LOT/nav). Les extracteurs de contenu
  // reçoivent `question` brut (on ne réécrit jamais une note/un nom de client).
  const brut = corrigerTexte(normaliser(question));
  // Garde-fou d'entrée : rien d'exploitable → on présente les capacités.
  if (!brut) return { kind: 'capacites' };

  const base = classifier(question);

  if (base.kind === 'salutation') return { kind: 'salutation', texteBrut: brut };
  if (base.kind === 'capacites') return { kind: 'capacites' };

  // Une question d'information (« comment… », « pourquoi… », « … ? ») n'est pas
  // un ordre : on n'écrit pas et on ne navigue pas dessus.
  const infoQuestion = INTERRO_INFO.test(brut) || INTERRO_FINALE.test(brut);
  const estQuestion = infoQuestion || question.includes('?');

  // Actions explicites (écrire, naviguer) AVANT les intentions de lecture :
  // « note une intervention… » ne doit pas être lu comme « mes interventions ».
  if (!infoQuestion) {
    // Séquence composée (« ajoute le client Jean PUIS récolte 25 kg de lavande »,
    // « note un contrôle ruche 3 ENSUITE pèse la ruche 5 ») — AVANT toute détection
    // mono-action : sinon un analyseur prendrait la phrase entière (le nom du client
    // deviendrait « Jean puis récolte… »). On exige ≥ 2 clauses à tête d'action et
    // AUCUNE clause de type LOT (v1 ne compose pas des lots).
    const clausesSeq = decouperSequence(question);
    if (clausesSeq && !clausesSeq.some((c) => estCommandeLotEcriture(c))) {
      return { kind: 'sequence', clauses: clausesSeq };
    }

    // Création de client : à tester AVANT la navigation (« crée un client Jean »
    // matcherait sinon le raccourci « clients »).
    const client = analyserClient(brut, question);
    if (client) return { kind: 'ecriture', ecriture: { action: 'client', parse: client } };

    // Récolte de production (« j'ai récolté 25 kg de toutes fleurs ») : AVANT
    // l'intervention, car « récolté » + kg = production, pas une visite.
    const recolte = analyserRecolteProd(brut, question);
    if (recolte) return { kind: 'ecriture', ecriture: { action: 'recolte', parse: recolte } };

    // Commande en LOT (multi-ruches) — AVANT le flux mono-ruche : « traite le
    // varroa sur toutes les ruches du rucher Nord », « note un contrôle force 3
    // calme sur les 3, 5 et 7 ». Le sélecteur de cibles pilote le ciblage ; le
    // template d'intervention (type + données partagées) est fan-out en plan.
    // On exige un vrai signal d'écriture (jamais une lecture/question).
    if (estCommandeLotEcriture(brut)) {
      const cible = extraireCibles(brut);
      if (cible) {
        const template = analyserIntervention(brut, question);
        // La cible pilote le ciblage : on neutralise tout numéro isolé capté.
        template.rucheNumero = undefined;
        template.rucheLabel = undefined;
        return { kind: 'lot', cible, template };
      }
    }

    // Intervention (FLUX GUIDÉ) — IMPÉRATIVEMENT avant le stock et la navigation.
    // resoudreFluxIntervention gère d'un seul bloc, en relisant l'historique :
    // • l'écriture détaillée (« note une visite ruche 7 reine vue… ») ;
    // • l'intention NUE (« fais une intervention ») → on PROPOSE le type ;
    // • la complétion champ par champ (réponses « Contrôle », « Force 3 »,
    // « la 12 »…) — y compris le slot-filling de la ruche.
    // Le placer avant le stock empêche celui-ci de voler une réponse de slot
    // (« 2 kg »), et avant la navigation empêche qu'un libellé de chip de ruche
    // (« Ruche 2 — Rucher … ») soit pris pour une demande « ruchers ».
    const flux = resoudreFluxIntervention(
      messages.filter((m) => m.role === 'user').map((m) => m.content),
      estQuestion,
    );
    if (flux) {
      if (flux.etat === 'choisir_type') return { kind: 'choisir_type' };
      // Réponse à « sur quelle ruche ? » désignant PLUSIEURS ruches, un rucher
      // entier ou toutes → on bascule sur le moteur LOT (fan-out), avec
      // l'intervention déjà renseignée pas-à-pas comme template. Uniquement quand
      // tout le reste est complet (plus aucun champ à demander).
      if (flux.parse.manque.length === 0) {
        const cibleMulti = extraireCibles(brut);
        if (cibleMulti) {
          return {
            kind: 'lot',
            cible: cibleMulti,
            template: {
              ...flux.parse,
              rucheNumero: undefined,
              rucheLabel: undefined,
              rucherIndice: undefined,
            },
          };
        }
      }
      return { kind: 'ecriture', ecriture: { action: 'intervention', parse: flux.parse } };
    }

    // Mouvement de stock (« ajoute 12 pots au stock », « j'ai utilisé 3 cadres »).
    const stock = analyserStock(brut, question);
    if (stock) return { kind: 'ecriture', ecriture: { action: 'stock', parse: stock } };

    // La navigation CÈDE devant une intention explicite. « Dis-moi quelles
    // ruches je dois aller voir aujourd'hui » contient « aller voir », donc la
    // navigation s'y reconnaissait — mais l'apiculteur demande la LISTE, pas
    // qu'on l'emmène sur une page. Répondre par un déplacement, c'est lui faire
    // refaire le travail lui-même (corpus Maya, 22/07/2026).
    const cible = detecterNavigation(brut);
    if (cible && base.kind !== 'action') return { kind: 'navigation', cible };
  }

  if (base.kind === 'action') return { kind: 'action', intent: base.intent, suivi: false };
  if (base.kind === 'savoir') {
    const clar = clarifier(appliquerSynonymes(brut));
    if (clar) return { kind: 'clarification', titres: clar.titres };
    return { kind: 'savoir', articleId: base.articleId };
  }

  // base.kind === 'inconnu'
  // 1) Reprise du contexte précédent (suivi elliptique : « et 2024 ? »).
  if (estSuivi(brut)) {
    const prec = contextePrecedent(messages);
    if (prec?.kind === 'action') return { kind: 'action', intent: prec.intent, suivi: true };
    if (prec?.kind === 'savoir') return { kind: 'savoir', articleId: prec.articleId };
  }
  // 2) Near-miss : plutôt qu'un échec sec, proposer les fiches les plus proches
  // (≥ 2 points : un indice sérieux, mais sous le seuil de réponse directe).
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
  /**
   * Plan de l'ESPACE. Requis, jamais optionnel : une valeur par défaut
   * rouvrirait le contournement de catalogue à la première étourderie — et
   * c'est un défaut qui ne se voit pas, puisqu'il se manifeste par une réponse
   * PLUS généreuse que prévu.
   */
  plan: Plan,
): Promise<CopiloteReponse> {
  // Tout le raisonnement d'un tour (classification + lectures/écritures DB).
  const executer = async (): Promise<CopiloteReponse> => {
    // En conversation, on veut de la VARIATION d'un message à l'autre : on repasse
    // en tirage aléatoire (une graine d'un brief précédent ne doit pas figer la voix).
    resetVoix();
    const decision = classifierTour(messages);
    const norm = appliquerSynonymes(corrigerTexte(normaliser(dernierMessageUtilisateur(messages))));

    switch (decision.kind) {
      case 'salutation':
        return { texte: reponseSalutation(decision.texteBrut), manque: false };

      case 'capacites':
        return { texte: APERCU_CAPACITES, suggestions: SUGGESTIONS_FALLBACK, manque: false };

      case 'navigation': {
        const ouverture = gabarit(voix('ouvreNavigation'), `**${decision.cible.label}**`);
        const texte = decision.cible.invite
          ? `${ouverture}\n\n${decision.cible.invite}`
          : ouverture;
        return {
          texte,
          navigation: { label: decision.cible.label, to: decision.cible.to, auto: true },
          manque: false,
        };
      }

      case 'choisir_type':
        return {
          texte: voix('choisirType'),
          suggestions: LIBELLES_TYPES_INTERVENTION,
          manque: false,
        };

      case 'ecriture': {
        const prev = await previsualiserAction(userId, decision.ecriture);
        if (prev.ok) {
          // Autonomie hybride : le réversible (interventions, notes, pesées,
          // comptage varroa, RDV) est exécuté DIRECTEMENT par la route, qui
          // proposera « Annuler ». Le sensible (vente, client, stock, récolte)
          // reste en confirmation explicite.
          if (estActionAuto(decision.ecriture.action)) {
            return {
              texte: '',
              autoExecute: { actionId: decision.ecriture.action, params: prev.params },
              manque: false,
            };
          }
          return {
            texte: prev.apercu,
            confirmation: { actionId: decision.ecriture.action, params: prev.params },
            manque: false,
          };
        }
        return {
          texte: prev.message,
          suggestions: prev.suggestions,
          navigation: prev.navigation,
          manque: true,
        };
      }

      case 'lot':
        return repondreLot(userId, decision.cible, decision.template);

      case 'sequence':
        return repondreSequence(userId, decision.clauses);

      case 'action':
        return executerIntent(userId, decision.intent, norm, plan);

      case 'savoir': {
        // Une MARQUE citée telle quelle (« c'est quoi l'Apivar ? », « ICKO »)
        // n'est pas une question de choix : l'apiculteur veut la fiche, pas une
        // recommandation calculée. On la sert avant tout le reste, sinon le
        // corpus répondait à côté avec l'article générique le plus proche.
        const fiche = ficheProduitOuEnseigne(norm);
        if (fiche) return fiche;

        // Avant de réciter la fiche comparative, on regarde si la question porte
        // assez de contraintes pour CALCULER une recommandation — c'est la
        // demande produit : « pas la suggestion intelligente mais le calcul
        // informatif d'après la question ». Sans critère lisible,
        // `recommanderVarroacide` rend `null` et la fiche reprend la main.
        const mois = new Date().getMonth() + 1;
        if (viseVarroacide(norm)) {
          const reco = recommanderVarroacide(lireCriteres(norm, mois));
          if (reco) return { texte: rendreRecommandation(reco), manque: false };
        }
        if (viseNourrissement(norm)) {
          const reco = recommanderNourrissement(lireCriteresNourrissement(norm, mois));
          if (reco) return { texte: rendreRecommandationNourrissement(reco), manque: false };
        }
        if (viseTypeRuche(norm)) {
          const reco = recommanderRuche(lireUsageRuche(norm));
          if (reco) return { texte: rendreRecommandationRuche(reco), manque: false };
        }
        return rendreArticle(userId, decision.articleId);
      }

      case 'clarification':
        return {
          texte: `Je veux être sûr de bien te répondre. Tu parles plutôt de :`,
          suggestions: [`${decision.titres[0]} ?`, `${decision.titres[1]} ?`],
          manque: false,
        };

      case 'suggestion':
        return {
          texte: "Je ne suis pas sûr d'avoir bien compris. Tu voulais peut-être :",
          suggestions: decision.titres.map((t) => `${t} ?`),
          manque: true,
        };

      case 'inconnu': {
        // Une marque que le corpus ne connaît pas atterrit ICI : « Apitraz »,
        // « la Jocondienne »… n'ouvrent aucun article. Sans ce rattrapage, Maya
        // répondait « je n'ai pas bien saisi » sur un nom qu'elle connaît
        // pourtant parfaitement.
        const ficheInconnue = ficheProduitOuEnseigne(norm);
        if (ficheInconnue) return ficheInconnue;

        // Jamais de cul-de-sac : on propose les sujets les MOINS loin (score > 0,
        // sous le seuil de réponse directe) + une porte d'entrée « parcours
        // d'apprentissage ». Faute de tout signal, on présente les capacités.
        const proches = rechercherArticles(norm)
          .filter((m) => m.score > 0)
          .slice(0, 3)
          .map((m) => `${m.article.titre} ?`);
        if (proches.length) {
          return {
            texte: "Je ne suis pas sûr d'avoir bien compris. Tu cherchais peut-être :",
            suggestions: [...proches, 'Apprends-moi l’apiculture'],
            manque: true,
          };
        }
        return {
          texte: `Je n'ai pas bien saisi ta demande. ${APERCU_CAPACITES}`,
          suggestions: [...SUGGESTIONS_FALLBACK, 'Apprends-moi l’apiculture'],
          manque: true,
        };
      }
    }
  };

  // Résilience serverless : un échec vient le plus souvent d'un pool dont les
  // sockets TCP sont morts pendant le gel de la lambda. On recycle le pool et
  // on retente une fois — Maya ne doit pas « tomber » sur un simple réveil de
  // base. dbWatchdog borne aussi une requête restée pendante (échec rapide).
  try {
    return await dbWatchdog(executer(), 'copilote', 9000);
  } catch (err1) {
    await resetDb().catch(() => {});
    try {
      return await dbWatchdog(executer(), 'copilote (relance)', 9000);
    } catch (err2) {
      // Identité d'erreur front-loadée : les logs Vercel tronquent ET n'indexent
      // (recherche plein-texte) que le préfixe du message. On met donc le
      // nom/code/1re frame EN TÊTE pour les rendre visibles et recherchables.
      const identite = (e: unknown): string => {
        const x = e as { name?: string; message?: string; code?: string; stack?: string };
        const frame = (x?.stack ?? '').split('\n')[1]?.trim() ?? '';
        return `${x?.name ?? typeof e}|${x?.code ?? '-'}|${x?.message ?? String(e)} @ ${frame}`;
      };
      console.error(`[cop-err] ${identite(err2)} ;; init: ${identite(err1)}`);
      return {
        texte:
          'Je rencontre un souci technique momentané. Réessayez dans un instant — tes données ne sont pas affectées.',
        manque: true,
      };
    }
  }
}

/** Compatibilité : réponse à une question isolée (un seul tour utilisateur). */
export function repondreLocal(
  userId: string,
  question: string,
  plan: Plan,
): Promise<CopiloteReponse> {
  return repondreConversation(userId, [{ role: 'user', content: question }], plan);
}

/** Libellés des champs requis d'une intervention (message d'aide du lot). */
const LABELS_CHAMPS_LOT: Record<string, string> = {
  forceColonie: 'la force (1-4)',
  comportement: 'le comportement (calme / agitée / agressive)',
  type: 'le type de nourriture',
  quantite: 'la quantité',
  unite: "l'unité",
  nombreVarroas: 'le nombre de varroas',
  poidsKg: 'le poids (en kg)',
  typeProduit: 'le produit récolté',
  texte: 'la note à écrire',
};

/**
 * Réponse à une commande en LOT : résout les cibles en ruches réelles, vérifie que
 * le template est complet (champs requis fournis d'un bloc — pas de slot-filling
 * pas-à-pas en v1), puis construit un PLAN fan-out prévisualisé avec UNE seule
 * confirmation. L'exécution transactionnelle a lieu côté route après « Confirmer ».
 */
async function repondreLot(
  userId: string,
  cible: CibleRuches,
  template: InterventionParsee,
): Promise<CopiloteReponse> {
  const ruches = await resoudreCibles(userId, cible);
  if (ruches.length === 0) {
    return {
      texte: `Je ne trouve aucune ruche correspondant à **${libelleCible(cible)}** Vérifie le rucher (ou les numéros) et je m'en occupe.`,
      manque: true,
    };
  }

  // Garde : « traite les ruches 1,2,3 » — un verbe de soin SANS type reconnu
  // (« traite » n'est pas un type d'intervention) dégénère en note libre
  // reproduisant la commande. On demande plutôt le type d'intervention à appliquer.
  if (template.type === 'commentaire') {
    const note = normaliser((template.donnees as { texte?: string }).texte ?? '');
    if (/\btraite\w*|traitement\b/.test(note) && !/\b(varroa|acarien)\b/.test(note)) {
      return {
        texte: `Quel type d'intervention veux-tu appliquer à ces **${ruches.length} ruche${ruches.length > 1 ? 's' : ''}** ? Choisis ci-dessous et je m'en occupe`,
        suggestions: LIBELLES_TYPES_INTERVENTION,
        manque: true,
      };
    }
  }

  const requis = manqueRequisIntervention(template);
  if (requis.length > 0) {
    const champs = requis.map((k) => LABELS_CHAMPS_LOT[k] ?? k).join('et');
    const n = ruches.length;
    return {
      texte:
        `Pour appliquer ça d'un coup à **${n} ruche${n > 1 ? 's' : ''}** (${libelleCible(cible)}), précise aussi ${champs} dans ta phrase\n\n` +
        `_Ex. « note un contrôle force 3, comportement calme sur toutes les ruches du rucher Nord »._`,
      manque: true,
    };
  }

  const plan = construirePlanLot(template, ruches, cible);
  return {
    texte: `Voici ce que je m'apprête à faire d'un seul coup — on valide ?`,
    blocs: [planEnBloc(plan)],
    confirmationPlan: { plan },
    manque: false,
  };
}

/** Domaine RBAC de chaque type d'écriture (contrôle des rôles par étape côté route). */
const DOMAINE_ECRITURE: Record<Ecriture['action'], 'terrain' | 'commerce'> = {
  intervention: 'terrain',
  recolte: 'terrain',
  stock: 'terrain',
  client: 'commerce',
};

/**
 * Parse UNE clause de séquence en écriture. Ordre : client → récolte → stock →
 * intervention (la plus permissive, en dernier, avec garde pour n'accepter qu'une
 * vraie intervention). Renvoie null si la clause ne décrit aucune écriture connue.
 */
function parseEcritureClause(brut: string, raw: string): Ecriture | null {
  const client = analyserClient(brut, raw);
  if (client) return { action: 'client', parse: client };
  const recolte = analyserRecolteProd(brut, raw);
  if (recolte) return { action: 'recolte', parse: recolte };
  const stock = analyserStock(brut, raw);
  if (stock) return { action: 'stock', parse: stock };
  const parse = analyserIntervention(brut, raw);
  const estVraie =
    !!parse.rucheNumero ||
    !!parse.rucheLabel ||
    parse.type !== 'commentaire' ||
    !!parse.commentaire;
  return estVraie ? { action: 'intervention', parse } : null;
}

/** Libellé court d'une clause (récap du plan). */
function libelleClause(clause: string): string {
  const c = clause.trim();
  return c.length > 80 ? `${c.slice(0, 77)}…` : c;
}

/**
 * Réponse à une SÉQUENCE composée : résout chaque clause (parse + previsualiser, qui
 * fait la résolution DB : ruche/rucher/article, contrôle de propriété), assemble un
 * PLAN ordonné avec UNE confirmation. Si une clause est incomplète/ambiguë, on
 * s'arrête dessus et on demande de la préciser (jamais d'exécution partielle).
 */
async function repondreSequence(userId: string, clauses: string[]): Promise<CopiloteReponse> {
  const etapes: EtapeResolue[] = [];
  for (const clause of clauses) {
    const brut = normaliser(clause);
    const ecriture = parseEcritureClause(brut, clause);
    if (!ecriture) {
      return {
        texte: `Je n'ai pas su interpréter « ${clause} » dans ta séquence Reformule cette étape et je m'en occupe.`,
        manque: true,
      };
    }
    const prev = await previsualiserAction(userId, ecriture);
    if (!prev.ok) {
      return {
        texte: `Pour « ${clause} » — ${prev.message}`,
        suggestions: prev.suggestions,
        navigation: prev.navigation,
        manque: true,
      };
    }
    etapes.push({
      actionId: ecriture.action,
      domaine: DOMAINE_ECRITURE[ecriture.action],
      libelle: libelleClause(clause),
      params: prev.params,
    });
  }

  const plan = construirePlanSequence(etapes);
  return {
    texte: `Voici la séquence que je m'apprête à exécuter, dans l'ordre — on valide tout ?`,
    blocs: [planEnBloc(plan)],
    confirmationPlan: { plan },
    manque: false,
  };
}

// ─── Croisement SAVOIR × DONNÉES (« chez toi ») ──────────────────────────────
// Une fiche de savoir générique (« dois-je traiter le varroa ? ») s'enrichit d'un
// bloc ancré dans les VRAIES données du compte. Le savoir reste 100 % statique
// (copilote-savoir.ts) ; le croisement vit ICI (accès base), par mapping fiche→thème.

type CroisementType = 'varroa' | 'maladie' | 'visite' | 'recolte';

const CROISE_VARROA = new Set(['traitement-varroa', 'varroa-bio', 'compter-varroa']);
const CROISE_MALADIE = new Set([
  'loques',
  'maladies-apercu',
  'maladies-declarables',
  'nosemose',
  'fausse-teigne',
  'petit-coleoptere',
  'intoxications',
  'mortalites-hiver',
  'pillage',
]);
const CROISE_VISITE = new Set(['visite-printemps', 'calendrier-apicole']);
const CROISE_RECOLTE = new Set([
  'quand-recolter',
  'extraction-miel',
  'combien-miel',
  'recolte-pollen',
  'recolte-propolis',
  'vente-miel',
]);

/** Thème de croisement d'une fiche (pur, testable) — null si la fiche n'est pas croisée. */
export function croisementPour(articleId: string): CroisementType | null {
  if (CROISE_VARROA.has(articleId)) return 'varroa';
  if (CROISE_MALADIE.has(articleId)) return 'maladie';
  if (CROISE_VISITE.has(articleId)) return 'visite';
  if (CROISE_RECOLTE.has(articleId)) return 'recolte';
  return null;
}

/** Petite carte « chez toi » (titre + phrase ancrée dans le réel + raccourci). */
function carteChezToi(texte: string, to: string, label: string): BlocMaya {
  return {
    type: 'carte',
    titre: 'Chez toi',
    texte,
    actions: [{ label, to, icone: 'i-lucide-arrow-up-right' }],
  };
}

/**
 * Construit le bloc « chez toi » d'une fiche en croisant ses données réelles.
 * Best-effort : toute défaillance renvoie null (le savoir reste affiché seul).
 */
async function enrichissementChezToi(userId: string, articleId: string): Promise<BlocMaya | null> {
  const type = croisementPour(articleId);
  if (!type) return null;
  try {
    if (type === 'varroa') {
      const ruches = await getRuchesSante(userId);
      const avecVarroa = ruches
        .filter((r) => r.varroa != null)
        .sort((a, b) => (b.varroa ?? 0) - (a.varroa ?? 0));
      if (avecVarroa.length > 0) {
        const pire = avecVarroa[0]!;
        return carteChezToi(
          `${avecVarroa.length} ${pluriel(avecVarroa.length, 'ruche a', 'ruches ont')} un comptage varroa noté. Le plus élevé : ruche ${pire.numero} (${pire.varroa}) au rucher ${pire.rucher}.`,
          '/ruches',
          'Voir mes ruches',
        );
      }
      return carteChezToi(
        `Aucun comptage varroa récent chez toi. Pose un lange 3 jours pour mesurer la chute naturelle — je note le résultat pour toi.`,
        '/interventions/nouvelle',
        'Noter un comptage',
      );
    }
    if (type === 'maladie') {
      const ruches = await getRuchesSante(userId);
      const malades = ruches.filter((r) => r.maladieObservee && r.maladieObservee.trim() !== '');
      if (malades.length === 0) return null;
      const liste = malades
        .slice(0, 3)
        .map((r) => `ruche ${r.numero} (${r.maladieObservee})`)
        .join(',');
      return carteChezToi(
        `${malades.length} ${pluriel(malades.length, 'ruche présente', 'ruches présentent')} une observation sanitaire : ${liste}.`,
        '/conformite/visites-sanitaires',
        'Suivi sanitaire',
      );
    }
    if (type === 'visite') {
      const ruches = await getRuchesSante(userId);
      const enRetard = ruches.filter(
        (r) => r.statut === 'active' && (r.joursDepuisVisite == null || r.joursDepuisVisite > 21),
      );
      if (enRetard.length === 0) return null;
      return carteChezToi(
        `${enRetard.length} ${pluriel(enRetard.length, 'ruche n’a', 'ruches n’ont')} pas été visitée depuis plus de 3 semaines.`,
        '/tournee',
        'Planifier ma tournée',
      );
    }
    // recolte
    const f = await getFinances(userId);
    if (f.productionMielKg <= 0) return null;
    return carteChezToi(
      `Cette année (${f.annee}), tu as déjà récolté ${f.productionMielKg.toLocaleString('fr-FR')} kg de miel.`,
      '/production',
      'Voir ma production',
    );
  } catch {
    return null; // enrichissement = bonus, jamais bloquant
  }
}

/** Rendu d'une fiche de savoir, avec contextualisation optionnelle en tête. */
/**
 * Gestes MATÉRIEL → carte « passer à l'action ». Maya EXPLIQUE (le contenu de la
 * fiche) puis PROPOSE de noter l'intervention ou d'ouvrir la page — sans jamais
 * écrire automatiquement (décision produit : reconnaître + expliquer + guider).
 */
const OFFRE_ACTION_GESTE: Record<
  string,
  { texte: string; actions: { label: string; to: string; icone?: string }[] }
> = {
  'grille-a-reine': {
    texte: 'Tu veux poser ou retirer une grille à reine ? Je peux le noter comme intervention.',
    actions: [
      { label: 'Noter une intervention', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
    ],
  },
  nourrisseur: {
    texte: 'Prêt à nourrir ? Note un nourrissement (sirop, candi…) sur la ruche concernée.',
    actions: [
      { label: 'Noter un nourrissement', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
    ],
  },
  partition: {
    texte: 'Poser ou retirer une partition ? Je peux le noter en intervention.',
    actions: [
      { label: 'Noter une intervention', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
    ],
  },
  'poser-hausses': {
    texte: 'Prêt à poser les hausses ? Note l’intervention ou ouvre la gestion des hausses.',
    actions: [
      { label: 'Noter une intervention', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
      { label: 'Gérer les hausses', to: '/hausses', icone: 'i-lucide-layers' },
    ],
  },
  'retrait-hausses': {
    texte:
      'Tu retires les hausses pour la récolte ? Note l’intervention ou ouvre la gestion des hausses.',
    actions: [
      { label: 'Noter une intervention', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
      { label: 'Gérer les hausses', to: '/hausses', icone: 'i-lucide-layers' },
    ],
  },
  'corps-hausses': {
    texte: 'Gérer tes corps et hausses ? Ouvre la page dédiée ou note une intervention.',
    actions: [
      { label: 'Gérer les hausses', to: '/hausses', icone: 'i-lucide-layers' },
      { label: 'Noter une intervention', to: '/interventions/nouvelle', icone: 'i-lucide-plus' },
    ],
  },
};

/** Carte d'offre d'action pour un geste matériel, ou null si la fiche n'en est pas un. */
export function carteGeste(articleId: string): BlocMaya | null {
  const g = OFFRE_ACTION_GESTE[articleId];
  if (!g) return null;
  return { type: 'carte', titre: 'Passer à l’action', texte: g.texte, actions: g.actions };
}

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
  // Croisement savoir × données : bloc « chez toi » ancré dans le réel (varroa,
  // sanitaire, visites, récolte). Absent si la fiche n'est pas croisée ou sans donnée.
  const blocChezToi = await enrichissementChezToi(userId, articleId);
  // Geste matériel → carte « passer à l'action » (proposition, jamais d'écriture auto).
  const blocs = [blocChezToi, carteGeste(articleId)].filter((b): b is BlocMaya => b !== null);
  return {
    // Ouverture complice variée (« Alors, », « Bonne question — ») pour que la
    // réponse sonne comme un échange, pas comme une fiche récitée.
    texte: `${prefixe}${voix('ouvertureSavoir')} ${article.contenu}`,
    source: 'Base de connaissances apicole',
    suggestions: article.voirAussi,
    blocs: blocs.length ? blocs : undefined,
    manque: false,
  };
}

/** Libellé du domaine d'un intent — pour un message d'erreur lisible. */
const LIBELLE_DOMAINE: Record<IntentId, string> = {
  ruches_visiter: 'tes ruches',
  prediction: 'la projection de tes colonies',
  reines: 'tes reines',
  balances: 'tes balances',
  transhumance: 'tes transhumances',
  clients: 'tes clients',
  lots: 'tes lots',
  elevage: 'ton élevage',
  sante: 'l’état de tes ruches',
  stocks: 'tes stocks',
  finances: 'tes finances',
  meteo: 'la météo',
  alertes: 'tes alertes',
  ruchers: 'tes ruchers',
  interventions: 'tes interventions',
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
  plan: Plan,
): Promise<CopiloteReponse> {
  try {
    return await executerIntentInterne(userId, intent, norm, plan);
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
  /** Plan de l'espace — porte les gates de LECTURE (cf. `refusDeLecture`). */
  plan: Plan,
): Promise<CopiloteReponse> {
  switch (intent) {
    case 'ruches_visiter': {
      const { ruches, cible } = scoperRuches(await getRuchesSante(userId), norm);
      const blocsRv = blocsRuchesVisiter(ruches);
      return {
        texte: (cible ? `_Rucher **${cible}**._\n\n` : '') + rendreRuchesVisiter(ruches),
        source: 'Tes ruches',
        suggestions: ['Fais-moi un point santé', 'La météo est-elle favorable ?'],
        blocs: blocsRv.length ? [...blocsRv, carteActionsRuches()] : blocsRv,
        manque: false,
      };
    }
    case 'transhumance': {
      const refusT = refusDeLecture(plan, 'transhumance');
      if (refusT)
        return {
          texte: refusT,
          source: 'Transhumance',
          suggestions: ['Mes ruchers', 'Fais-moi un point santé'],
          manque: false,
        };
      const annee = new Date().getFullYear();
      const bilan = bilanTranshumance(await getTranshumance(userId, annee), new Date());
      return {
        texte: rendreTranshumance(bilan, annee),
        source: 'Tes transhumances',
        blocs: blocsTranshumance(bilan),
        suggestions: ['Mes ruchers', 'La météo est-elle favorable ?'],
        manque:
          bilan.aVenir.length === 0 &&
          bilan.realisees.length === 0 &&
          bilan.sansAccord.length === 0,
      };
    }

    case 'clients': {
      const refusC = refusDeLecture(plan, 'clients');
      if (refusC)
        return {
          texte: refusC,
          source: 'Clients',
          suggestions: ['Où en sont mes finances ?', 'Mes stocks'],
          manque: false,
        };
      const bilanC = bilanClients(await getClients(userId), new Date());
      return {
        texte: rendreClients(bilanC),
        source: 'Tes clients',
        blocs: blocsClients(bilanC),
        suggestions: ['Où en sont mes finances ?', 'Mes lots'],
        manque: bilanC.clients.length === 0,
      };
    }

    case 'lots': {
      const refusL = refusDeLecture(plan, 'lots');
      if (refusL)
        return {
          texte: refusL,
          source: 'Traçabilité',
          suggestions: ['Ma production', 'Mes stocks'],
          manque: false,
        };
      const bilanL = bilanLots(await getLots(userId));
      return {
        texte: rendreLots(bilanL),
        source: 'Tes lots',
        blocs: blocsLots(bilanL),
        suggestions: ['Mes clients', 'Où en sont mes finances ?'],
        manque: bilanL.lots.length === 0 && bilanL.nbRecoltesSansLot === 0,
      };
    }

    case 'balances': {
      const refusB = refusDeLecture(plan, 'balances');
      if (refusB)
        return {
          texte: refusB,
          source: 'Balances connectées',
          suggestions: ['Ma production', 'Fais-moi un point santé'],
          manque: false,
        };
      const etats = etatsBalances(await getBalances(userId), new Date());
      return {
        texte: rendreBalances(etats),
        source: 'Tes balances',
        blocs: blocsBalances(etats),
        suggestions: ['Fais-moi un point santé', 'La météo est-elle favorable ?'],
        manque: etats.length === 0,
      };
    }

    case 'reines': {
      const refusR = refusDeLecture(plan, 'reines');
      if (refusR)
        return {
          texte: refusR,
          source: 'Module Reine',
          suggestions: ['Fais-moi un point santé', 'Quelles ruches visiter en priorité ?'],
          manque: false,
        };
      const reines = await getReines(userId);
      const annee = new Date().getFullYear();
      return {
        texte: rendreReines(reines, annee),
        source: 'Tes reines',
        blocs: blocsReines(reines, annee),
        suggestions: ['Fais-moi un point santé', 'Quelles ruches visiter en priorité ?'],
        manque: reines.length === 0,
      };
    }

    case 'elevage': {
      const refusE = refusDeLecture(plan, 'elevage');
      if (refusE)
        return {
          texte: refusE,
          source: 'Élevage',
          suggestions: ['Mes interventions', 'Fais-moi un point santé'],
          manque: false,
        };
      const sessions = await getSessionsGreffage(userId);
      return {
        texte: rendreElevage(sessions),
        source: 'Ton élevage',
        blocs: blocsElevage(sessions),
        suggestions: ['Mes reines', 'Fais-moi un point santé'],
        manque: sessions.length === 0,
      };
    }

    case 'prediction': {
      /**
       * La projection est VENDUE : la route de prédiction d'une ruche est gatée
       * `scorePredictif`. Servir la même donnée par la conversation sans
       * vérifier le plan contournerait le catalogue par la bande — la page
       * tarifs resterait exacte, et le produit la démentirait en une phrase.
       */
      const refus = refusDeLecture(plan, 'prediction');
      if (refus) {
        return {
          texte: refus,
          source: 'Projection de santé',
          suggestions: ['Fais-moi un point santé', 'Quelles ruches visiter en priorité ?'],
          manque: false,
        };
      }
      const ruches = await getInspectionsParRuche(userId);
      const { projections, sansDonnees } = projeterCheptel(ruches, new Date());
      return {
        texte: rendreProjection(projections, sansDonnees),
        source: 'Projection de santé',
        blocs: blocsProjection(projections),
        // Une projection appelle une action : on propose la suite immédiate.
        suggestions: projections.length
          ? ['Quelles ruches visiter en priorité ?', 'Fais-moi un point santé']
          : ['Fais-moi un point santé', 'Quelles ruches visiter en priorité ?'],
        // Sans aucun contrôle saisi, il MANQUE quelque chose : Maya le signale
        // au lieu de laisser croire qu'elle a regardé et n'a rien trouvé.
        manque: projections.length === 0 && sansDonnees.length > 0,
      };
    }

    case 'sante': {
      const { ruches, cible } = scoperRuches(await getRuchesSante(userId), norm);
      // Suggestions VIVES : dérivées de l'état réel du cheptel, pas des phrases
      // figées — des colonies critiques appellent le traitement et l'action.
      const critiques = ruches.filter(
        (r) => r.statut === 'active' && r.derniereVisite != null && r.scoreSante < 40,
      ).length;
      return {
        texte: (cible ? `_Rucher **${cible}**._\n\n` : '') + rendreSante(ruches),
        source: 'Tes ruches',
        suggestions: critiques
          ? [
              'Comment traiter le varroa ?',
              'Faire une intervention',
              'La météo est-elle favorable ?',
            ]
          : ['Quelles ruches visiter en priorité ?', 'Comment traiter le varroa ?'],
        blocs: blocsSante(ruches),
        manque: false,
      };
    }
    case 'stocks': {
      const stocks = await getStocks(userId);
      // Il manque des infos → Maya le DIT et pose la question suivante ; sous
      // seuil → elle anticipe le réachat ; du miel en stock → elle pense vente.
      if (stocks.length === 0) {
        return {
          texte:
            "Ton stock est vide pour l'instant — je ne peux donc rien te chiffrer. Veux-tu créer tes premiers articles (pots, cire, traitements…) ? Dis-moi « ouvre mes stocks » et je t'y emmène.",
          source: 'Tes stocks',
          suggestions: ['Ouvre mes stocks', 'Résumé de mes finances cette année'],
          manque: true,
        };
      }
      const sousSeuil = stocks.filter((s) => s.sousLeSeuil).length;
      const aDuMiel = stocks.some((s) => s.categorie === 'miel');
      return {
        texte: rendreStocks(stocks),
        source: 'Tes stocks',
        suggestions: [
          ...(sousSeuil ? ['Ouvre un nouvel achat'] : []),
          ...(aDuMiel ? ['Ouvre une nouvelle vente'] : []),
          'Résumé de mes finances cette année',
        ].slice(0, 3),
        blocs: blocsStocks(stocks),
        manque: false,
      };
    }
    case 'finances': {
      // Comparaison inter-années (« compare 2023 vs 2024 ») : deux années citées →
      // bilan comparatif (CA, production, ventes + deltas) plutôt que l'année seule.
      const annees = extraireAnnees(norm);
      if (annees.length >= 2) {
        const a1 = annees[0]!;
        const a2 = annees[annees.length - 1]!;
        const [f1, f2] = await Promise.all([getFinances(userId, a1), getFinances(userId, a2)]);
        const cmp = comparerFinances(f1, f2);
        return {
          texte: rendreComparaisonFinances(cmp),
          source: 'Comparaison annuelle',
          blocs: blocsComparaisonFinances(cmp),
          suggestions: ['Ma rentabilité par rucher ?', 'Mes finances de cette année'],
          manque: false,
        };
      }
      const annee = extraireAnnee(norm);
      const [f, serie] = await Promise.all([getFinances(userId, annee), getSerie12Mois(userId)]);
      const graphe = grapheCa12Mois(serie);
      // Pas encore de vente → Maya demande si on démarre, plutôt qu'un bilan vide.
      if (f.caVentesEuros === 0 && f.nbVentes === 0) {
        return {
          texte:
            rendreFinances(f) +
            `\n\nVeux-tu enregistrer ta première vente ? Dis-moi « ouvre une nouvelle vente » et je te guide.`,
          source: 'Tes finances',
          suggestions: ['Ouvre une nouvelle vente', 'Mes stocks'],
          blocs: graphe ? [...blocsFinances(f), graphe] : blocsFinances(f),
          manque: false,
        };
      }
      // Des impayés → la relance d'abord ; sinon on ouvre des pistes d'analyse
      // (comparaison N-1, rentabilité) — les liens qu'un pro attend.
      return {
        texte: rendreFinances(f),
        source: 'Tes finances',
        suggestions: f.facturesEnRetard
          ? ['Ouvre ma facturation', 'Ma rentabilité par rucher ?']
          : [`Compare ${f.annee - 1} vs ${f.annee}`, 'Ma rentabilité par rucher ?'],
        blocs: graphe ? [...blocsFinances(f), graphe] : blocsFinances(f),
        manque: false,
      };
    }
    case 'meteo': {
      const ruchers = await getRuchers(userId);
      const rucherNom = extraireRucher(
        norm,
        ruchers.map((r) => r.nom),
      );
      const res = await getMeteoRucher(userId, rucherNom);
      // Rucher sans GPS / aucun rucher → il MANQUE une info : Maya le dit et
      // oriente vers la correction, au lieu d'un simple constat.
      if ('erreur' in res) {
        return {
          texte: rendreMeteo(res),
          source: 'Météo',
          suggestions: ['Mes ruchers', 'Quelles ruches visiter en priorité ?'],
          manque: true,
        };
      }
      // Le lien naturel après la météo : la tournée.
      return {
        texte: rendreMeteo(res),
        source: 'Météo',
        blocs: blocsMeteo(res),
        suggestions: ['Quelles ruches visiter en priorité ?', 'Fais-moi un point santé'],
        manque: false,
      };
    }
    case 'alertes': {
      const alertes = await getAlertes(userId);
      return {
        texte: rendreAlertes(alertes),
        source: 'Tes alertes',
        blocs: blocsAlertes(alertes),
        // Des alertes → le réflexe suivant est le point santé + la tournée ;
        // aucune → on en profite pour anticiper la météo.
        suggestions: alertes.length
          ? ['Fais-moi un point santé', 'Quelles ruches visiter en priorité ?']
          : ['La météo est-elle favorable ?', 'Fais-moi un point santé'],
        manque: false,
      };
    }
    case 'ruchers': {
      const ruchers = await getRuchers(userId);
      if (ruchers.length === 0) {
        return {
          texte:
            rendreRuchers(ruchers) +
            ` Veux-tu le créer maintenant ? Dis-moi « crée un nouveau rucher » et je t'ouvre le formulaire.`,
          source: 'Tes ruchers',
          suggestions: ['Crée un nouveau rucher'],
          manque: true,
        };
      }
      return {
        texte: rendreRuchers(ruchers),
        source: 'Tes ruchers',
        blocs: blocsRuchers(ruchers),
        suggestions: ['Fais-moi un point santé', 'La météo est-elle favorable ?'],
        manque: false,
      };
    }
    case 'interventions': {
      const items = await getInterventionsRecentes(userId);
      return {
        texte: rendreInterventions(items),
        source: 'Tes interventions',
        blocs: blocsInterventions(items),
        // Aucune intervention → on propose d'ouvrir la première ; sinon la suite
        // logique : qui visiter, et sous quelle météo.
        suggestions: items.length
          ? ['Quelles ruches visiter en priorité ?', 'Faire une intervention']
          : ['Faire une intervention', 'Quelles ruches visiter en priorité ?'],
        manque: items.length === 0,
      };
    }
  }
}
