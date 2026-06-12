import { and, eq, ne } from 'drizzle-orm';
import { interventions, ruches, ruchers } from '~~/server/database/schema';
import { createInterventionSchema } from '~~/server/utils/validation/interventions';
import { contientTrigger, convertirNombres, normaliser } from '~~/server/utils/copilote-local';

/**
 * Couche d'ACTIONS du Copilote — ce qui le fait *agir*, pas seulement répondre.
 *
 * Deux familles, toutes deux 100 % locales et gratuites :
 *  1. NAVIGATION : reconnaître « ouvre / nouvelle / va à … » et renvoyer le
 *     raccourci (deep-link) vers la bonne page — le Copilote devient le raccourci
 *     universel du SaaS.
 *  2. ÉCRITURE : transformer une phrase (« note une visite ruche 12 : reine vue,
 *     6 cadres de couvain, pas de varroa ») en intervention prête à enregistrer.
 *     L'écriture n'a JAMAIS lieu sans confirmation explicite de l'utilisateur :
 *     `analyser…` → `previsualiser…` (récap) → `executer…` (après « Confirmer »).
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
  },
  {
    id: 'vente-nouvelle',
    label: 'Enregistrer une vente',
    to: '/finances/ventes',
    triggers: ['vente', 'vendre', 'facture', 'facturation client'],
  },
  {
    id: 'achat-nouveau',
    label: 'Enregistrer un achat',
    to: '/finances/achats',
    triggers: ['achat', 'depense', 'depenses'],
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
  },
  {
    id: 'ruche-nouvelle',
    label: 'Nouvelle ruche',
    to: '/ruches/nouveau',
    triggers: ['ruche', 'colonie', 'colonies'],
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
  for (const cible of NAVIGATIONS) {
    if (cible.triggers.some((t) => contientTrigger(norm, t))) return cible;
  }
  return null;
}

// ─── 2. Écriture : intervention par écrit ────────────────────────────────────

export type TypeIntervention =
  | 'controle'
  | 'commentaire'
  | 'nourrissement'
  | 'recolte'
  | 'pesee'
  | 'varroa';

export interface InterventionParsee {
  rucheNumero?: string;
  rucherIndice?: string;
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
  const norm = convertirNombres(brut); // « ruche douze » → « ruche 12 »
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
 *  - un verbe d'enregistrement + une cible (ruche / intervention / visite / note) ;
 *  - SANS verbe : une ruche citée + des observations (« ruche 12 reine vue,
 *    couvain ») — un ordre implicite, à condition que ce ne soit pas une question.
 * `estQuestion` permet d'éviter de prendre « la reine de la 12 va bien ? » pour
 * un ordre d'écriture.
 */
/** Gestes enregistrables sans verbe explicite (nourrissement, récolte, pesée, varroa). */
const GESTE_ECRITURE =
  /\b(nourri|sirop|candi|pate\s+proteique|recolt|extrai|pese|poids|varroa|acarien)/;

export function estActionEcriture(norm: string, estQuestion = false): boolean {
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
  if (mots.length > 4) return undefined; // trop long pour un simple complément
  const ref = extraireRuche(norm);
  if (ref) return ref;
  // Nombre seul (« 12 ») en réponse à « sur quelle ruche ? »
  if (mots.length <= 2) {
    const dernier = mots[mots.length - 1] ?? '';
    if (/^\d+$/.test(dernier)) return dernier;
  }
  return undefined;
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
  const type = /\bcandi\b/.test(norm)
    ? 'candi'
    : /\bpate\b/.test(norm)
      ? 'pate_proteique'
      : /\bmiel\b/.test(norm)
        ? 'miel'
        : /\bglucose\b/.test(norm)
          ? 'sirop_glucose'
          : /\bsirop\b/.test(norm)
            ? 'sirop_sucre'
            : 'autre';
  const labels: Record<string, string> = {
    candi: 'candi',
    pate_proteique: 'pâte protéique',
    miel: 'miel',
    sirop_glucose: 'sirop de glucose',
    sirop_sucre: 'sirop de sucre',
    autre: 'autre',
  };
  return {
    type: 'nourrissement',
    donnees: { type, quantite: q.valeur, unite },
    resume: [`🍯 Apport : **${labels[type]}**`, `⚖️ Quantité : **${q.valeur} ${unite}**`],
  };
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
    resume: [`🍯 Produit récolté : **${typeProduit}**`],
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
    resume: [`⚖️ Poids : **${q.valeur} kg** (${typePesee.replace('_', ' ')})`],
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
    resume: [`🪲 Varroas comptés : **${nombreVarroas}** sur **${dureeJours} j**`],
  };
}

/**
 * Transforme une phrase en intervention structurée (sans toucher la base).
 * `norm` = question normalisée (détection) ; `raw` = message d'origine (note).
 */
export function analyserIntervention(normBrut: string, raw: string): InterventionParsee {
  const norm = convertirNombres(normBrut); // « ruche douze, force trois » → chiffres
  const manque: string[] = [];

  const rucheNumero = extraireRuche(norm);
  if (!rucheNumero) manque.push('ruche');

  // Rucher éventuel : « rucher des tilleuls » → indice « des tilleuls »
  const mRucher = /\brucher\s+([a-z0-9]+(?:\s+[a-z0-9]+){0,2})/.exec(norm);
  const rucherIndice = mRucher?.[1];

  // Gestes spécifiques (priorité) : nourrissement, récolte, pesée, comptage varroa.
  const spec =
    parseNourrissement(norm) ?? parseRecolte(norm) ?? parsePesee(norm) ?? parseVarroaComptage(norm);
  if (spec) {
    return {
      rucheNumero,
      rucherIndice,
      type: spec.type,
      donnees: spec.donnees,
      resume: spec.resume,
      commentaire: extraireNote(raw) || undefined,
      manque,
    };
  }

  // Type : présence d'observations de contrôle → contrôle ; sinon note libre.
  const estControle = OBS_CONTROLE.test(norm) || /\b(controle|visite)\b/.test(norm);

  if (!estControle) {
    return {
      rucheNumero,
      rucherIndice,
      type: 'commentaire',
      donnees: { texte: extraireNote(raw) },
      commentaire: extraireNote(raw),
      manque,
    };
  }

  // ─ Observations de contrôle (négation prioritaire sur l'affirmation) ─
  // « ras » (rien à signaler) = colonie calme, sans alerte particulière.
  const ras = /\bras\b/.test(norm);

  const reineNeg =
    /\b(pas\s+(de\s+|vu\s+)?reine|reine\s+non\s+vue|sans\s+reine|orpheline|reine\s+absente|pas\s+vu\s+la\s+reine)\b/.test(
      norm,
    );
  const reinePos = /\b(reine|ponte|oeuf|oeufs)\b/.test(norm);
  const reineVue = reineNeg ? false : reinePos ? true : null;

  const couvainNeg = /\b(pas\s+de\s+couvain|sans\s+couvain|aucun\s+couvain)\b/.test(norm);
  const couvainPos = /\b(couvain|opercul|larve|larves)\b/.test(norm);
  const couvainPresent = couvainNeg ? false : couvainPos ? true : null;

  const reserveNeg = /\b(pas\s+de\s+reserve|sans\s+reserve|peu\s+de\s+reserve)\b/.test(norm);
  const reservePos = /\b(reserve|provision|provisions)\b/.test(norm);
  const reserves = reserveNeg ? false : reservePos ? true : null;

  const celluleRoyale = /\bcellules?\s+royales?\b/.test(norm) ? true : null;

  // Force : « force 3 », sinon « forte » (4) / « faible » (1), sinon défaut 3.
  const mForce = /\bforce\s+(?:de\s+)?([1-4])\b/.exec(norm);
  const forceColonie = mForce
    ? Number(mForce[1])
    : /\bforte\b|\bpopuleuse\b/.test(norm)
      ? 4
      : /\bfaible\b|\bpetite\b/.test(norm)
        ? 1
        : 3;

  const comportement = /\b(agress)/.test(norm)
    ? 'agressive'
    : /\b(agit|nerveu|enerv)/.test(norm)
      ? 'agitee'
      : /\b(calme|tranquille|paisible|douce)\b/.test(norm) || ras
        ? 'calme'
        : 'calme';

  return {
    rucheNumero,
    rucherIndice,
    type: 'controle',
    donnees: { reineVue, couvainPresent, celluleRoyale, reserves, forceColonie, comportement },
    commentaire: extraireNote(raw) || undefined,
    manque,
  };
}

// ─── Résolution + exécution (accès base, scopé userId) ───────────────────────

const LABEL_TYPE: Record<TypeIntervention, string> = {
  controle: 'Contrôle',
  commentaire: 'Note',
  nourrissement: 'Nourrissement',
  recolte: 'Récolte',
  pesee: 'Pesée',
  varroa: 'Comptage varroa',
};

export type PrevisualisationIntervention =
  | { ok: true; apercu: string; params: Record<string, unknown> }
  | { ok: false; message: string; navigation?: { label: string; to: string } };

/** Cherche les ruches de l'utilisateur correspondant au numéro (+ rucher) cités. */
async function resoudreRuches(
  userId: string,
  numero: string,
  rucherIndice?: string,
): Promise<Array<{ id: string; numero: string; rucherNom: string; rucherId: string }>> {
  const rows = await db
    .select({
      id: ruches.id,
      numero: ruches.numero,
      rucherNom: ruchers.nom,
      rucherId: ruches.rucherId,
    })
    .from(ruches)
    .innerJoin(ruchers, eq(ruchers.id, ruches.rucherId))
    .where(and(eq(ruches.userId, userId), ne(ruches.statut, 'vendue')))
    .limit(500);

  const cible = normaliser(numero);
  let candidats = rows.filter((r) => normaliser(r.numero) === cible);

  // Affinage par rucher si plusieurs ruches portent le même numéro.
  if (candidats.length > 1 && rucherIndice) {
    const motsRucher = normaliser(rucherIndice)
      .split(' ')
      .filter((m) => m.length >= 4);
    if (motsRucher.length) {
      const filtres = candidats.filter((r) => {
        const nom = normaliser(r.rucherNom);
        return motsRucher.some((m) => nom.includes(m));
      });
      if (filtres.length) candidats = filtres;
    }
  }
  return candidats;
}

/** Construit l'aperçu de confirmation à partir des observations parsées. */
function apercuIntervention(numero: string, rucherNom: string, parsee: InterventionParsee): string {
  const lignes: string[] = [
    'Je vais enregistrer cette intervention — **confirmez-vous ?**',
    '',
    `- 🐝 Ruche **${numero}** _(rucher ${rucherNom})_`,
    `- 📋 Type : **${LABEL_TYPE[parsee.type]}**`,
  ];
  if (parsee.resume?.length) {
    for (const l of parsee.resume) lignes.push(`- ${l}`);
    if (parsee.commentaire) lignes.push(`- 📝 Note : _${parsee.commentaire}_`);
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
      `- 👑 Reine vue : **${oui(d.reineVue)}**`,
      `- 🥚 Couvain : **${oui(d.couvainPresent)}**`,
      `- 🍯 Réserves : **${oui(d.reserves)}**`,
      `- 👑 Cellule royale : **${oui(d.celluleRoyale)}**`,
      `- 💪 Force (1-4) : **${d.forceColonie}**`,
      `- 🐝 Comportement : **${d.comportement}**`,
    );
    if (parsee.commentaire) lignes.push(`- 📝 Note : _${parsee.commentaire}_`);
  } else {
    lignes.push(`- 📝 Note : _${(parsee.donnees as { texte: string }).texte || '—'}_`);
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
  const versFormulaire = { label: 'Ouvrir le formulaire', to: '/interventions/nouvelle' };

  if (!parsee.rucheNumero) {
    return {
      ok: false,
      message:
        'Sur quelle ruche dois-je enregistrer cette intervention ? Précisez son numéro (ex. « ruche 12 »), ou ouvrez le formulaire.',
      navigation: versFormulaire,
    };
  }

  const candidats = await resoudreRuches(userId, parsee.rucheNumero, parsee.rucherIndice);

  if (candidats.length === 0) {
    return {
      ok: false,
      message: `Je ne trouve pas de ruche **${parsee.rucheNumero}** dans vos colonies actives. Vérifiez le numéro, ou ouvrez le formulaire.`,
      navigation: versFormulaire,
    };
  }
  if (candidats.length > 1) {
    const ruchersListe = [...new Set(candidats.map((c) => c.rucherNom))].join(', ');
    return {
      ok: false,
      message: `Plusieurs ruches portent le numéro **${parsee.rucheNumero}** (ruchers : ${ruchersListe}). Précisez le rucher, par exemple « ruche ${parsee.rucheNumero} rucher ${candidats[0]?.rucherNom} ».`,
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
}

/**
 * Exécute réellement l'enregistrement APRÈS confirmation. Re-valide les
 * paramètres (Zod) et la propriété de la ruche — on ne fait jamais confiance au
 * payload renvoyé par le client. Réutilise exactement la logique de la route.
 */
export async function executerActionIntervention(
  userId: string,
  params: unknown,
): Promise<ResultatExecution> {
  const body = createInterventionSchema.parse(params);

  const [ruche] = await db
    .select({ id: ruches.id, rucherId: ruches.rucherId })
    .from(ruches)
    .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, userId)))
    .limit(1);
  if (!ruche) {
    return {
      ok: false,
      texte: "Je n'ai pas pu enregistrer : cette ruche est introuvable ou ne vous appartient pas.",
    };
  }

  const [created] = await db
    .insert(interventions)
    .values({
      userId,
      rucheId: body.rucheId,
      rucherId: body.rucherId ?? ruche.rucherId,
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
  return {
    ok: true,
    texte:
      '✅ **Intervention enregistrée.** Vous pouvez l’ouvrir pour la compléter (photos, durée…).',
    lien: `/interventions/${created.id}`,
  };
}
