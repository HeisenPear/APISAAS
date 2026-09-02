import { z } from 'zod';
import {
  CATEGORIES_INTERVENTION,
  CATEGORIES_META,
  type CategorieIntervention,
} from '~~/app/types/interventions';
import type { ActionId, ActionCreatrice } from '~~/app/config/maya-actions';
import { annulationAutorisee, TYPES_ANNULABLES } from '~~/server/utils/annulationRegle';
import { and, eq, sql } from 'drizzle-orm';
// Import EXPLICITE de `db` : l'import circulaire copilote-actions copilote-local
// empêchait l'auto-import Nuxt d'injecter `db` ici → « db is not defined » dans
// chargerRuches() → TOUTE écriture (intervention/client/récolte/stock) échouait
// (« souci technique momentané »). Les lectures passaient par copilote-data.ts
// (où l'auto-import fonctionne), d'où le bug limité aux écritures.
import { db } from '~~/server/utils/db';
import { voix } from '~~/server/utils/maya-voix';
import {
  interventions,
  ruches,
  ruchers,
  clients,
  recoltes,
  stocks,
  mouvementsStock,
} from '~~/server/database/schema';
import { createInterventionSchema } from '~~/server/utils/validation/interventions';
import { allowsDecimalQuantity } from '~~/server/utils/stockQuantity';
// Même dispatcher que `POST /api/interventions/bulk` : c'est lui qui remplit
// les colonnes plates, lève les alertes, et refuse une catégorie hors plan.
import { dispatchHandler, handlerMap } from '~~/server/services/interventions';
import { refusDePlan } from '~~/server/utils/copilote-gating';
import { MAX_ETAPES_PLAN } from '~~/server/utils/copilote-plan';
import type { Plan } from '~~/app/config/plans';
import { contientTrigger, convertirNombres, normaliser } from '~~/server/utils/copilote-local';
import { jourUtc, partiesParis } from '~~/server/utils/horloge';
import { MEDICAMENTS_APICOLES } from '~~/app/config/medicaments-apicoles';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/**
 * Couche d'ACTIONS du Copilote — ce qui le fait *agir*, pas seulement répondre.
 *
 * Deux familles, toutes deux 100 % locales et gratuites :
 * 1. NAVIGATION : reconnaître « ouvre / nouvelle / va à … » et renvoyer le
 * raccourci (deep-link) vers la bonne page — le Copilote devient le raccourci
 * universel du SaaS.
 * 2. ÉCRITURE : transformer une phrase (« note une visite ruche 12 : reine vue,
 * 6 cadres de couvain, pas de varroa ») en intervention prête à enregistrer.
 * L'écriture n'a JAMAIS lieu sans confirmation explicite de l'utilisateur :
 * `analyser…` → `previsualiser…` (récap) → `executer…` (après « Confirmer »).
 *
 * Les écritures réutilisent les schémas Zod et les vérifications de propriété des
 * routes existantes : aucune règle métier dupliquée.
 */

// ─── 1. Navigation (raccourci universel) ─────────────────────────────────────

export interface NavigationCible {
  id: string;
  /** Libellé du bouton proposé. */
  label: string;
  /** Route Nuxt cible. */
  to: string;
  /** Noms/objets déclencheurs (normalisés, sans accents). */
  triggers: string[];
  /** Relance conversationnelle après ouverture (« Que souhaitez-t’enregistrer ? »). */
  invite?: string;
}

/**
 * Verbes/marqueurs signalant une intention de NAVIGATION (« emmène-moi »,
 * « ouvre », « nouvelle »…). Un de ces marqueurs + un objet ciblé = raccourci.
 */
// NB : volontairement centré sur l'ouverture/création (« ouvre », « nouvelle »,
// « va à »…). On EXCLUT « montre/affiche » qui relèvent de la lecture inline
// (« montre mes stocks » doit lister, pas naviguer).
const NAV_VERBES =
  /\b(ouvre|ouvrir|va|vas|aller|aller a|aller vers|acceder|accede|page|formulaire|nouvelle|nouveau|emmene|emmener|amene|amener|raccourci|cree|creer|rends toi)\b/;

const NAVIGATIONS: NavigationCible[] = [
  {
    id: 'intervention-nouvelle',
    label: 'Nouvelle intervention',
    to: '/interventions/nouvelle',
    triggers: ['intervention', 'visite', 'controle'],
    invite:
      'Astuce : tu peux aussi me dicter ta visite directement (« Ruche 3 : reine vue, couvain, pas de varroa ») et je la note pour toi.',
  },
  {
    id: 'vente-nouvelle',
    label: 'Enregistrer une vente',
    to: '/finances/ventes',
    triggers: ['vente', 'vendre', 'facture', 'facturation client'],
    invite:
      'Cliquez sur **Nouvelle vente** et je te laisse renseigner le client et le produit. Besoin d’un coup de main sur le miel à vendre ou le prix conseillé ?',
  },
  {
    id: 'achat-nouveau',
    label: 'Enregistrer un achat',
    to: '/finances/achats',
    triggers: ['achat', 'depense', 'depenses'],
    invite: 'Ajoutez ton dépense ici — je peux la rattacher à une catégorie si besoin.',
  },
  {
    id: 'client-nouveau',
    label: 'Clients',
    to: '/clients',
    triggers: ['client', 'clients', 'acheteur'],
  },
  {
    id: 'rucher-nouveau',
    label: 'Nouveau rucher',
    to: '/ruchers/nouveau',
    triggers: ['rucher', 'ruchers', 'emplacement de rucher'],
    invite: 'Donnez-lui un nom et placez-le sur la carte — je m’occupe du reste avec toi.',
  },
  {
    id: 'ruche-nouvelle',
    label: 'Nouvelle ruche',
    to: '/ruches/nouveau',
    triggers: ['ruche', 'colonie', 'colonies'],
    invite: 'Indiquez son numéro et son rucher, et elle sera prête à recevoir tes visites.',
  },
  {
    id: 'stocks',
    label: 'Stocks',
    to: '/stocks',
    triggers: ['stock', 'stocks', 'inventaire', 'materiel'],
  },
  {
    id: 'mortalite',
    label: 'Déclarer une mortalité',
    to: '/conformite/mortalites',
    triggers: ['mortalite', 'mortalites', 'colonie morte', 'perte de colonie'],
  },
  {
    id: 'declaration-napi',
    label: 'Déclaration de ruches (NAPI)',
    to: '/declarations/napi',
    triggers: ['declaration', 'declarer mes ruches', 'napi', 'recensement'],
  },
  {
    id: 'recolte',
    label: 'Récoltes',
    to: '/production/recoltes',
    triggers: ['recolte', 'recoltes', 'extraction', 'mise en pot'],
    invite: 'Renseignez les kilos et la variété — je calcule le stock de miel automatiquement.',
  },
  {
    id: 'transhumance',
    label: 'Transhumance',
    to: '/transhumance/emplacements',
    triggers: ['transhumance', 'emplacement', 'emplacements', 'analyse mellifere'],
  },
  {
    id: 'calendrier',
    label: 'Calendrier',
    to: '/calendrier',
    triggers: ['calendrier', 'agenda', 'planning'],
  },
  {
    id: 'alertes',
    label: 'Alertes',
    to: '/alertes',
    triggers: ['alerte', 'alertes', 'rappel', 'rappels'],
  },
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    to: '/dashboard',
    triggers: ['tableau de bord', 'dashboard', 'accueil', 'vue d ensemble'],
  },
  {
    id: 'facturation',
    label: 'Abonnement & facturation',
    to: '/parametres/facturation',
    triggers: ['abonnement', 'facturation', 'mon plan', 'mon abonnement', 'forfait'],
  },
  {
    id: 'guide',
    label: 'Guide',
    to: '/guide',
    triggers: ['guide', 'tutoriel', 'aide a utiliser', 'documentation'],
  },
  {
    id: 'elevage',
    label: 'Élevage de reines',
    to: '/elevage',
    triggers: ['elevage', 'greffage', 'reines elevage', 'lignee', 'lignees'],
  },
  {
    id: 'visites-sanitaires',
    label: 'Visites sanitaires',
    to: '/conformite/visites-sanitaires',
    triggers: ['visite sanitaire', 'visites sanitaires', 'sanitaire'],
  },
  {
    id: 'ordonnances',
    label: 'Ordonnances',
    to: '/conformite/ordonnances',
    triggers: ['ordonnance', 'ordonnances', 'prescription'],
  },
  {
    id: 'veterinaires',
    label: 'Vétérinaires',
    to: '/conformite/veterinaires',
    triggers: ['veterinaire', 'veterinaires', 'veto'],
  },
  {
    id: 'bons-livraison',
    label: 'Bons de livraison',
    to: '/finances/bons-livraison',
    triggers: ['bon de livraison', 'bons de livraison', 'livraison', 'bl'],
  },
  {
    id: 'tracabilite',
    label: 'Traçabilité / lots',
    to: '/production/tracabilite',
    triggers: ['tracabilite', 'lot', 'lots', 'numero de lot'],
  },
  {
    id: 'hausses',
    label: 'Hausses & QR',
    to: '/hausses',
    triggers: ['hausse', 'hausses', 'qr', 'gestion des hausses'],
  },
  {
    id: 'meteo-page',
    label: 'Météo',
    to: '/meteo',
    triggers: ['meteo', 'previsions', 'temps'],
  },
  {
    id: 'communaute',
    label: 'Communauté',
    to: '/association/communaute',
    triggers: ['communaute', 'forum', 'entraide', 'association'],
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    to: '/parametres',
    triggers: ['parametre', 'parametres', 'reglages', 'configuration', 'preferences'],
  },
];

/**
 * Reconnaît un raccourci de navigation : il faut un marqueur de navigation ET
 * une cible. Pur. Renvoie la première cible qui matche (ordre = priorité).
 */
export function detecterNavigation(norm: string): NavigationCible | null {
  if (!NAV_VERBES.test(norm)) return null;
  // On retient le trigger le PLUS SPÉCIFIQUE (le plus long) parmi tous ceux qui
  // matchent : « ouvre visite sanitaire » → page Visites sanitaires, pas la
  // page Intervention via le simple « visite ».
  let meilleure: NavigationCible | null = null;
  let meilleurLen = 0;
  for (const cible of NAVIGATIONS) {
    for (const t of cible.triggers) {
      if (t.length > meilleurLen && contientTrigger(norm, t)) {
        meilleure = cible;
        meilleurLen = t.length;
      }
    }
  }
  return meilleure;
}

// ─── 2. Écriture : intervention par écrit ────────────────────────────────────

/**
 * Les types d'intervention que Maya sait DICTER — un sous-ensemble des treize
 * catégories du produit.
 *
 * ⚠️ C'ÉTAIT UNE UNION ÉCRITE À LA MAIN, à côté d'un catalogue de slots qui
 * disait déjà exactement la même chose. Deux listes pour un concept : ajouter
 * un type demandait de les toucher toutes les deux, et se tromper dans l'une
 * produisait soit un type sans questions (Maya bloque), soit des questions pour
 * un type qu'elle ne reconnaît pas (code mort).
 *
 * Le type DÉRIVE maintenant de `SLOTS_PAR_TYPE` : donner ses slots à un geste
 * suffit à le rendre dictable, et rien d'autre n'est à faire. Le catalogue est
 * lui-même contraint aux vraies catégories du produit — un type inventé ne
 * compile pas.
 */
export type TypeIntervention = keyof typeof SLOTS_PAR_TYPE;

export interface InterventionParsee {
  rucheNumero?: string;
  rucherIndice?: string;
  /** Libellé complet cliqué (« RUCHE 7 », « Ruchette 6 ») — résolution exacte. */
  rucheLabel?: string;
  type: TypeIntervention;
  donnees: Record<string, unknown>;
  /** Note libre (commentaire) — conservée telle quelle (accents/casse). */
  commentaire?: string;
  /** Lignes d'aperçu prêtes à afficher (pour les types spécifiques). */
  resume?: string[];
  /** Champs indispensables manquants (ex. « ruche »). */
  manque: string[];
}

const VERBE_ECRITURE =
  /\b(note|noter|enregistre|enregistrer|enregistrement|saisis|saisir|saisi|saisie|marque|marquer|consigne|consigner|inscris|inscrire|rajoute|rajouter|ajoute|ajouter|cree|creer|fais|faire|mets|mettre|ajout)\b/;

/** Observations typiques d'un contrôle (servent aussi à détecter l'écriture). */
const OBS_CONTROLE =
  /\b(reine|ponte|oeuf|oeufs|couvain|opercul|larve|larves|reserve|reserves|provision|provisions|force|forte|faible|comportement|cellule|cellules|agit|agress|nerveu|enerv|calme|tranquille|paisible|ras|essaim)\b/;

/** Référence à une ruche, tolérante aux formulations (« la 12 », « ruche n°7 », « ruche douze »). */
export function extraireRuche(brut: string): string | undefined {
  const norm = convertirNombres(brut).toLowerCase(); // « ruche douze » → « ruche 12 » ; « Ruche 2 » → « ruche 2 »
  // « ruche 12 », « ruche n°12 », « ruche numero 12 », « ruche r12 », « ruche a3 »
  let m = /\bruche\s+(?:n[°o]?\s*|numero\s*|num\s*|r\s*)?([a-z]?\d+[a-z]?)/.exec(norm);
  if (m?.[1]) return m[1];
  // « la 12 », « sur la 5 », « la n°7 », « la ruche 12 »
  m = /\b(?:sur\s+|dans\s+|pour\s+|de\s+)?la\s+(?:n[°o]?\s*|ruche\s+)?(\d+)\b/.exec(norm);
  if (m?.[1]) return m[1];
  // « r12 » compact
  m = /\br(\d+)\b/.exec(norm);
  if (m?.[1]) return m[1];
  return undefined;
}

/**
 * Détecte une intention d'ÉCRITURE d'intervention. Deux voies :
 * - un verbe d'enregistrement + une cible (ruche / intervention / visite / note) ;
 * - SANS verbe : une ruche citée + des observations (« ruche 12 reine vue,
 * couvain ») — un ordre implicite, à condition que ce ne soit pas une question.
 * `estQuestion` permet d'éviter de prendre « la reine de la 12 va bien ? » pour
 * un ordre d'écriture.
 */
/** Gestes enregistrables sans verbe explicite (nourrissement, récolte, pesée, varroa). */
/**
 * Les gestes qui, associés à une ruche, font d'une phrase une ÉCRITURE.
 *
 * ⚠️ CETTE LISTE EST RESTÉE À SIX GESTES pendant que Maya en apprenait dix.
 * « ruche 4 posé deux hausses » et « nettoyé le plancher de la ruche 5 » —
 * deux phrases parfaitement analysables, dont le TYPE était reconnu — ne
 * franchissaient même pas la porte d'entrée : `estActionEcriture` répondait
 * non, donc la phrase partait vers le savoir ou vers rien.
 *
 * C'est un mode de panne discret : le geste est compris plus loin dans la
 * chaîne, mais on n'y arrive jamais. Le corpus l'a montré en deux cas.
 */
const GESTE_ECRITURE =
  /\b(nourri|sirop|candi|pate\s+proteique|recolt|extrai|pese|poids|varroa|acarien|trait|laniere|bandelette|essaim|divis|hausse|cadre|nourrisseur|partition|grille\s+a\s+reine|trappe\s+a\s+pollen|nettoy|desinfect|plancher)/;

/**
 * Une phrase qui interroge la RÈGLE, jamais un ordre.
 *
 * ⚠️ CE GARDE VIENT DE L'ANTI-CORPUS, ET IL RÉPARE UN DÉFAUT RÉEL. « Faut-il
 * que je note mes visites ? » était classée comme une ÉCRITURE : le verbe
 * « note » y est, le mot « visites » aussi, et le contrôle `estQuestion`
 * n'arrivait qu'APRÈS. Maya partait donc chercher quelle visite enregistrer, ne
 * trouvait rien, et répondait qu'elle n'avait pas compris — à une question
 * parfaitement claire, posée par un apiculteur qui voulait juste savoir si le
 * registre est obligatoire.
 *
 * Ces tournures demandent ce qu'IL FAUT FAIRE. Aucune ne demande de le faire.
 */
const INTERROGE_LA_REGLE =
  /\b(faut il|est ce qu il faut|est ce que je dois|dois je|doit on|est on oblige|suis je oblige|obligatoire|a t on le droit|ai je le droit|peut on|est ce qu on peut)\b/;

export function estActionEcriture(norm: string, estQuestion = false): boolean {
  if (INTERROGE_LA_REGLE.test(norm)) return false;
  const aRuche = extraireRuche(norm) !== undefined || /\bruche\b/.test(norm);
  if (VERBE_ECRITURE.test(norm) && (aRuche || /\b(intervention|visite|controle|note)\b/.test(norm)))
    return true;
  if (estQuestion) return false;
  return aRuche && (OBS_CONTROLE.test(norm) || GESTE_ECRITURE.test(norm));
}

/**
 * Tour qui n'est qu'une **référence de ruche** (« la 12 », « ruche 7 », « 12 »).
 * Sert au slot-filling : compléter une écriture précédente à qui il manquait la
 * ruche. Renvoie le numéro, ou undefined si le message dit autre chose.
 */
export function extraireRucheSeule(brut: string): string | undefined {
  const norm = convertirNombres(brut); // « la douze » → « la 12 », « douze » → « 12 »
  const mots = norm.split(' ').filter(Boolean);
  // Réponse de clarification : « Ruche 1 », « Ruche 1 (Rucher des Tilleuls) »…
  // On tolère jusqu'à 6 mots quand une référence de ruche est clairement présente.
  if (mots.length <= 6) {
    const ref = extraireRuche(norm);
    if (ref) return ref;
  }
  // Nombre seul (« 12 ») en réponse à « sur quelle ruche ? »
  if (mots.length <= 2) {
    const dernier = mots[mots.length - 1] ?? '';
    if (/^\d+$/.test(dernier)) return dernier;
  }
  return undefined;
}

/** Extrait un rucher d'une réponse de clarification (« … rucher des tilleuls »). */
export function extraireRucherSeul(brut: string): string | undefined {
  const m = /\brucher\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/.exec(
    convertirNombres(brut).toLowerCase(),
  );
  return m?.[1]?.replace(/[)\].,]+$/, '') || undefined;
}

/** Extrait le texte de note depuis le message brut, en conservant accents/casse. */
function extraireNote(raw: string): string {
  const i = raw.indexOf(':');
  const texte = i >= 0 ? raw.slice(i + 1) : raw;
  return texte.trim().slice(0, 2000);
}

/** Premier nombre (décimal toléré) suivi d'une des unités données. */
function extraireQuantite(norm: string, unites: string): { valeur: number; unite: string } | null {
  const re = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${unites})\\b`);
  const m = re.exec(norm);
  if (!m || !m[1] || !m[2]) return null;
  return { valeur: Number(m[1].replace(',', '.')), unite: m[2] };
}

interface SpecIntervention {
  type: TypeIntervention;
  donnees: Record<string, unknown>;
  resume: string[];
}

/** Nourrissement : « nourri 2 kg de candi », « 1,5 litre de sirop ». */
function parseNourrissement(norm: string): SpecIntervention | null {
  // Radicaux (sans \b final) : « nourri » couvre nourrir/nourrissement…
  if (!/\b(nourri|sirop|candi|pate\s+proteique)/.test(norm)) return null;
  const q = extraireQuantite(norm, 'kg|g|l|litre|litres|ml');
  if (!q) return null;
  const unite = /^l$|litre/.test(q.unite)
    ? 'litres'
    : q.unite === 'g'
      ? 'g'
      : q.unite === 'ml'
        ? 'ml'
        : 'kg';
  // « sirop » AVANT « candi » : « sirop candi » = sirop sucré. Aucun mot-clé de
  // type → on NE devine PAS (type omis) : le flux guidé demandera la précision.
  const type = /\bglucose\b/.test(norm)
    ? 'sirop_glucose'
    : /\bsirop\b/.test(norm)
      ? 'sirop_sucre'
      : /\bcandi\b/.test(norm)
        ? 'candi'
        : /\bpate\b/.test(norm)
          ? 'pate_proteique'
          : /\bmiel\b/.test(norm)
            ? 'miel'
            : undefined;
  const labels: Record<string, string> = {
    candi: 'candi',
    pate_proteique: 'pâte protéique',
    miel: 'miel',
    sirop_glucose: 'sirop de glucose',
    sirop_sucre: 'sirop de sucre',
  };
  const donnees: Record<string, unknown> = { quantite: q.valeur, unite };
  if (type) donnees.type = type;
  const resume = [` Quantité : **${q.valeur} ${unite}**`];
  if (type) resume.unshift(`Apport : **${labels[type]}**`);
  return { type: 'nourrissement', donnees, resume };
}

/** Récolte : « récolté du miel », « récolte de pollen ». */
function parseRecolte(norm: string): SpecIntervention | null {
  if (!/\b(recolt|extrai|extraction)/.test(norm)) return null;
  const typeProduit = /\bpollen\b/.test(norm)
    ? 'pollen'
    : /\bpropolis\b/.test(norm)
      ? 'propolis'
      : 'miel';
  return {
    type: 'recolte',
    donnees: { typeProduit },
    resume: [` Produit récolté : **${typeProduit}**`],
  };
}

/** Pesée : « pesée 38 kg », « poids 37,5 kg ». */
function parsePesee(norm: string): SpecIntervention | null {
  if (!/\b(pese|pesee|pesa|poids)\b/.test(norm)) return null;
  const q = extraireQuantite(norm, 'kg');
  if (!q) return null;
  const typePesee = /\bdroit\b/.test(norm)
    ? 'cote_droit'
    : /\bgauche\b/.test(norm)
      ? 'cote_gauche'
      : /\barriere\b/.test(norm)
        ? 'arriere'
        : 'totale';
  return {
    type: 'pesee',
    donnees: { poidsKg: q.valeur, typePesee },
    resume: [` Poids : **${q.valeur} kg** (${typePesee.replace('_', ' ')})`],
  };
}

/** Comptage varroa : « 12 varroas », « chute de 8 varroas sur 3 jours ». */
function parseVarroaComptage(norm: string): SpecIntervention | null {
  if (!/\b(varroa|varroas|acarien|acariens)\b/.test(norm)) return null;
  const m =
    /(\d+)\s*(?:varroa|varroas|acarien|acariens)\b/.exec(norm) ||
    /\b(?:compt\w*|chute(?:\s+de)?)\s+(\d+)\b/.exec(norm);
  if (!m || !m[1]) return null;
  const nombreVarroas = Number(m[1]);
  const mJours = /(\d+)\s*jour/.exec(norm);
  const dureeJours = mJours?.[1] ? Number(mJours[1]) : 3;
  return {
    type: 'varroa',
    donnees: { sousAction: 'comptage_plancher', nombreVarroas, dureeJours },
    resume: [` Varroas comptés : **${nombreVarroas}** sur **${dureeJours} j**`],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FLUX GUIDÉ — proposer une intervention puis demander les champs non écrits
// ═══════════════════════════════════════════════════════════════════════════
// Plutôt que de deviner une intervention « toute faite » (avec des valeurs par
// défaut), Maya propose le TYPE puis demande, un par un, les éléments que
// l'apiculteur n'a PAS écrits. Tout est pur et déterministe : les MÊMES
// extracteurs servent à pré-remplir ce qui est dicté ET à comprendre les
// réponses isolées (« Force 3 », « Candi », « Oui »).

/** Chips proposés quand le type d'intervention n'est pas encore connu. */

/** Reconnaît le TYPE d'intervention dans un message (mot-clé ou chip cliqué). */
export function lireTypeIntervention(norm: string): TypeIntervention | undefined {
  // ⚠️ `nourri\w*` ATTRAPAIT « nourrisseur », QUI EST DU MATÉRIEL. Un
  // nourrisseur est un objet qu'on POSE ; nourrir est un geste qu'on FAIT.
  // « J'ai ajouté un nourrisseur » devenait un nourrissement sans quantité,
  // donc une question absurde (« quelle quantité de nourrisseur ? »).
  if (/\bnourrisseur[s]?\b/.test(norm)) {
    // On ne rend pas 'materiel' ici : le geste peut manquer (« il faudrait des
    // nourrisseurs »). On laisse simplement la suite décider.
  } else if (/\b(nourri\w*|sirop|candi|pate\s+proteique)\b/.test(norm)) {
    return 'nourrissement';
  }
  if (/\b(recolt\w*|extrai\w*|extraction)\b/.test(norm)) return 'recolte';
  if (/\b(pese\w*|pesee|poids)\b/.test(norm)) return 'pesee';
  /**
   * ⚠️ « J'AI TRAITÉ LA RUCHE 3 À L'APIVAR » NE PARLAIT PAS DE VARROA.
   *
   * Ni « traité », ni « Apivar », ni « lanières » n'étaient reconnus ici. La
   * phrase n'atteignait donc JAMAIS l'analyseur d'écriture : elle tombait dans
   * la recherche de savoir, qui trouvait la fiche du produit et servait un
   * cours à quelqu'un qui venait de finir le travail. La fiche gagnait par
   * DÉFAUT, pas par priorité — et elle reste bien sûr atteignable dès qu'on
   * POSE la question (« c'est quoi l'Apivar ? »).
   *
   * Le nom du produit suffit à désigner le geste : on ne pose de l'Apivar que
   * contre le varroa. La liste dérive du référentiel (cf. VARROACIDES).
   */
  if (/\b(varroa\w*|acarien\w*|comptage)\b/.test(norm)) return 'varroa';
  if (estTraitementVarroa(norm)) return 'varroa';
  // ── Quatre gestes que Maya ne savait PAS écrire, et pour lesquels elle
  //    renvoyait vers /interventions/nouvelle. Ce sont des gestes de saison :
  //    l'essaim qu'on récupère en mai, la division qu'on fait dans la foulée,
  //    la hausse qu'on pose, le plancher qu'on nettoie. Les envoyer changer de
  //    page au moment où l'apiculteur a les mains dans la ruche est exactement
  //    ce qu'on voulait supprimer.
  //
  //    ⚠️ L'ORDRE COMPTE, du plus spécifique au plus large. « Essaimage » avant
  //    « division » : « j'ai divisé après l'essaimage » parle du geste de
  //    division. Et « hausse » (matériel) avant « contrôle », sinon
  //    « contrôle et pose d'une hausse » perdrait la hausse.
  //
  // ⚠️ TROIS PRÉCAUTIONS, ET LA DEUXIÈME M'A DÉJÀ PIÉGÉ ICI.
  //  · « essaim MORT » est un geste SANITAIRE, pas un essaimage : le sanitaire
  //    passe donc en premier, sur cette forme précise.
  //  · LE MATÉRIEL EXIGE UN VERBE. Ma version naïve déclenchait sur le seul mot
  //    « cadres » — et le banc a immédiatement dénoncé « rappel acheter des
  //    cadres », qui est une NOTE. Nommer un objet n'est pas poser cet objet ;
  //    sans le geste, on transforme une liste de courses en intervention.
  //  · Le mot « plancher » seul ne suffit pas non plus : il faut le verbe de
  //    nettoyage. Il reste reconnu PLUS TARD, une fois le type établi, par
  //    `lireTypeSanitaire` — là où il ne peut plus faire de dégât.
  if (/\bessaim\s+mort\b|\bcolonie\s+morte\b/.test(norm)) return 'sanitaire';
  if (/\b(essaim\w*|essaimage)\b/.test(norm)) return 'essaimage';
  if (/\b(divis\w*)\b/.test(norm)) return 'division';
  if (VERBE_MATERIEL.test(norm) && lireElementMateriel(norm)) return 'materiel';
  if (/\b(nettoy\w*|desinfect\w*|sanitaire)\b/.test(norm)) return 'sanitaire';
  if (/\b(controle|visite|inspection)\b/.test(norm)) return 'controle';
  if (/\b(note|commentaire|libre|remarque)\b/.test(norm)) return 'commentaire';
  return undefined;
}

/**
 * Le GESTE de poser ou retirer. Sans lui, nommer un objet n'est pas une
 * intervention — c'est un pense-bête. Le banc l'a rappelé sur « rappel acheter
 * des cadres ».
 */
const VERBE_MATERIEL =
  /\b(pose|posee?s?|posait|poser|ajout\w*|rajout\w*|mis|mise|met|installe\w*|retir\w*|enlev\w*|change|remplace\w*)\b/;

/** Élément de matériel posé ou retiré, tel que `materielSchema` l'attend. */
export function lireElementMateriel(norm: string): string | undefined {
  if (/\bhausse[s]?\b/.test(norm)) return 'hausses';
  if (/\bcorps\b/.test(norm)) return 'corps';
  if (/\bcadre[s]?\s+(?:a\s+)?male[s]?\b/.test(norm)) return 'cadres_male';
  if (/\bcadre[s]?\b/.test(norm)) return 'cadres';
  if (/\bpartition[s]?\b/.test(norm)) return 'partitions';
  if (/\bnourrisseur[s]?\b/.test(norm)) return 'nourrisseurs';
  if (/\bgrille\s+a\s+propolis\b/.test(norm)) return 'grille_propolis';
  if (/\bgrille\s+(?:a\s+)?reine\b/.test(norm)) return 'grille_reine';
  if (/\btrappe\s+(?:a\s+)?pollen\b/.test(norm)) return 'trappe_pollen';
  return undefined;
}

/** Geste sanitaire, tel que `sanitaireSchema` l'attend. */
export function lireTypeSanitaire(norm: string): string | undefined {
  if (/\bessaim\s+mort\b|\bcolonie\s+morte\b|\bmortalite\b/.test(norm)) return 'essaim_mort';
  if (/\bplancher\b/.test(norm)) return 'nettoyer_plancher';
  if (/\bretrait\s+(?:du\s+)?couvain\b|\bcouvain\s+male\b/.test(norm)) return 'retrait_couvain';
  if (/\bnettoy\w*|desinfect\w*/.test(norm)) return 'nettoyer_ruche';
  return undefined;
}

/** Force de colonie : « force 3 », « 3 » (seul), « forte »/« populeuse », « faible »/« petite ». */
export function lireForce(norm: string): number | undefined {
  const m = /\bforce\s+(?:de\s+)?([1-4])\b/.exec(norm) ?? /^\s*([1-4])\s*$/.exec(norm);
  if (m?.[1]) return Number(m[1]);
  if (/\b(forte|populeuse|vigoureuse)\b/.test(norm)) return 4;
  if (/\b(faible|petite|chetive)\b/.test(norm)) return 1;
  return undefined;
}

/** Comportement de la colonie (« ras » = calme). */
export function lireComportement(norm: string): 'calme' | 'agitee' | 'agressive' | undefined {
  if (/\bagress/.test(norm)) return 'agressive';
  if (/\b(agit|nerveu|enerv)/.test(norm)) return 'agitee';
  if (/\b(calme|tranquille|paisible|douce)\b/.test(norm) || /\bras\b/.test(norm)) return 'calme';
  return undefined;
}

/** Marqueurs « je passe / je ne sais pas » pour un champ optionnel. */
const MARQUEUR_PASSER =
  /\b(passe\w*|plus\s+tard|sais\s+pas|ne\s+sais\s+pas|aucune?\s+idee|skip|peu\s+importe|sans\s+avis|inconnu)\b/;

/**
 * Réponse à une question OUI/NON (observation) : `true`/`false` si reconnue,
 * `null` si l'apiculteur passe la question, `undefined` si non comprise.
 */
function lireBoolReponse(norm: string, pos: RegExp, neg: RegExp): boolean | null | undefined {
  if (neg.test(norm)) return false;
  if (pos.test(norm)) return true;
  if (/\b(oui|ok|yep|ouais|affirmatif|exact|tout\s+a\s+fait)\b/.test(norm)) return true;
  if (/\b(non|nope|negatif|rien)\b/.test(norm)) return false;
  // « Passer » seulement si c'est une réponse COURTE et claire (chip « Passer »,
  // « je sais pas ») — pas « passer la visite pour l'instant » (autre intention).
  if (MARQUEUR_PASSER.test(norm) && norm.split(' ').filter(Boolean).length <= 2) return null;
  return undefined;
}

/** Type de nourriture (mot-clé ou chip). */
export function lireTypeNourriture(
  norm: string,
): 'sirop_sucre' | 'sirop_glucose' | 'candi' | 'pate_proteique' | 'miel' | undefined {
  if (/\bcandi\b/.test(norm)) return 'candi';
  if (/\bpate\b/.test(norm)) return 'pate_proteique';
  if (/\bglucose\b/.test(norm)) return 'sirop_glucose';
  if (/\bmiel\b/.test(norm)) return 'miel';
  if (/\bsirop\b/.test(norm)) return 'sirop_sucre';
  return undefined;
}

/** Unité de quantité (chip ou mot-clé). */
export function lireUnite(norm: string): 'kg' | 'g' | 'litres' | 'ml' | undefined {
  if (/\b(kg|kilo\w*)\b/.test(norm)) return 'kg';
  if (/\bml\b/.test(norm)) return 'ml';
  if (/\b(litre[s]?|l)\b/.test(norm)) return 'litres';
  if (/\b(g|gramme[s]?)\b/.test(norm)) return 'g';
  return undefined;
}

/** Produit récolté (chip ou mot-clé). */
export function lireProduitRecolte(norm: string): 'miel' | 'pollen' | 'propolis' | undefined {
  if (/\bpollen\b/.test(norm)) return 'pollen';
  if (/\bpropolis\b/.test(norm)) return 'propolis';
  if (/\bmiel\b/.test(norm)) return 'miel';
  return undefined;
}

/** Premier nombre positif d'un message (décimaux déjà normalisés « 1.5 »). */
export function lireNombre(norm: string): number | undefined {
  const m = /(\d+(?:\.\d+)?)/.exec(norm);
  return m?.[1] ? Number(m[1]) : undefined;
}

/** Un champ à remplir : sa question, ses chips et son extracteur de réponse. */
interface SlotChamp {
  key: string;
  /** false = champ optionnel (« Passer » accepté). */
  requis: boolean;
  /** Question posée par Maya (markdown). */
  question: string;
  /** Boutons proposés (chips) — vide pour une saisie libre/numérique. */
  options: string[];
  /**
   * Lit une réponse ISOLÉE : renvoie un fragment de `donnees` (1+ clés), `null`
   * si l'apiculteur passe (optionnel), `undefined` si non reconnu (on redemande).
   *
   * `enReponse` dit DANS QUEL CONTEXTE on lit, et ce n'est pas un confort :
   * les mêmes extracteurs servent au PRÉ-REMPLISSAGE depuis une phrase dictée
   * (`false`) et à la lecture d'une réponse à la question du champ (`true`).
   * Un champ de TEXTE LIBRE ne peut pas distinguer les deux tout seul — il
   * accepterait la phrase entière. Le premier jet de ce fichier le faisait :
   * « j'ai traité la ruche 3 à l'Apivar » remplissait le numéro de lot ET le
   * dosage avec la phrase complète. Un champ libre ne se pré-remplit donc pas :
   * il attend qu'on lui pose la question.
   */
  lire: (
    norm: string,
    raw: string,
    enReponse?: boolean,
  ) => Record<string, unknown> | null | undefined;
}

/** Catalogue ordonné des champs à demander, par type d'intervention. */
/**
 * Les varroacides du référentiel, DÉRIVÉS par leur indication.
 *
 * On filtre sur `indication` plutôt que de recopier dix noms : le jour où une
 * AMM s'ajoute — ou se retire — la dictée suit sans qu'on y pense. Le Tylan
 * (loque américaine) et les autres indications restent donc hors de cette
 * liste, ce qui est juste : on ne traite pas le varroa au Tylan.
 */
const VARROACIDES: string[] = MEDICAMENTS_APICOLES.filter((m) => m.indication === 'Varroase').map(
  (m) => m.nom,
);

/**
 * LE VARROA A DEUX GESTES, ET LA DICTÉE N'EN ATTEIGNAIT QU'UN.
 *
 * ⚠️ LE DÉFAUT, MESURÉ. `donneesBase` posait `sousAction: 'comptage_plancher'`
 * en dur pour TOUT le type varroa. Conséquences vécues :
 *
 *   « j'ai traité la ruche 3 contre le varroa »  → « Combien de varroas
 *     as-tu comptés ? » — le traitement devenait un comptage ;
 *   « note un traitement varroa sur toutes mes ruches » → un plan proposant
 *     d'écrire UN varroa compté sur CHAQUE ruche du cheptel. Le « un » de
 *     « un traitement », lu comme une quantité. Et ce comptage alimente le
 *     score de santé : ce n'est pas une gêne d'interface, c'est de la donnée
 *     fausse.
 *
 * ⚠️ ET LE PLUS FRAPPANT : LE BACK-END SAVAIT DÉJÀ TOUT FAIRE. Le service
 * `server/services/interventions/varroa.ts` traite QUATRE sous-actions —
 * `comptage_plancher`, `traitement`, `suppression_couvain`, `vph` — le schéma
 * Zod `varroaSchema` les valide toutes, et les tables `comptages_varroa` et
 * `traitements_varroa` existent. Rien à construire côté écriture : seule la
 * DICTÉE ne savait pas y accéder.
 *
 * On n'a donc rien retiré. Le comptage reste exactement ce qu'il était ; le
 * traitement s'ajoute à côté. Les deux jeux de champs vivent dans CETTE table,
 * et `SLOTS_PAR_TYPE.varroa` en dérive — pas de seconde liste à tenir.
 */
const SLOTS_VARROA = {
  comptage_plancher: [
    {
      key: 'nombreVarroas',
      requis: true,
      question: 'Combien de varroas as-tu comptés ?',
      options: [],
      lire: (n) => {
        const v = lireNombre(n);
        // Comptage = entier ≥ 0 (Zod.int().min(0)) — on arrondit une saisie décimale.
        return v === undefined || v < 0 ? undefined : { nombreVarroas: Math.round(v) };
      },
    },
  ],
  traitement: [
    {
      key: 'typeTraitement',
      requis: true,
      question: 'Quel produit as-tu utilisé ?',
      // Les chips DÉRIVENT du référentiel des médicaments : ajouter une AMM
      // varroa dans `app/config/medicaments-apicoles.ts` la rend dictable sans
      // toucher ici. Une liste recopiée aurait divergé au premier ajout.
      options: [...VARROACIDES, 'Autre'],
      lire: (n, raw, enReponse) => {
        // Un produit du référentiel se reconnaît dans une phrase dictée : c'est
        // un nom propre, il ne peut pas être autre chose.
        const connu = VARROACIDES.find((m) => n.includes(normaliser(m)));
        if (connu) return { typeTraitement: connu };
        // Hors référentiel, on accepte ce que l'apiculteur écrit — le registre
        // doit pouvoir accueillir une préparation que le référentiel ne connaît
        // pas encore. Mais SEULEMENT en réponse à la question : sur une phrase
        // spontanée, ce repli avalerait la phrase entière comme nom de produit.
        if (!enReponse) return undefined;
        const libre = (raw || n).trim();
        return libre.length >= 2 && libre.length <= 120 ? { typeTraitement: libre } : undefined;
      },
    },
    {
      key: 'numeroLotProduit',
      requis: true,
      // Obligatoire par la LOI, pas par le schéma : le registre d'élevage doit
      // porter le numéro de lot de tout médicament administré. `numero_lot_produit`
      // est `notNull` en base pour cette raison. On le demande donc, même si
      // c'est un champ de plus au rucher — et on dit POURQUOI, sinon la question
      // passe pour de la bureaucratie.
      question:
        'Quel est le numéro de lot du produit ?\n\n*Le registre d’élevage doit le porter — c’est ce qui rend ton traitement traçable en cas de contrôle.*',
      options: [],
      // Champ LIBRE : jamais pré-rempli depuis une phrase dictée. Personne ne
      // dit son numéro de lot dans la même phrase que son geste.
      lire: (n, raw, enReponse) => {
        if (!enReponse) return undefined;
        const v = (raw || n).trim();
        return v.length >= 1 && v.length <= 60 ? { numeroLotProduit: v } : undefined;
      },
    },
    {
      key: 'dosage',
      requis: false,
      question: 'Quel dosage ? (facultatif)',
      options: ['Passer'],
      // Champ LIBRE, même règle : « une lanière par corps » ne se dicte pas
      // dans la phrase du geste, ça se répond quand on le demande.
      lire: (n, raw, enReponse) => {
        if (!enReponse) return undefined;
        if (/\bpasser\b/.test(n)) return null;
        const v = (raw || n).trim();
        return v.length >= 1 && v.length <= 60 ? { dosage: v } : undefined;
      },
    },
  ],
} satisfies Record<string, SlotChamp[]>;

const SLOTS_PAR_TYPE = {
  controle: [
    {
      key: 'reineVue',
      requis: false,
      question: 'As-tu vu la reine ?',
      options: ['Reine vue', 'Reine non vue', 'Passer'],
      lire: (n) => {
        const v = lireBoolReponse(
          n,
          /\b(reine\s+vue|reine|ponte|oeuf|oeufs)\b/,
          /\b(pas\s+(de\s+|vu\s+)?reine|reine\s+non\s+vue|sans\s+reine|orpheline|reine\s+absente)\b/,
        );
        return v === undefined ? undefined : { reineVue: v };
      },
    },
    {
      key: 'couvainPresent',
      requis: false,
      question: 'Y a-t-il du couvain ?',
      options: ['Couvain présent', 'Pas de couvain', 'Passer'],
      lire: (n) => {
        const v = lireBoolReponse(
          n,
          /\b(couvain\s+present|couvain|opercul\w*|larve[s]?)\b/,
          /\b(pas\s+de\s+couvain|sans\s+couvain|aucun\s+couvain)\b/,
        );
        return v === undefined ? undefined : { couvainPresent: v };
      },
    },
    {
      key: 'reserves',
      requis: false,
      question: 'Les réserves sont-elles suffisantes ?',
      options: ['Réserves OK', 'Peu de réserves', 'Passer'],
      lire: (n) => {
        const v = lireBoolReponse(
          n,
          /\b(reserves?\s+ok|reserves?|provisions?|suffisant\w*)\b/,
          /\b(pas\s+de\s+reserves?|sans\s+reserves?|peu\s+de\s+reserves?|manque\s+de\s+reserves?)\b/,
        );
        return v === undefined ? undefined : { reserves: v };
      },
    },
    {
      key: 'forceColonie',
      requis: true,
      question: 'Quelle est la force de la colonie ?',
      options: ['Force 1', 'Force 2', 'Force 3', 'Force 4'],
      lire: (n) => {
        const v = lireForce(n);
        return v === undefined ? undefined : { forceColonie: v };
      },
    },
    {
      key: 'comportement',
      requis: true,
      question: 'Comment était le comportement de la colonie ?',
      options: ['Calme', 'Agitée', 'Agressive'],
      lire: (n) => {
        const v = lireComportement(n);
        return v === undefined ? undefined : { comportement: v };
      },
    },
  ],
  nourrissement: [
    {
      key: 'type',
      requis: true,
      question: 'Quel type de nourriture as-tu donné ?',
      options: ['Sirop de sucre', 'Sirop de glucose', 'Candi', 'Pâte protéique', 'Miel'],
      lire: (n) => {
        const v = lireTypeNourriture(n);
        return v ? { type: v } : undefined;
      },
    },
    {
      key: 'quantite',
      requis: true,
      question: 'Quelle quantité ? (ex : « 2 kg », « 1,5 litre »)',
      options: [],
      lire: (n) => {
        const q = lireNombre(n);
        if (q === undefined || q <= 0) return undefined; // quantité > 0 (Zod.positive())
        const u = lireUnite(n);
        return u ? { quantite: q, unite: u } : { quantite: q };
      },
    },
    {
      key: 'unite',
      requis: true,
      question: 'Dans quelle unité ?',
      options: ['kg', 'g', 'litres', 'ml'],
      lire: (n) => {
        const v = lireUnite(n);
        return v ? { unite: v } : undefined;
      },
    },
  ],
  varroa: SLOTS_VARROA.comptage_plancher,
  pesee: [
    {
      key: 'poidsKg',
      requis: true,
      question: 'Quel poids as-tu relevé ? (en kg)',
      options: [],
      lire: (n) => {
        const v = lireNombre(n);
        return v === undefined || v <= 0 ? undefined : { poidsKg: v }; // poids > 0 (Zod.positive())
      },
    },
  ],
  recolte: [
    {
      key: 'typeProduit',
      requis: true,
      question: 'Quel produit as-tu récolté ?',
      options: ['Miel', 'Pollen', 'Propolis'],
      lire: (n) => {
        const v = lireProduitRecolte(n);
        return v ? { typeProduit: v } : undefined;
      },
    },
  ],
  commentaire: [
    {
      key: 'texte',
      requis: true,
      question: 'Que veux-tu noter ?',
      options: [],
      lire: (_n, raw) => {
        const t = raw.trim().slice(0, 2000);
        return t ? { texte: t } : undefined;
      },
    },
  ],

  // ── LES QUATRE GESTES QUE MAYA NE SAVAIT PAS ÉCRIRE ────────────────────
  // Elle renvoyait vers /interventions/nouvelle. Ce sont pourtant des gestes de
  // saison, faits les mains dans la ruche : changer de page à ce moment-là est
  // exactement ce qu'on voulait supprimer.
  //
  // ⚠️ AUCUN DES QUATRE NE S'EXÉCUTERA EN AUTONOMIE, et c'est correct : leurs
  // handlers écrivent dans des tables satellites (`essaimages`, `divisions`,
  // `mouvements_materiel`, `evenements_sanitaires`) que l'annulation ne sait
  // pas défaire. Ils passeront donc par « Confirmer » — ce qui est exactement
  // le contrat demandé : elle fait tout depuis sa fenêtre, elle a juste besoin
  // de la validation.

  essaimage: [
    {
      key: 'essaimRecupere',
      requis: true,
      question: 'As-tu récupéré l’essaim ?',
      options: ['Essaim récupéré', 'Essaim perdu'],
      lire: (n) => {
        const v = lireBoolReponse(
          n,
          /\b(recupere|repris|rattrape|attrape|capture)\b/,
          /\b(perdu|parti|envole|pas\s+recupere|rate)\b/,
        );
        return v === undefined || v === null ? undefined : { essaimRecupere: v };
      },
    },
  ],

  division: [
    {
      key: 'nombreDivisions',
      requis: true,
      question: 'En combien de colonies as-tu divisé ?',
      options: ['2', '3', '4'],
      lire: (n) => {
        const v = lireNombre(n);
        // `divisionSchema` : entier entre 1 et 10.
        if (v === undefined || v < 1 || v > 10) return undefined;
        return { nombreDivisions: Math.round(v) };
      },
    },
  ],

  materiel: [
    {
      key: 'elements',
      requis: true,
      question: 'Quel élément as-tu posé ou retiré ?',
      options: ['Hausse', 'Corps', 'Cadres', 'Nourrisseur', 'Partition', 'Grille à reine'],
      lire: (n) => {
        const element = lireElementMateriel(n);
        if (!element) return undefined;
        // La quantité est lue dans la MÊME phrase quand elle y est
        // (« deux hausses ») ; sinon la question suivante la demande. Le schéma
        // attend un tableau : « j'ai posé une hausse » est le cas de très loin
        // le plus fréquent, une entrée suffit.
        const q = lireNombre(n);
        const quantite = q !== undefined && q >= 1 ? Math.round(q) : 1;
        return { elements: [{ element, quantite }] };
      },
    },
  ],

  sanitaire: [
    {
      key: 'typeEvenement',
      requis: true,
      question: 'Quel geste sanitaire ?',
      options: ['Nettoyer la ruche', 'Nettoyer le plancher', 'Essaim mort', 'Retrait de couvain'],
      lire: (n) => {
        const v = lireTypeSanitaire(n);
        return v ? { typeEvenement: v } : undefined;
      },
    },
  ],
} satisfies Partial<Record<CategorieIntervention, SlotChamp[]>>;

/**
 * Les gestes que Maya sait dicter — dérivés du catalogue de slots, dans l'ordre
 * du catalogue du produit pour que les chips suivent l'ordre de l'application.
 */
export const TYPES_DICTABLES = CATEGORIES_INTERVENTION.filter(
  (c): c is TypeIntervention => c in SLOTS_PAR_TYPE,
);

/**
 * Comment Maya NOMME un geste — dérivé du catalogue du produit.
 *
 * ⚠️ CETTE TABLE ÉTAIT ÉCRITE À LA MAIN, ET RECOPIÉE MOT POUR MOT dans
 * `copilote-plan.ts`. Aucune des deux n'était exportée, donc rien ne pouvait
 * les rapprocher — et rien ne les rapprochait non plus de `CATEGORIES_META`,
 * qui nomme déjà ces gestes pour l'interface. Trois vocabulaires pour treize
 * gestes : Maya pouvait appeler « Comptage varroa » ce que l'application
 * appelle « Varroa » sur la page d'à côté.
 *
 * Deux exceptions ASSUMÉES, et c'est pour ça que la table n'est pas un simple
 * alias : Maya dit « Note » là où l'interface dit « Commentaire » (plus court à
 * l'oral), et « Comptage varroa » là où l'interface dit « Varroa » (le mot seul
 * serait ambigu dans une phrase). Tout le reste vient de `CATEGORIES_META` — un
 * geste renommé dans l'application l'est aussi dans la bouche de Maya.
 */
const LABEL_MAYA: Partial<Record<CategorieIntervention, string>> = {
  commentaire: 'Note',
  varroa: 'Comptage varroa',
};

export const LABEL_TYPE = Object.fromEntries(
  CATEGORIES_INTERVENTION.map((c) => [c, LABEL_MAYA[c] ?? CATEGORIES_META[c].label]),
) as Record<CategorieIntervention, string>;

/**
 * Les gestes proposés en chips quand Maya demande « quel type ? ».
 *
 * ⚠️ CETTE LISTE ÉTAIT ÉCRITE À LA MAIN, et elle a fait exactement ce qu'une
 * liste écrite à la main finit par faire : rester à six pendant que le produit
 * en comptait treize. Elle DÉRIVE maintenant des types réellement dictables —
 * donner ses slots à un geste suffit à le faire apparaître dans les chips.
 */
export const LIBELLES_TYPES_INTERVENTION: string[] = TYPES_DICTABLES.map((t) => LABEL_TYPE[t]);

/**
 * Le jour d'aujourd'hui, en valeur date-seule stockable.
 *
 * ⚠️ DEUX PIÈGES EN UNE LIGNE, ET LE DÉPÔT LES A DÉJÀ PAYÉS TOUS LES DEUX.
 * Le JOUR se lit à PARIS — sur une lambda Vercel qui tourne en UTC, un
 * traitement posé le 1er août à 00 h 30 serait daté du 31 juillet. Mais la
 * VALEUR se pose à minuit UTC : minuit UTC du jour J se relit « jour J » des
 * deux côtés, là où minuit à Paris se relit « jour J−1 » en UTC.
 * Une borne de requête, elle, se poserait à minuit à Paris — ce n'en est pas une.
 */
function aujourdhuiDateSeule(): Date {
  const { annee, mois, jour } = partiesParis(new Date());
  return jourUtc(annee, mois, jour);
}

/**
 * Le geste varroa dicté : POSER un traitement, ou COMPTER une chute ?
 *
 * ⚠️ CETTE QUESTION N'ÉTAIT PAS POSÉE, et la réponse était « comptage », pour
 * tout le monde, tout le temps. Un apiculteur qui vient de poser ses lanières
 * s'entendait demander combien de varroas il avait comptés.
 *
 * Le marqueur du traitement est le VERBE ou le PRODUIT, jamais le mot varroa
 * — qui appartient aux deux gestes. On reconnaît donc : traiter sous toutes ses
 * formes, les formes galéniques (lanières, bandelettes, gel, sirop dégouttement,
 * sublimation), et tout nom du référentiel des varroacides.
 *
 * En cas de doute on reste sur le COMPTAGE : c'est le comportement d'avant,
 * donc une détection ratée ne casse rien de ce qui marchait.
 */
function estTraitementVarroa(norm: string): boolean {
  if (
    /\b(trait\w*|lanieres?|bandelettes?|degouttement|sublimation|vaporisation|flash)\b/.test(norm)
  ) {
    return true;
  }
  return VARROACIDES.some((m) => norm.includes(normaliser(m)));
}

/**
 * Données toujours présentes pour un type (non demandées à l'apiculteur).
 *
 * `norm` est la phrase normalisée quand on en a une : elle sert à choisir la
 * SOUS-ACTION d'un type qui en a plusieurs. Sans phrase (réponse isolée à une
 * question, chip cliqué), on garde le défaut historique.
 */
function donneesBase(type: TypeIntervention, norm = ''): Record<string, unknown> {
  if (type === 'varroa') {
    return estTraitementVarroa(norm)
      ? // `dateDebut` n'est PAS demandée : on trace ce qui vient d'être fait, et
        // l'apiculteur dicte au rucher, le produit encore en main. Le jour se
        // pose à minuit UTC — une valeur date-seule stockée, cf. horloge.ts :
        // minuit à Paris se relirait « jour J−1 » côté UTC.
        { sousAction: 'traitement', dateDebut: aujourdhuiDateSeule().toISOString() }
      : { sousAction: 'comptage_plancher', dureeJours: 3 };
  }
  if (type === 'pesee') return { typePesee: 'totale' };
  return {};
}

/**
 * Les champs à remplir pour ce geste, DANS CET ÉTAT.
 *
 * ⚠️ SIX ENDROITS LISAIENT `SLOTS_PAR_TYPE[type]` DIRECTEMENT. Tant qu'un type
 * n'avait qu'un jeu de champs, c'était correct ; le varroa en a deux, et six
 * lectures directes auraient voulu dire six oublis possibles. Le type reste la
 * clé — c'est la sous-action déjà posée dans `donnees` qui départage.
 */
function slotsDe(type: TypeIntervention, donnees: Record<string, unknown>): SlotChamp[] {
  if (type === 'varroa' && donnees.sousAction === 'traitement') return SLOTS_VARROA.traitement;
  return SLOTS_PAR_TYPE[type];
}

/** Champs encore à remplir : slots non renseignés (dans l'ordre) + ruche en dernier. */
function manqueRestant(
  type: TypeIntervention,
  donnees: Record<string, unknown>,
  rucheNumero: string | undefined,
): string[] {
  const m = slotsDe(type, donnees)
    .filter((s) => !(s.key in donnees))
    .map((s) => s.key);
  if (!rucheNumero) m.push('ruche');
  return m;
}

/**
 * Champs REQUIS encore manquants d'un template d'intervention (hors ruche). Sert
 * au moteur de LOT : une commande en lot n'est jouable que si les champs
 * indispensables (force + comportement, quantité…) sont fournis d'un bloc — les
 * champs optionnels (reine vue, couvain…) restent simplement non renseignés.
 */
export function manqueRequisIntervention(p: InterventionParsee): string[] {
  return slotsDe(p.type, p.donnees)
    .filter((s) => s.requis && !(s.key in p.donnees))
    .map((s) => s.key);
}

/** Intervention vierge d'un type donné, à compléter via le flux guidé. */
function nouvelleInterventionGuidee(type: TypeIntervention): InterventionParsee {
  const donnees = donneesBase(type);
  return { type, donnees, manque: manqueRestant(type, donnees, undefined) };
}

/**
 * Transforme une phrase en intervention structurée (sans toucher la base).
 * `norm` = question normalisée (détection) ; `raw` = message d'origine (note).
 * On ne renseigne QUE ce qui est explicitement écrit : tout champ requis absent
 * reste dans `manque` et sera demandé (au lieu d'une valeur par défaut devinée).
 */
export function analyserIntervention(normBrut: string, raw: string): InterventionParsee {
  const norm = convertirNombres(normBrut); // « ruche douze, force trois » → chiffres
  const rucheNumero = extraireRuche(norm);
  const mRucher = /\brucher\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/.exec(norm);
  const rucherIndice = mRucher?.[1];

  // 1. Geste spécifique COMPLET dans la phrase (nourrissement/récolte/pesée/varroa).
  const spec =
    parseNourrissement(norm) ?? parseRecolte(norm) ?? parsePesee(norm) ?? parseVarroaComptage(norm);
  if (spec) {
    const donnees = { ...donneesBase(spec.type), ...spec.donnees };
    return {
      rucheNumero,
      rucherIndice,
      type: spec.type,
      donnees,
      resume: spec.resume,
      commentaire: extraireNote(raw) || undefined,
      manque: manqueRestant(spec.type, donnees, rucheNumero),
    };
  }

  // 2. Type spécifique annoncé mais incomplet (« note un nourrissement de candi »).
  // On exclut le contexte de contrôle : soit une observation (OBS_CONTROLE), soit
  // le mot-clé EXPLICITE « contrôle/visite/inspection » — sinon « note un contrôle
  // pas de varroa » serait typé « varroa » (comptage) au lieu de « contrôle ».
  /**
   * ⚠️ CE VETO ÉTAIT TROP LARGE, ET IL A BLOQUÉ DEUX GESTES NEUFS.
   *
   * Il existe pour une raison précise : « note un contrôle, pas de varroa »
   * doit rester un CONTRÔLE, pas devenir un comptage varroa. Mais il vetait
   * tout type spécifique dès qu'un mot d'observation apparaissait — et
   * `OBS_CONTROLE` contient « essaim ». Conséquence : « ruche 7, essaim
   * récupéré » et « ruche 2, essaim mort » redevenaient des contrôles, donc
   * Maya demandait la force et le comportement de la colonie au lieu
   * d'enregistrer la capture ou la perte.
   *
   * Le veto ne concerne en réalité qu'UN type : `varroa` est le seul dont le
   * mot-clé soit aussi un mot d'observation courant pendant une visite. Les
   * autres gestes exigent un verbe d'action, donc ils sont délibérés.
   */
  const estContexteControle =
    OBS_CONTROLE.test(norm) || /\b(controle|visite|inspection)\b/.test(norm);
  const typeMot = lireTypeIntervention(norm);
  const vetoControle = estContexteControle && typeMot === 'varroa';
  if (typeMot && typeMot !== 'commentaire' && typeMot !== 'controle' && !vetoControle) {
    /**
     * ⚠️ CETTE BRANCHE ÉNUMÉRAIT LES TYPES À LA MAIN, et c'était la duplication
     * la plus coûteuse du moteur. Chaque champ était lu DEUX FOIS : ici pour la
     * dictée, et dans `SLOTS_PAR_TYPE[t].lire` pour le remplissage guidé — avec
     * des expressions régulières DIFFÉRENTES. Deux conséquences :
     *
     *  · un type nouveau n'était pas lu du tout dans une phrase dictée, même
     *    quand ses slots savaient parfaitement le faire ;
     *  · les deux voies ne comprenaient pas la même chose. « Pas vu la reine »
     *    passait dicté et ne passait pas en réponse à la question — le même
     *    apiculteur, la même phrase, deux résultats.
     *
     * On applique donc les SLOTS du type sur la phrase entière. Un seul jeu de
     * règles, un seul comportement, et chaque geste nouveau est lu dès qu'il a
     * ses slots.
     */
    const donnees = donneesBase(typeMot, norm);
    // ⚠️ ON RETIRE LA RÉFÉRENCE DE RUCHE AVANT DE LIRE LES NOMBRES. Sans ça,
    // « ruche 4, j'ai posé 2 hausses » enregistrait QUATRE hausses, et
    // « j'ai divisé la ruche 12 en 3 » refusait le nombre parce que 12 dépasse
    // le maximum de dix divisions. Le numéro de ruche est déjà extrait plus
    // haut : le laisser dans la phrase, c'est le compter deux fois.
    const sansRuche = norm.replace(
      /\bruche(?:tte)?s?\s+(?:n[°o]?\s*|numero\s*|num\s*|r\s*)?[a-z]?\d+[a-z]?/g,
      ' ',
    );
    for (const slot of slotsDe(typeMot, donnees)) {
      if (slot.key in donnees) continue;
      // `false` : PHRASE SPONTANÉE. Les champs de texte libre s'abstiennent —
      // sinon le numéro de lot vaudrait la phrase entière.
      const lu = slot.lire(sansRuche, raw, false);
      // `null` = « je passe » : c'est une réponse à une QUESTION, pas quelque
      // chose qu'on déduit d'une phrase spontanée. On ne le retient pas ici.
      if (lu) Object.assign(donnees, lu);
    }
    return {
      rucheNumero,
      rucherIndice,
      type: typeMot,
      donnees,
      commentaire: extraireNote(raw) || undefined,
      manque: manqueRestant(typeMot, donnees, rucheNumero),
    };
  }

  // 3. Contrôle (observations) — sinon note libre.
  const estControle = OBS_CONTROLE.test(norm) || /\b(controle|visite|inspection)\b/.test(norm);
  if (!estControle) {
    const texte = extraireNote(raw);
    return {
      rucheNumero,
      rucherIndice,
      type: 'commentaire',
      donnees: { texte },
      commentaire: texte,
      manque: rucheNumero ? [] : ['ruche'],
    };
  }

  // Contrôle : on ne renseigne QUE les observations explicitement dictées. Les
  // champs absents (force, comportement, etc.) restent dans `manque` → demandés.
  const donnees: Record<string, unknown> = {};
  const reineNeg =
    /\b(pas\s+(de\s+|vu\s+)?reine|reine\s+non\s+vue|sans\s+reine|orpheline|reine\s+absente|pas\s+vu\s+la\s+reine)\b/.test(
      norm,
    );
  if (reineNeg) donnees.reineVue = false;
  else if (/\b(reine|ponte|oeuf|oeufs)\b/.test(norm)) donnees.reineVue = true;

  const couvainNeg = /\b(pas\s+de\s+couvain|sans\s+couvain|aucun\s+couvain)\b/.test(norm);
  if (couvainNeg) donnees.couvainPresent = false;
  else if (/\b(couvain|opercul\w*|larve[s]?)\b/.test(norm)) donnees.couvainPresent = true;

  const reserveNeg = /\b(pas\s+de\s+reserves?|sans\s+reserves?|peu\s+de\s+reserves?)\b/.test(norm);
  if (reserveNeg) donnees.reserves = false;
  else if (/\b(reserves?|provisions?)\b/.test(norm)) donnees.reserves = true;

  if (/\bcellules?\s+royales?\b/.test(norm)) donnees.celluleRoyale = true;

  const force = lireForce(norm);
  if (force !== undefined) donnees.forceColonie = force;
  const comportement = lireComportement(norm);
  if (comportement !== undefined) donnees.comportement = comportement;

  return {
    rucheNumero,
    rucherIndice,
    type: 'controle',
    donnees,
    commentaire: extraireNote(raw) || undefined,
    manque: manqueRestant('controle', donnees, rucheNumero),
  };
}

// ─── Reconstruction du flux guidé (moteur sans état) ─────────────────────────

/** Verbes exprimant l'envie de faire quelque chose (au-delà de l'écriture pure). */
const VERBE_INTENTION = /\b(faire|nouvelle|nouveau|veux|voudrais|aimerais|souhaite|envie)\b/;

/** Verbes de LECTURE — à NE PAS confondre avec un choix de type pendant le flux
 * (« montre mes récoltes » ne doit pas créer une intervention de récolte). */
const VERBE_LECTURE =
  /\b(montre|montrer|affiche|afficher|liste|lister|voir|consulte|consulter|combien|quels?|quelles?|resume|recap)\b/;

/**
 * Intention NUE : « fais une intervention », « note une intervention »… sans type
 * précis ni observation. Maya doit alors PROPOSER le type (choisir_type). Une
 * ruche éventuellement citée est tolérée (reportée sur l'intervention choisie).
 */
export function estIntentionInterventionNue(norm: string): boolean {
  if (!VERBE_ECRITURE.test(norm) && !VERBE_INTENTION.test(norm)) return false;
  if (!/\bintervention\b/.test(norm)) return false;
  const t = lireTypeIntervention(norm);
  if (t && t !== 'commentaire') return false; // un type précis est déjà annoncé
  if (OBS_CONTROLE.test(norm) || GESTE_ECRITURE.test(norm)) return false;
  return true;
}

/** Détecte si un message DÉMARRE un flux d'intervention (et sous quelle forme). */
function debutIntervention(norm: string, estQuestion: boolean): 'nue' | 'ecriture' | null {
  if (estIntentionInterventionNue(norm)) return 'nue';
  if (estActionEcriture(norm, estQuestion)) return 'ecriture';
  // Type précis annoncé sans données complètes (« fais un nourrissement »).
  const t = lireTypeIntervention(norm);
  if (
    !estQuestion &&
    (VERBE_ECRITURE.test(norm) || VERBE_INTENTION.test(norm)) &&
    t &&
    t !== 'commentaire'
  )
    return 'ecriture';
  return null;
}

/** Renseigne la ruche depuis une réponse isolée (« la 12 », « royal », « Ruche royal »). */
function remplirRuche(parse: InterventionParsee, norm: string): void {
  const ref = extraireRuche(norm); // numéro éventuel — sinon ruche NOMMÉE (résolue par libellé)
  if (ref) parse.rucheNumero = ref;
  parse.rucheLabel = norm; // libellé conservé pour la résolution exacte (ruches nommées)
  parse.manque = parse.manque.filter((k) => k !== 'ruche');
  const rucher = extraireRucherSeul(norm);
  if (rucher) parse.rucherIndice = rucher;
}

/**
 * Vrai si une réponse isolée DÉSIGNE plausiblement une ruche — numéro (« la 12 »)
 * OU nom (« royal », « Ruche bleue »). Indispensable pour les ruches nommées :
 * sans ça, taper « Ruche royal » en réponse à « sur quelle ruche ? » échouait.
 */
function estReponseRuche(norm: string): boolean {
  if (extraireRucheSeule(norm)) return true; // « la 12 », « ruche 7 »
  const mots = norm.split(' ').filter(Boolean);
  if (mots.length === 0) return false;
  // Cibles MULTIPLES (plusieurs ruches / rucher entier / toutes) : on les accepte
  // comme réponse à « sur quelle ruche ? » — le fan-out est ensuite routé en LOT.
  if (/\b(toutes?|tout\s+le\s+(rucher|cheptel))\b/.test(norm)) return true; // « toutes mes ruches », « tout le rucher Nord »
  if (/\b(ruches|colonies)\b/.test(norm) && mots.length <= 8) return true; // « les ruches 3, 5 et 7 »
  if (/\b(ruche|ruchette|colonie)\b/.test(norm) && mots.length <= 5) return true; // « ruche royal »
  return mots.length <= 2; // nom court tapé / chip cliqué (« royal », « bleue »)
}

/**
 * Applique une réponse isolée au PREMIER champ attendu (`manque[0]`). Renvoie
 * `true` si la réponse a fait avancer le flux. Une ruche citée explicitement
 * (« la 12 ») est acceptée même si un autre champ est attendu (lève l'ambiguïté
 * avec un champ numérique : « 12 » nu reste la réponse au champ courant).
 */
function appliquerReponse(parse: InterventionParsee, norm: string, raw: string): boolean {
  // Désambiguïsation de RUCHER : une ruche est déjà choisie (numéro) mais le
  // rucher n'a pas encore été précisé (numéro ambigu → « quel rucher ? »). Un
  // message qui NOMME un rucher complète alors la ruche, MÊME si 'ruche' a déjà
  // quitté `manque` (sinon la réponse « Ruche 1 — Rucher Grand père » n'était pas
  // consommée → le flux tombait et repartait sur l'intent « ruchers »).
  if (parse.rucheNumero !== undefined && parse.rucherIndice === undefined) {
    const rucher = extraireRucherSeul(norm);
    if (rucher) {
      parse.rucherIndice = rucher;
      parse.rucheLabel = norm; // libellé complet conservé pour la résolution exacte
      return true;
    }
  }

  const courant = parse.manque[0];
  if (!courant) return false;

  // On accepte une ruche donnée EN AVANCE seulement si le message est un libellé
  // de ruche PROPRE : court (« Ruche 7 », « la 12 ») ou un chip avec rucher
  // (« Ruche 2 (Rucher des Tilleuls) »). On rejette une phrase de contexte
  // (« Ruche 7 pour ma visite ») pour ne pas sauter la question courante.
  const motsCourant = norm.split(' ').filter(Boolean).length;
  if (
    courant !== 'ruche' &&
    courant !== 'texte' &&
    parse.manque.includes('ruche') &&
    /\b(ruche|la)\b/.test(norm) &&
    extraireRucheSeule(norm) &&
    (motsCourant <= 3 || /\brucher\b/.test(norm))
  ) {
    remplirRuche(parse, norm);
    return true;
  }

  if (courant === 'ruche') {
    if (estReponseRuche(norm)) {
      remplirRuche(parse, norm);
      return true;
    }
    return false;
  }

  const slot = slotsDe(parse.type, parse.donnees).find((s) => s.key === courant);
  if (!slot) return false;
  // convertirNombres : « deux litres », « quarante-deux » → chiffres avant extraction.
  // `true` : c'est LA réponse à LA question de ce champ. Le seul endroit où un
  // champ de texte libre a le droit de prendre ce qu'on lui donne.
  const frag = slot.lire(convertirNombres(norm), raw, true);
  if (frag === null) {
    if (!slot.requis) {
      parse.donnees[courant] = null;
      parse.manque = parse.manque.filter((k) => k !== courant);
      return true;
    }
    return false;
  }
  if (frag) {
    Object.assign(parse.donnees, frag);
    parse.manque = parse.manque.filter((k) => !(k in frag));
    return true;
  }

  // Un champ répondu DANS LE DÉSORDRE reste un champ répondu.
  //
  // Maya pose ses questions une par une, mais celui qui DICTE ne suit pas l'ordre :
  // à « As-tu vu la reine ? » il répond « force 3 », parce que c'est ce qu'il a
  // sous les yeux. Sans ce rattrapage, le message n'est consommé par personne,
  // `dernierConsomme` reste faux, `resoudreFluxIntervention` rend `null` — et
  // l'intervention en cours est PERDUE. Maya répond « Je n'ai pas bien saisi » à
  // un apiculteur qui vient de lui donner une donnée parfaitement valide, et il
  // faut tout recommencer.
  //
  // La ruche donnée en avance bénéficiait déjà de cette tolérance (plus haut) ;
  // elle n'avait simplement jamais été étendue aux autres champs.
  //
  // Deux exclusions :
  //  • `ruche` — traitée par sa propre règle, plus stricte (un libellé propre,
  //    pas une phrase de contexte) ;
  //  • `texte` — la note libre accepte N'IMPORTE QUOI. L'inclure ferait avaler
  //    par le commentaire tout message qu'aucun autre champ ne reconnaît.
  //
  // Honnêteté sur la portée : `texte` est aujourd'hui le SEUL champ du type
  // `commentaire`, donc il ne peut jamais être « un autre champ en attente » —
  // il serait forcément la question courante, déjà écartée par `cle === courant`.
  // La mutation qui retire cette exclusion ne fait donc rien tomber, et c'est
  // normal : la garde ne sert pas aujourd'hui, elle sert le jour où quelqu'un
  // ajoutera un second champ au commentaire. Elle est gardée pour ce jour-là,
  // pas parce qu'un banc la couvre.
  //
  // Même remarque pour `if (frag2)` : seul `lireBoolReponse` rend `null`, et
  // ses trois champs (reine, couvain, réserves) sont les PREMIERS de la liste —
  // jamais « un autre champ » quand un champ plus tardif est courant. La forme
  // stricte est conservée parce qu'elle reste la bonne si l'ordre change : un
  // `null` veut dire « champ explicitement passé », ce qui n'a de sens que pour
  // la question réellement posée.
  for (const cle of parse.manque) {
    if (cle === courant || cle === 'ruche' || cle === 'texte') continue;
    const frag2 = slotsDe(parse.type, parse.donnees)
      .find((s) => s.key === cle)
      // `false`, et c'est SUBTIL. On est bien dans une réponse, mais pas dans
      // celle de CE champ : on regarde si la phrase renseigne aussi les autres.
      // Un champ libre qui participerait ici prendrait la réponse destinée à
      // son voisin — Maya demande « quel produit ? », l'apiculteur répond
      // « Apivar », et le numéro de lot vaudrait « Apivar ».
      ?.lire(convertirNombres(norm), raw, false);
    if (frag2) {
      Object.assign(parse.donnees, frag2);
      parse.manque = parse.manque.filter((k) => !(k in frag2));
      return true;
    }
  }
  return false;
}

/** Résultat de la reconstruction du flux d'intervention en cours. */
export type FluxIntervention =
  | { etat: 'choisir_type' }
  | { etat: 'ecriture'; parse: InterventionParsee };

/**
 * Reconstruit l'intervention EN COURS depuis tout l'historique (le moteur est
 * sans état) : trouve le dernier « pivot » (intention nue ou écriture), fixe le
 * type, puis rejoue chaque réponse de l'apiculteur sur les champs attendus.
 * Renvoie `choisir_type` tant que le type est inconnu, l'écriture (complète ou
 * partielle) sinon, ou `null` si le dernier message ne relève pas du flux.
 */
export function resoudreFluxIntervention(
  messagesUtilisateur: string[],
  estQuestion = false,
): FluxIntervention | null {
  const msgs = messagesUtilisateur;
  if (msgs.length === 0) return null;
  const dernier = msgs.length - 1;

  // 1. Pivot = dernier message qui DÉMARRE une intervention.
  let pivot = -1;
  let pivotNue = false;
  for (let i = dernier; i >= 0; i--) {
    const d = debutIntervention(normaliser(msgs[i] ?? ''), i === dernier ? estQuestion : false);
    if (d) {
      pivot = i;
      pivotNue = d === 'nue';
      break;
    }
  }
  if (pivot === -1) return null;

  // 2. État initial depuis le pivot.
  const pivotNorm = normaliser(msgs[pivot] ?? '');
  let parse: InterventionParsee | null = pivotNue
    ? null
    : analyserIntervention(pivotNorm, msgs[pivot] ?? '');
  let typePending = pivotNue;
  const rucheNue = pivotNue ? extraireRuche(pivotNorm) : undefined;
  const rucherNue = pivotNue ? extraireRucherSeul(pivotNorm) : undefined;
  let dernierConsomme = pivot === dernier;

  // 3. Rejeu des réponses postérieures au pivot.
  for (let j = pivot + 1; j <= dernier; j++) {
    const raw = msgs[j] ?? '';
    const norm = normaliser(raw);
    if (typePending) {
      // Une QUESTION ou une LECTURE n'est jamais un choix de type (sinon « montre
      // mes récoltes » créerait une intervention de récolte vide).
      const estQuestionJ = j === dernier ? estQuestion : false;
      const t = estQuestionJ || VERBE_LECTURE.test(norm) ? undefined : lireTypeIntervention(norm);
      if (t) {
        parse = nouvelleInterventionGuidee(t);
        if (rucheNue) {
          parse.rucheNumero = rucheNue;
          parse.manque = parse.manque.filter((k) => k !== 'ruche');
          if (rucherNue) parse.rucherIndice = rucherNue;
        }
        typePending = false;
        if (j === dernier) dernierConsomme = true;
      }
      continue;
    }
    if (!parse) continue;
    // Une vraie QUESTION en dernier message (« elle est agressive ? », « c'est
    // quoi le couvain ? ») n'est PAS une réponse de champ : on ne la consomme pas
    // → resoudreFluxIntervention renverra null et classifierTour la reclassera.
    if (j === dernier && estQuestion) continue;
    const consomme = appliquerReponse(parse, norm, raw);
    if (j === dernier && consomme) dernierConsomme = true;
  }

  // 4. Le dernier message doit faire partie du flux (sinon : autre intention).
  if (pivot !== dernier && !dernierConsomme) return null;
  if (typePending) return { etat: 'choisir_type' };
  if (!parse) return null;
  return { etat: 'ecriture', parse };
}

// ─── Résolution + exécution (accès base, scopé userId) ───────────────────────

export type PrevisualisationIntervention =
  | { ok: true; apercu: string; params: Record<string, unknown> }
  | {
      ok: false;
      message: string;
      suggestions?: string[];
      navigation?: { label: string; to: string };
    };

/** Aperçu générique d'une action d'écriture (même forme pour toutes). */
export type Apercu = PrevisualisationIntervention;

/** Identifiant d'une action d'écriture exécutable (registre `executerAction`). */
/**
 * L'identifiant d'une écriture, et celles qui créent vraiment une ligne.
 *
 * ⚠️ CES DEUX TYPES ÉTAIENT ÉCRITS À LA MAIN — ici, et RECOPIÉS dans
 * `app/composables/useCopilote.ts`, dans l'énumération Zod de la route, et
 * dans trois tables. Ils sont maintenant DÉRIVÉS du catalogue
 * `app/config/maya-actions.ts`, qui ne contient que des données et se lit donc
 * aussi bien côté navigateur que côté serveur. Une action ajoutée là-bas
 * traverse tout le flux ; une action oubliée ne compile plus.
 */
export type { ActionId, ActionCreatrice } from '~~/app/config/maya-actions';

/** Écriture détectée dans un tour de conversation (avant aperçu/confirmation). */
export type Ecriture =
  | { action: 'intervention'; parse: InterventionParsee }
  | { action: 'client'; parse: ClientParse }
  | { action: 'recolte'; parse: RecolteParse }
  | { action: 'stock'; parse: StockParse };

export interface RucheRef {
  id: string;
  numero: string;
  rucherNom: string;
  rucherId: string;
}

/** Compare deux numéros de ruche avec tolérance (« 012 » = « 12 », « R5 » = « 5 »). */
export function memeNumero(numRuche: string, cible: string): boolean {
  const a = normaliser(numRuche);
  const b = normaliser(cible);
  if (a === b) return true;
  const da = a.replace(/\D/g, '');
  const db = b.replace(/\D/g, '');
  if (da && db && Number(da) === Number(db)) return true;
  return false;
}

/** Charge toutes les ruches actives de l'utilisateur (pour résolution + suggestions + lot). */
export async function chargerRuches(userId: string): Promise<RucheRef[]> {
  return (
    db
      .select({
        id: ruches.id,
        numero: ruches.numero,
        rucherNom: ruchers.nom,
        rucherId: ruches.rucherId,
      })
      .from(ruches)
      .innerJoin(ruchers, eq(ruchers.id, ruches.rucherId))
      // Les trois statuts hors cheptel, et non le seul 'vendue' : « toutes mes
      // ruches » ciblait jusqu'ici des colonies MORTES et des ruches fusionnées.
      // C'est la même liste que `consommeDuQuota` et que le compteur du
      // middleware — deux listes qui divergent, c'est un cheptel qui n'a pas la
      // même taille selon qui le regarde.
      .where(
        and(
          eq(ruches.userId, userId),
          sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
        ),
      )
      // Aligné sur le plafond d'étapes accepté par `planSchema` côté route : au
      // delà, Maya proposait un lot qu'elle ne pouvait plus exécuter — la
      // confirmation échouait sur un message générique après avoir affiché la
      // liste. Mieux vaut annoncer le périmètre que promettre puis se dédire.
      .limit(MAX_ETAPES_PLAN)
  );
}

/** Vrai si le libellé cliqué désigne EXACTEMENT cette ruche (numéro, + rucher éventuel). */
function correspondLabel(r: RucheRef, label: string): boolean {
  const cible = normaliser(label);
  const base = normaliser(libelleRuche(r.numero)); // « ruche 7 », « ruchette 6 », « ruche 12 »
  if (cible === base) return true;
  // Libellé enrichi du rucher : « ruche 7 rucher des tilleuls »
  const rucher = normaliser(r.rucherNom);
  return cible.startsWith(`${base}`) && rucher.length > 0 && cible.includes(rucher);
}

/** Filtre les ruches correspondant au numéro (+ rucher) cités. */
function filtrerRuches(
  rows: RucheRef[],
  numero: string,
  rucherIndice?: string,
  label?: string,
): RucheRef[] {
  // 0. Clic sur une suggestion précise (« RUCHE 7 ») → correspondance EXACTE du
  // libellé. Indispensable quand plusieurs ruches partagent le même chiffre
  // (« RUCHE 7 » vs « Ruchette 7 ») : on ne retombe pas sur le match par chiffre.
  if (label) {
    const exact = rows.filter((r) => correspondLabel(r, label));
    if (exact.length >= 1) return exact;
  }
  let candidats = rows.filter((r) => memeNumero(r.numero, numero));
  if (candidats.length > 1 && rucherIndice) {
    const motsRucher = normaliser(rucherIndice)
      .split(' ')
      .filter((m) => m.length >= 4);
    if (motsRucher.length) {
      const filtres = candidats.filter((r) =>
        motsRucher.some((m) => normaliser(r.rucherNom).includes(m)),
      );
      if (filtres.length) candidats = filtres;
    }
  }

  // Ruche NOMMÉE : à défaut de numéro, libellé approchant (« ruche royal » « royal »).
  if (label && candidats.length === 0) {
    const cible = normaliser(label);
    const flous = rows.filter((r) => {
      const num = normaliser(r.numero);
      return (
        num.length >= 3 &&
        (cible.includes(num) || normaliser(libelleRuche(r.numero)).includes(cible))
      );
    });
    if (flous.length >= 1) return flous;
  }
  return candidats;
}

/**
 * Libellé d'affichage d'une ruche. Le champ `numero` est un texte libre :
 * il peut déjà contenir « Ruche 1 », « RUCHE 7 », « Ruchette 6 »… ou n'être
 * qu'un nombre (« 12 »). On ne préfixe « Ruche » QUE si c'est un nombre seul,
 * sinon on garde l'intitulé tel quel (évite « Ruche Ruchette 6 »).
 */
function libelleRuche(numero: string): string {
  const num = numero.trim();
  return /^\d/.test(num) ? `Ruche ${num}` : num;
}

/** Suggestions de ruches (boutons) — libellés parsables par le slot-filling. */
function suggestionsRuches(rows: RucheRef[], avecRucher = false): string[] {
  const vues = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const base = libelleRuche(r.numero);
    const label = avecRucher ? `${base} — ${r.rucherNom}` : base;
    if (!vues.has(label)) {
      vues.add(label);
      out.push(label);
    }
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * Propositions pour « sur quelle ruche ? » : d'abord les CIBLES MULTIPLES (toutes
 * les ruches, un rucher entier) — car une intervention peut viser plusieurs ruches
 * d'un coup — puis les ruches individuelles. Chaque libellé est compris par
 * `extraireCibles` quand l'apiculteur le tape/clique (fan-out via le moteur LOT).
 */
function suggestionsCibles(rows: RucheRef[]): string[] {
  const out: string[] = [];
  const ruchers = [...new Set(rows.map((r) => r.rucherNom).filter(Boolean))];
  if (rows.length >= 2) out.push('Toutes mes ruches');
  if (ruchers.length >= 2) {
    for (const nom of ruchers) {
      out.push(`Tout le rucher ${nom}`);
      if (out.length >= 4) break;
    }
  }
  for (const s of suggestionsRuches(rows)) {
    if (out.length >= 8) break;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** Construit l'aperçu de confirmation à partir des observations parsées. */
function apercuIntervention(numero: string, rucherNom: string, parsee: InterventionParsee): string {
  const lignes: string[] = [
    'Parfait ! Voici ce que je m’apprête à noter pour toi — on valide ?',
    '',
    `- ${libelleRuche(numero)} _(rucher ${rucherNom})_`,
    `- Type : **${LABEL_TYPE[parsee.type]}**`,
  ];
  if (parsee.resume?.length) {
    for (const l of parsee.resume) lignes.push(`- ${l}`);
    if (parsee.commentaire) lignes.push(`- Note : _${parsee.commentaire}_`);
  } else if (parsee.type === 'controle') {
    const d = parsee.donnees as {
      reineVue: boolean | null;
      couvainPresent: boolean | null;
      reserves: boolean | null;
      celluleRoyale: boolean | null;
      forceColonie: number;
      comportement: string;
    };
    const oui = (v: boolean | null) => (v === true ? 'oui' : v === false ? 'non' : '—');
    lignes.push(
      `- Reine vue : **${oui(d.reineVue)}**`,
      `- Couvain : **${oui(d.couvainPresent)}**`,
      `- Réserves : **${oui(d.reserves)}**`,
      `- Cellule royale : **${oui(d.celluleRoyale)}**`,
      `- Force (1-4) : **${d.forceColonie}**`,
      `- Comportement : **${d.comportement}**`,
    );
    if (parsee.commentaire) lignes.push(`- Note : _${parsee.commentaire}_`);
  } else {
    lignes.push(`- Note : _${(parsee.donnees as { texte: string }).texte || '—'}_`);
  }
  return lignes.join('\n');
}

/**
 * Prépare (sans écrire) l'enregistrement d'une intervention : résout la ruche,
 * construit l'aperçu et les paramètres à confirmer. Dégrade proprement (ruche
 * manquante/introuvable/ambiguë) en proposant le formulaire pré-rempli.
 */
export async function previsualiserIntervention(
  userId: string,
  parsee: InterventionParsee,
): Promise<PrevisualisationIntervention> {
  const rows = await chargerRuches(userId);

  // Aucune ruche enregistrée : on oriente vers la création.
  if (rows.length === 0) {
    return {
      ok: false,
      message:
        "Tu n'as pas encore de ruche enregistrée. Crée-en une et je pourrai noter tes interventions en un clin d'œil.",
      navigation: { label: 'Ajouter une ruche', to: '/ruches/nouveau' },
    };
  }

  // Champ métier encore manquant (force, comportement, quantité…) : on le demande
  // AVEC ses boutons, AVANT la ruche (toujours demandée en dernier). C'est le flux
  // guidé : Maya propose les éléments à remplir que l'apiculteur n'a pas écrits.
  const champManquant = parsee.manque.find((k) => k !== 'ruche');
  if (champManquant) {
    const slot = slotsDe(parsee.type, parsee.donnees).find((s) => s.key === champManquant);
    if (slot) {
      return {
        ok: false,
        message: slot.question,
        suggestions: slot.options.length ? slot.options : undefined,
      };
    }
  }

  // Ruche non précisée : on propose tes vraies ruches (tap → Maya enregistre seule).
  // PAS de lien formulaire : l'apiculteur tape sa ruche, Maya s'occupe du reste.
  if (!parsee.rucheNumero && !parsee.rucheLabel) {
    return {
      ok: false,
      message: voix('demandeRuche'),
      // Une ou plusieurs ruches, voire un rucher entier : le fan-out est géré en LOT.
      suggestions: suggestionsCibles(rows),
    };
  }

  const candidats = filtrerRuches(
    rows,
    parsee.rucheNumero ?? '',
    parsee.rucherIndice,
    parsee.rucheLabel,
  );

  // Introuvable : on liste les ruches existantes pour que tu tapes la bonne.
  if (candidats.length === 0) {
    return {
      ok: false,
      message: `Hmm, je ne trouve pas de ruche **${parsee.rucheNumero}** chez toi. Voici tes ruches — tape la bonne, je note tout`,
      suggestions: suggestionsRuches(rows),
    };
  }

  // Ambiguë : même numéro sur plusieurs ruchers.
  if (candidats.length > 1) {
    return {
      ok: false,
      message: `Plusieurs de tes ruches portent le numéro **${parsee.rucheNumero}**. De quel rucher s'agit-il ?`,
      suggestions: suggestionsRuches(candidats, true),
    };
  }

  const r = candidats[0]!;
  const params: Record<string, unknown> = {
    rucheId: r.id,
    rucherId: r.rucherId,
    type: parsee.type,
    donnees:
      parsee.type === 'commentaire'
        ? { texte: (parsee.donnees as { texte: string }).texte }
        : parsee.donnees,
  };
  if (parsee.commentaire) params.commentaire = parsee.commentaire;

  return { ok: true, apercu: apercuIntervention(r.numero, r.rucherNom, parsee), params };
}

export interface ResultatExecution {
  ok: boolean;
  texte: string;
  lien?: string;
  /** Si l'écriture est annulable en un clic, l'identifiant du créé (pour l'undo). */
  cree?: { actionId: ActionCreatrice; id: string };
  /**
   * Refus dû au PLAN, et non à une panne. La distinction compte : sur un lot,
   * l'échec était rhabillé en « Réessaie dans un instant » — un conseil faux,
   * puisque réessayer ne débloquera jamais un plafond d'abonnement.
   */
  refusPlan?: boolean;
}

/**
 * Actions exécutées EN AUTONOMIE (sans confirmation) : écritures faciles à
 * défaire et sans effet financier. Maya les enregistre puis propose « Annuler ».
 * Le sensible (vente, client, mouvement de stock, récolte qui touche le stock
 * de miel) reste en confirmation explicite.
 */
const ACTIONS_AUTO: ReadonlySet<ActionId> = new Set<ActionId>(['intervention']);

/**
 * Vrai si l'action peut être exécutée directement (sinon : confirmation requise).
 *
 * ⚠️ LA RÈGLE PORTE SUR LE COUPLE (ACTION, TYPE), ET C'EST UNE CORRECTION.
 * L'autonomie se justifiait par une promesse — « écritures faciles à défaire »
 * — que le code ne tenait pas : elle était accordée à `intervention` EN BLOC,
 * alors que la moitié de ses types écrivent dans des tables satellites qu'on ne
 * sait pas défaire (varroa, récolte, pesée, division…). Maya écrivait donc
 * toute seule des choses qu'elle ne pouvait pas retirer, puis proposait quand
 * même « Annuler ».
 *
 * `auto ⟹ annulable` est désormais vrai par construction : un type hors de la
 * liste blanche repasse par « Confirmer ». C'est un geste de plus, sur les
 * gestes qui engagent — et zéro sur les trois gestes les plus fréquents.
 */
export function estActionAuto(actionId: ActionId, typeIntervention?: string | null): boolean {
  if (!ACTIONS_AUTO.has(actionId)) return false;
  if (actionId !== 'intervention') return true;
  return typeof typeIntervention === 'string' && TYPES_ANNULABLES.has(typeIntervention);
}

/**
 * Cœur transactionnel de l'enregistrement d'une intervention : re-valide (Zod) et
 * vérifie la propriété de la ruche, puis insère via l'exécuteur fourni (`exec` =
 * `db` OU une transaction). Isolé pour être RÉUTILISÉ dans un plan en lot (toutes
 * les étapes partagent alors UNE transaction → rollback global si l'une échoue).
 *
 * `plan` est REQUIS, pour la même raison que dans `InterventionContext` : ce
 * chemin passe désormais par `dispatchHandler`, qui refuse une catégorie que le
 * plan ne couvre pas (`recolte` → `production`, `reine` → `moduleReine`) et
 * applique le plafond de cheptel sur `division`. Le rendre obligatoire fait
 * vérifier la garde par TypeScript plutôt que par la vigilance.
 */
export async function insererInterventionTx(
  exec: DrizzleTransaction,
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  const body = createInterventionSchema.parse(params);

  const [ruche] = await exec
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, userId)))
    .limit(1);
  if (!ruche) {
    return {
      ok: false,
      texte: "Je n'ai pas pu enregistrer : cette ruche est introuvable ou ne t’appartient pas.",
    };
  }

  const [created] = await exec
    .insert(interventions)
    .values({
      userId,
      rucheId: body.rucheId,
      // Sécurité : on DÉRIVE le rucherId de la ruche déjà vérifiée (WHERE eq(userId)),
      // jamais du payload client — sinon on pourrait rattacher l'intervention au
      // rucher d'un AUTRE tenant. La ruche porte la source de vérité du rucher.
      rucherId: ruche.rucherId,
      dateVisite: body.date ?? new Date(),
      type: body.type,
      meteo: body.meteo ?? null,
      donnees: body.donnees,
      notes: body.commentaire ?? null,
      photos: body.photos ?? [],
    })
    .returning({ id: interventions.id });

  if (!created) {
    return { ok: false, texte: "L'enregistrement a échoué. Réessayez dans un instant." };
  }

  // Le hub ne porte que l'enveloppe (date, type, notes, photos). Ce sont les
  // HANDLERS qui donnent son sens à la visite : `controle` recopie force,
  // reine vue, couvain et réserves dans les colonnes plates, `varroa` crée le
  // comptage, `pesee` calcule la variation, et chacun lève ses alertes.
  //
  // Sans ce dispatch, Maya écrivait `donnees` en camelCase et rien d'autre.
  // Or les lectures (score de santé, KPI du tableau de bord, génération
  // d'alertes, ciblage « les faibles ») interrogent `donnees->>'force_colonie'`
  // en snake_case AVEC repli sur la colonne plate : les DEUX branches étaient
  // vides. Une visite dictée à Maya était donc enregistrée, visible dans la
  // liste — et parfaitement invisible à tout le reste du produit.
  //
  // Passer par le même dispatcher que `POST /api/interventions/bulk` supprime
  // la divergence à sa racine plutôt que de la recopier.
  if (handlerMap[body.type]) {
    await dispatchHandler(exec, body.type, {
      userId,
      inspectionId: created.id,
      rucheId: body.rucheId,
      rucherId: ruche.rucherId,
      donnees: body.donnees,
      dateVisite: (body.date ?? new Date()).toISOString(),
      plan,
    });
  }

  return {
    ok: true,
    texte:
      'Et voilà, c’est noté ! Ton intervention est enregistrée — tu peux l’ouvrir pour ajouter des photos ou la durée.',
    lien: `/interventions/${created.id}`,
    cree: { actionId: 'intervention', id: created.id },
  };
}

/**
 * Exécute l'enregistrement d'une intervention APRÈS confirmation (action isolée).
 * Enveloppe le cœur transactionnel dans une transaction dédiée.
 */
export function executerActionIntervention(
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  return db.transaction((tx) => insererInterventionTx(tx, userId, params, plan));
}

/**
 * Annule une intervention créée à l'instant par Maya (suppression scopée userId).
 *
 * ⚠️ C'ÉTAIT UN DELETE NU, ET C'EST LE SEUL CHEMIN QUI S'EXÉCUTE EN AUTONOMIE.
 * Ni fenêtre de temps, ni garde de type, ni regard sur ce que l'intervention
 * avait entraîné — pendant que l'annulation d'un LOT, elle, relisait les types
 * en base et refusait en bloc tout ce qui écrit hors du hub. Le chemin le mieux
 * gardé était celui qui demandait une confirmation ; celui qui écrivait tout
 * seul n'avait aucun filet.
 *
 * Concrètement : dicter « ruche 3, 12 varroas » écrivait directement et
 * proposait « Annuler ». Le bouton retirait le hub, le `comptages_varroa`
 * survivait détaché (toutes les clés étrangères sont en ON DELETE SET NULL), et
 * l'alerte varroa levée au passage restait elle aussi. « C'est annulé » était
 * faux, et l'apiculteur n'avait aucun moyen de s'en apercevoir.
 *
 * On LIT donc avant de supprimer, et la règle est celle du lot, partagée.
 */
export async function annulerActionIntervention(
  userId: string,
  id: string,
): Promise<ResultatExecution> {
  const [ligne] = await db
    .select({ type: interventions.type, creeLe: interventions.createdAt })
    .from(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.userId, userId)))
    .limit(1);

  if (!ligne) {
    return {
      ok: false,
      texte: "Je n'ai pas retrouvé cette intervention — elle a peut-être déjà été supprimée.",
    };
  }

  const verdict = annulationAutorisee([ligne.type], ligne.creeLe ?? new Date(0));
  if (!verdict.ok) return { ok: false, texte: verdict.motif };

  const supprimees = await db
    .delete(interventions)
    .where(and(eq(interventions.id, id), eq(interventions.userId, userId)))
    .returning({ id: interventions.id });
  if (!supprimees.length) {
    // Course : quelqu'un l'a supprimée entre la lecture et l'effacement.
    return {
      ok: false,
      texte: "Je n'ai pas retrouvé cette intervention — elle a peut-être déjà été supprimée.",
    };
  }
  return { ok: true, texte: 'C’est annulé, je l’ai retirée' };
}

/** Annulation d'une action auto exécutée (registre central, scopé userId). */
export function annulerAction(
  userId: string,
  actionId: ActionId,
  id: string,
): Promise<ResultatExecution> {
  switch (actionId) {
    case 'intervention':
      return annulerActionIntervention(userId, id);
    default:
      return Promise.resolve({ ok: false, texte: 'Cette action ne peut pas être annulée ainsi.' });
  }
}

// ─── 3. Écriture : NOUVEAU CLIENT ────────────────────────────────────────────

export interface ClientParse {
  nom?: string;
  email?: string;
  telephone?: string;
  manque: string[];
}

// « note » EXCLU volontairement : « note un client Pierre » = prendre une note,
// pas créer une fiche client. On garde les verbes de création non ambigus.
const VERBE_CREATION_CLIENT =
  /\b(ajoute|ajouter|cree|creer|nouveau|nouvelle|enregistre|enregistrer|inscris|inscrire)\b/;
/** Phrases françaises qui ne sont PAS un nom (« sans nom », « à définir »…). */
const NON_NOM_CLIENT = /^(sans nom|a definir|inconnue?|indefini|a remplir|pas de nom|aucun nom)$/;
const RE_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const RE_TEL = /(?:\+33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}/;

/**
 * Détecte et parse une demande de création de client (« Ajoute un client :
 * Jean Dupont, jean@mail.fr, 06… »). Renvoie null si ce n'est pas l'intention.
 * Travaille sur `raw` (casse préservée) pour le nom/email ; `norm` pour les
 * déclencheurs.
 */
export function analyserClient(norm: string, raw: string): ClientParse | null {
  if (!/\bclients?\b/.test(norm) || !VERBE_CREATION_CLIENT.test(norm)) return null;
  // Tout ce qui suit le mot « client » (et un éventuel «:»), casse d'origine.
  const seg = (/clients?\s*:?\s*(.+)/i.exec(raw)?.[1] ?? '').trim();
  const email = RE_EMAIL.exec(seg)?.[0];
  const tel = RE_TEL.exec(seg)?.[0];
  let reste = seg;
  if (email) reste = reste.replace(email, ' ');
  if (tel) reste = reste.replace(tel, ' ');
  let nom = reste.split(/[,;]/)[0]?.replace(/\s+/g, ' ').trim() || undefined;
  // Un nom valide contient au moins une lettre et n'est pas une phrase « sans nom ».
  if (nom && (!/[a-z]/i.test(nom) || NON_NOM_CLIENT.test(normaliser(nom)))) nom = undefined;
  return {
    nom,
    email: email?.toLowerCase(),
    telephone: tel?.replace(/[\s.-]/g, '') || undefined,
    manque: nom ? [] : ['nom'],
  };
}

/** Aperçu (sans écrire) d'une création de client. */
export function previsualiserClient(_userId: string, p: ClientParse): Promise<Apercu> {
  if (!p.nom) {
    return Promise.resolve({
      ok: false,
      message:
        'Bien sûr ! Quel est le nom du client à ajouter ? Tu peux aussi me donner son email ou son téléphone dans la foulée.',
      navigation: { label: 'Ouvrir le formulaire client', to: '/clients' },
    });
  }
  const lignes = ['Parfait ! J’ajoute ce client — on valide ?', '', `- Nom : **${p.nom}**`];
  if (p.email) lignes.push(`- Email : ${p.email}`);
  if (p.telephone) lignes.push(`- Téléphone : ${p.telephone}`);
  return Promise.resolve({
    ok: true,
    apercu: lignes.join('\n'),
    params: { nom: p.nom, email: p.email, telephone: p.telephone },
  });
}

const clientActionSchema = z.object({
  nom: z.string().trim().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  telephone: z.string().trim().max(20).optional(),
});

/** Cœur transactionnel de la création de client (réutilisable dans un plan). */
export async function insererClientTx(
  exec: DrizzleTransaction,
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  // Même porte que `client` en route directe — la règle est LUE dans
  // ROUTE_GATES, jamais redéclarée. Avant toute écriture, et dans la
  // transaction pour que N étapes d'un lot se cumulent.
  const refus = await refusDePlan(exec, userId, 'client', plan);
  if (refus) return { ok: false, texte: refus, refusPlan: true };

  const body = clientActionSchema.parse(params);
  const [created] = await exec
    .insert(clients)
    .values({
      userId,
      nom: body.nom,
      email: body.email || null,
      telephone: body.telephone ?? null,
    })
    .returning({ id: clients.id });
  if (!created) {
    return { ok: false, texte: "L'enregistrement a échoué. Réessayez dans un instant." };
  }
  return {
    ok: true,
    texte: `C’est noté, **${body.nom}** rejoint ton carnet de clients`,
    lien: `/clients/${created.id}`,
    cree: { actionId: 'client', id: created.id },
  };
}

/** Exécute la création de client APRÈS confirmation (action isolée). */
export function executerActionClient(
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  return db.transaction((tx) => insererClientTx(tx, userId, params, plan));
}

/** Annule (supprime) un client créé par Maya, dans la transaction fournie. Scopé userId. */
export async function annulerClientTx(
  exec: DrizzleTransaction,
  userId: string,
  id: string,
): Promise<number> {
  const partis = await exec
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .returning({ id: clients.id });
  return partis.length;
}

// ─── 4. Écriture : RÉCOLTE DE PRODUCTION ─────────────────────────────────────

export interface RecolteParse {
  quantiteKg?: number;
  typeMiel?: string;
  rucherIndice?: string;
  manque: string[];
}

/** Variétés de miel reconnues (forme normalisée → libellé affiché avec accents). */
const VARIETES_MIEL: Record<string, string> = {
  'toutes fleurs': 'toutes fleurs',
  acacia: 'acacia',
  chataignier: 'châtaignier',
  tilleul: 'tilleul',
  lavande: 'lavande',
  colza: 'colza',
  tournesol: 'tournesol',
  romarin: 'romarin',
  thym: 'thym',
  bruyere: 'bruyère',
  sapin: 'sapin',
  foret: 'forêt',
  montagne: 'montagne',
  printemps: 'printemps',
  ete: 'été',
  sarrasin: 'sarrasin',
  oranger: 'oranger',
  garrigue: 'garrigue',
  miellat: 'miellat',
  aubepine: 'aubépine',
};

const RE_KG = /(\d+(?:[.,]\d+)?)\s*kg\b/;

/** Affiche un nombre de kg à la française (« 12,5 », « 25 »). */
function kgFr(n: number): string {
  return String(n).replace('.', ',');
}
/** Élision « de »/« d' » selon l'initiale de la variété de miel. */
function deMiel(typeMiel: string): string {
  return `${/^[aeiouyéèêâäh]/i.test(typeMiel) ? "d'" : 'de '}${typeMiel}`;
}

/**
 * Détecte/parse une RÉCOLTE de production (« j'ai récolté 25 kg de toutes
 * fleurs »). Exige une quantité en kg : sans elle, « ruche 2 récolté du miel »
 * reste une intervention. Renvoie null si pas une récolte de production.
 */
export function analyserRecolteProd(norm: string, raw: string): RecolteParse | null {
  const conv = convertirNombres(norm); // « quarante-deux kg » → « 42 kg »
  if (!/\b(recolt|extrai|extraction)/.test(conv)) return null;
  const mKg = RE_KG.exec(conv);
  if (!mKg?.[1]) return null;
  const quantiteKg = Number(mKg[1].replace(',', '.'));
  let typeMiel: string | undefined;
  for (const [cle, label] of Object.entries(VARIETES_MIEL)) {
    if (contientTrigger(conv, cle)) {
      typeMiel = label;
      break;
    }
  }
  return { quantiteKg, typeMiel, rucherIndice: extraireRucherSeul(raw), manque: [] };
}

/** Aperçu d'une récolte ; résout le rucher cité (best-effort) pour l'y rattacher. */
export async function previsualiserRecolte(userId: string, p: RecolteParse): Promise<Apercu> {
  let rucherId: string | undefined;
  let rucherNom: string | undefined;
  if (p.rucherIndice) {
    const rs = await db
      .select({ id: ruchers.id, nom: ruchers.nom })
      .from(ruchers)
      .where(eq(ruchers.userId, userId));
    const mots = normaliser(p.rucherIndice)
      .split(' ')
      .filter((m) => m.length >= 4);
    const found = rs.find((r) => mots.some((m) => normaliser(r.nom).includes(m)));
    if (found) {
      rucherId = found.id;
      rucherNom = found.nom;
    }
  }
  const lignes = [
    'Parfait ! J’enregistre cette récolte — on valide ?',
    '',
    `- Quantité : **${kgFr(p.quantiteKg ?? 0)} kg**`,
  ];
  if (p.typeMiel) lignes.push(`- Variété : **${p.typeMiel}**`);
  if (rucherNom) lignes.push(`- Rucher : ${rucherNom}`);
  return {
    ok: true,
    apercu: lignes.join('\n'),
    params: { quantiteKg: p.quantiteKg, typeMiel: p.typeMiel, rucherId },
  };
}

const recolteActionSchema = z.object({
  quantiteKg: z.coerce.number().min(0),
  typeMiel: z.string().min(1).max(200).optional(),
  rucherId: z.string().uuid().optional(),
});

/** Cœur transactionnel de la création de récolte (réutilisable dans un plan). */
export async function insererRecolteTx(
  exec: DrizzleTransaction,
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  // Même porte que `recolte` en route directe — la règle est LUE dans
  // ROUTE_GATES, jamais redéclarée. Avant toute écriture, et dans la
  // transaction pour que N étapes d'un lot se cumulent.
  const refus = await refusDePlan(exec, userId, 'recolte', plan);
  if (refus) return { ok: false, texte: refus, refusPlan: true };

  const body = recolteActionSchema.parse(params);
  if (body.rucherId) {
    const [r] = await exec
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, userId)))
      .limit(1);
    if (!r) return { ok: false, texte: 'Ce rucher est introuvable ou ne t’appartient pas.' };
  }
  const [created] = await exec
    .insert(recoltes)
    .values({
      userId,
      rucherId: body.rucherId ?? null,
      rucheId: null,
      dateRecolte: new Date(),
      typeMiel: body.typeMiel ?? null,
      quantiteKg: body.quantiteKg.toString(),
    })
    .returning({ id: recoltes.id });
  if (!created) {
    return { ok: false, texte: "L'enregistrement a échoué. Réessayez dans un instant." };
  }
  return {
    ok: true,
    texte: `C’est noté : **${kgFr(body.quantiteKg)} kg**${body.typeMiel ? ` ${deMiel(body.typeMiel)}` : ''} ajoutés à ta production`,
    lien: `/production/recoltes/${created.id}`,
    cree: { actionId: 'recolte', id: created.id },
  };
}

/** Exécute la création de récolte APRÈS confirmation (action isolée). */
export function executerActionRecolte(
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  return db.transaction((tx) => insererRecolteTx(tx, userId, params, plan));
}

/** Annule (supprime) une récolte créée par Maya, dans la transaction fournie. Scopé userId. */
export async function annulerRecolteTx(
  exec: DrizzleTransaction,
  userId: string,
  id: string,
): Promise<number> {
  const partis = await exec
    .delete(recoltes)
    .where(and(eq(recoltes.id, id), eq(recoltes.userId, userId)))
    .returning({ id: recoltes.id });
  return partis.length;
}

// ─── 5. Écriture : MOUVEMENT DE STOCK ────────────────────────────────────────

export interface StockParse {
  type: 'entree' | 'sortie';
  quantite?: number;
  /** Requête libre pour retrouver l'article (« pot 500g »). */
  articleQuery?: string;
  /** Libellé exact cliqué (suggestion) → résolution précise. */
  articleLabel?: string;
  manque: string[];
}

interface StockRefMini {
  id: string;
  nom: string;
  unite: string | null;
  categorie: string;
  quantite: string;
}

const RE_ENTREE_STOCK =
  /\b(ajoute|ajouter|rentre|rentrer|mets|mettre|entree|recu|recus|reapprovisionn|complete|rajoute|rajouter)\b/;
const RE_SORTIE_STOCK =
  /\b(utilise|utilises|consomme|consommes|sorti|sortie|retire|retires|enleve|enleves|sors)\b/;

/**
 * Détecte/parse un MOUVEMENT de stock. Entrée : exige le mot « stock » (sinon
 * « ajoute… » est trop générique). Sortie : un verbe de consommation suffit,
 * sauf s'il vise une ruche (« retiré la hausse ruche 3 » = pas un stock).
 * À tester APRÈS l'intervention pour ne pas voler les écritures de ruche.
 */
export function analyserStock(norm: string, _raw: string): StockParse | null {
  const aStock = /\bstocks?\b/.test(norm);
  let type: 'entree' | 'sortie' | null = null;
  if (RE_SORTIE_STOCK.test(norm)) {
    if (!aStock && extraireRuche(norm)) return null;
    type = 'sortie';
  } else if (RE_ENTREE_STOCK.test(norm) && aStock) {
    type = 'entree';
  }
  if (!type) return null;
  const mQ = /(\d+(?:[.,]\d+)?)/.exec(norm);
  if (!mQ?.[1]) return null;
  const quantite = Number(mQ[1].replace(',', '.'));
  if (!(quantite > 0)) return null; // quantité > 0 (cohérent avec Zod.positive())
  // On retire UNIQUEMENT la quantité (1re occurrence) — un nom d'article peut
  // contenir un nombre (« Pot 500g »), à ne pas effacer.
  const query = norm
    .replace(RE_ENTREE_STOCK, ' ')
    .replace(RE_SORTIE_STOCK, ' ')
    .replace(mQ[0], ' ')
    .replace(
      /\b(au|du|de|des|en|le|la|les|l|d|a|mon|ma|mes|stock|stocks|mets|jour|et|j ai)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  return {
    type,
    quantite,
    articleQuery: query || undefined,
    manque: query ? [] : ['article'],
  };
}

/** Charge les articles de stock de l'utilisateur (résolution + suggestions). */
async function chargerStocks(userId: string): Promise<StockRefMini[]> {
  return db
    .select({
      id: stocks.id,
      nom: stocks.nom,
      unite: stocks.unite,
      categorie: stocks.categorie,
      quantite: stocks.quantite,
    })
    .from(stocks)
    .where(eq(stocks.userId, userId))
    .limit(500);
}

/** Filtre les articles : correspondance exacte du nom, sinon tous les tokens présents. */
function filtrerStocks(rows: StockRefMini[], query: string, label?: string): StockRefMini[] {
  const q = normaliser(label ?? query);
  const exact = rows.filter((r) => normaliser(r.nom) === q);
  if (exact.length) return exact;
  const toks = q.split(' ').filter((t) => t.length >= 3);
  if (!toks.length) return [];
  return rows.filter((r) => {
    const n = normaliser(r.nom);
    return toks.every((t) => n.includes(t));
  });
}

/** Suggestions d'articles, ré-énonçant le mouvement complet (re-parsé au clic). */
function suggestionsStocks(rows: StockRefMini[], type: 'entree' | 'sortie', q?: number): string[] {
  const prefixe = type === 'entree' ? 'Entrée stock' : 'Sortie stock';
  const qty = q ?? 1;
  return rows.slice(0, 8).map((r) => `${prefixe} : ${kgFr(qty)} ${r.nom}`);
}

/** Aperçu d'un mouvement de stock ; résout l'article (suggestions si besoin). */
export async function previsualiserStock(userId: string, p: StockParse): Promise<Apercu> {
  const rows = await chargerStocks(userId);
  if (rows.length === 0) {
    return {
      ok: false,
      message:
        "Tu n'as pas encore d'article en stock. Crée-en un et je pourrai suivre tes entrées/sorties.",
      navigation: { label: 'Ouvrir les stocks', to: '/stocks' },
    };
  }
  if (!p.articleQuery && !p.articleLabel) {
    return {
      ok: false,
      message: 'Sur quel article ? Choisissez ci-dessous',
      suggestions: suggestionsStocks(rows, p.type, p.quantite),
    };
  }
  const candidats = filtrerStocks(rows, p.articleQuery ?? '', p.articleLabel);
  if (candidats.length === 0) {
    return {
      ok: false,
      message: 'Hmm, je ne trouve pas cet article. Voici tes stocks — lequel cherchais-tu ?',
      suggestions: suggestionsStocks(rows, p.type, p.quantite),
    };
  }
  if (candidats.length > 1) {
    return {
      ok: false,
      message: 'Plusieurs articles correspondent. Lequel exactement ?',
      suggestions: suggestionsStocks(candidats, p.type, p.quantite),
    };
  }
  const a = candidats[0]!;
  const sens = p.type === 'entree' ? 'Entrée' : 'Sortie';
  const dispo = Number(a.quantite);
  const lignes = [
    `Parfait ! J’enregistre ce mouvement de stock — on valide ?`,
    '',
    `- Article : **${a.nom}**`,
    `- ${p.type === 'entree' ? '' : ''} ${sens} : **${kgFr(p.quantite ?? 0)} ${a.unite ?? 'u'}**`,
    `- Stock actuel : ${kgFr(dispo)} ${a.unite ?? 'u'}`,
  ];
  if (p.type === 'sortie' && (p.quantite ?? 0) > dispo) {
    return {
      ok: false,
      message: `Il ne reste que **${kgFr(dispo)} ${a.unite ?? 'u'}** de « ${a.nom} » — pas assez pour en sortir ${kgFr(p.quantite ?? 0)}. Ajustez la quantité ?`,
    };
  }
  return {
    ok: true,
    apercu: lignes.join('\n'),
    params: { stockId: a.id, type: p.type, quantite: p.quantite },
  };
}

const stockActionSchema = z.object({
  stockId: z.string().uuid(),
  type: z.enum(['entree', 'sortie']),
  quantite: z.coerce.number().positive(),
});

/** Cœur transactionnel d'un mouvement de stock (réutilisable dans un plan). */
export async function insererStockTx(
  exec: DrizzleTransaction,
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  // Même porte que `stock` en route directe — la règle est LUE dans
  // ROUTE_GATES, jamais redéclarée. Avant toute écriture, et dans la
  // transaction pour que N étapes d'un lot se cumulent.
  const refus = await refusDePlan(exec, userId, 'stock', plan);
  if (refus) return { ok: false, texte: refus, refusPlan: true };

  const body = stockActionSchema.parse(params);
  const [stock] = await exec
    .select({
      id: stocks.id,
      nom: stocks.nom,
      quantite: stocks.quantite,
      unite: stocks.unite,
      categorie: stocks.categorie,
    })
    .from(stocks)
    .where(and(eq(stocks.id, body.stockId), eq(stocks.userId, userId)))
    .limit(1);
  if (!stock) return { ok: false, texte: 'Cet article est introuvable ou ne t’appartient pas.' };

  if (!allowsDecimalQuantity(stock.unite, stock.categorie) && !Number.isInteger(body.quantite)) {
    return { ok: false, texte: `« ${stock.nom} » se compte en nombre entier.` };
  }
  const dispo = Number(stock.quantite);
  if (body.type === 'sortie' && body.quantite > dispo) {
    return { ok: false, texte: `Stock insuffisant : il ne reste que ${kgFr(dispo)}.` };
  }

  const [mvt] = await exec
    .insert(mouvementsStock)
    .values({
      stockId: body.stockId,
      userId,
      type: body.type,
      quantite: body.quantite.toString(),
      motif: 'Saisi via Maya',
    })
    .returning({ id: mouvementsStock.id });
  if (!mvt) return { ok: false, texte: "L'enregistrement a échoué. Réessayez dans un instant." };

  await exec
    .update(stocks)
    .set({
      quantite: sql`${stocks.quantite}::numeric ${body.type === 'entree' ? sql`+` : sql`-`} ${body.quantite}::numeric`,
      updatedAt: new Date(),
    })
    .where(eq(stocks.id, body.stockId));

  const nouveau = body.type === 'entree' ? dispo + body.quantite : dispo - body.quantite;
  return {
    ok: true,
    texte: `C’est fait « ${stock.nom} » : ${kgFr(nouveau)} ${stock.unite ?? 'u'} en stock désormais.`,
    lien: '/stocks',
    cree: { actionId: 'stock', id: mvt.id },
  };
}

/** Exécute un mouvement de stock APRÈS confirmation (action isolée). */
export function executerActionStock(
  userId: string,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  return db.transaction((tx) => insererStockTx(tx, userId, params, plan));
}

/**
 * Annule un mouvement de stock créé par Maya : supprime le mouvement ET ré-ajuste
 * la quantité de l'article en sens INVERSE (une « entrée » de +N se défait par -N).
 * On relit le mouvement (type + quantité) pour connaître l'inverse. Scopé userId.
 */
export async function annulerStockTx(
  exec: DrizzleTransaction,
  userId: string,
  mouvementId: string,
): Promise<number> {
  const [mvt] = await exec
    .select({
      stockId: mouvementsStock.stockId,
      type: mouvementsStock.type,
      quantite: mouvementsStock.quantite,
    })
    .from(mouvementsStock)
    .where(and(eq(mouvementsStock.id, mouvementId), eq(mouvementsStock.userId, userId)))
    .limit(1);
  if (!mvt) return 0; // déjà supprimé / introuvable → idempotent
  await exec
    .delete(mouvementsStock)
    .where(and(eq(mouvementsStock.id, mouvementId), eq(mouvementsStock.userId, userId)));
  // Inverse : une entrée ajoutait → on retire ; une sortie retirait → on ré-ajoute.
  await exec
    .update(stocks)
    .set({
      quantite: sql`${stocks.quantite}::numeric ${mvt.type === 'entree' ? sql`-` : sql`+`} ${mvt.quantite}::numeric`,
      updatedAt: new Date(),
    })
    .where(and(eq(stocks.id, mvt.stockId), eq(stocks.userId, userId)));
  return 1;
}

// ─── Dispatch des actions (aperçu + exécution) ───────────────────────────────

/** Construit l'aperçu d'une écriture selon son type (avant confirmation). */
export function previsualiserAction(userId: string, e: Ecriture): Promise<Apercu> {
  switch (e.action) {
    case 'intervention':
      return previsualiserIntervention(userId, e.parse);
    case 'client':
      return previsualiserClient(userId, e.parse);
    case 'recolte':
      return previsualiserRecolte(userId, e.parse);
    case 'stock':
      return previsualiserStock(userId, e.parse);
  }
}

/** Exécute une action d'écriture confirmée. Registre central, scopé userId. */
export function executerAction(
  userId: string,
  actionId: ActionId,
  params: unknown,
  plan: Plan,
): Promise<ResultatExecution> {
  switch (actionId) {
    case 'intervention':
      return executerActionIntervention(userId, params, plan);
    case 'client':
      return executerActionClient(userId, params, plan);
    case 'recolte':
      return executerActionRecolte(userId, params, plan);
    case 'stock':
      return executerActionStock(userId, params, plan);
    case 'vente':
      return Promise.resolve({ ok: false, texte: 'Cette action arrive très bientôt' });
  }
}
