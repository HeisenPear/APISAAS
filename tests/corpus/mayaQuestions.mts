// ═══════════════════════════════════════════════════════════════════════════
// CORPUS D'ÉVALUATION DE MAYA — ce que de vrais apiculteurs écrivent ou dictent.
//
// Sert à MESURER la compréhension avant de prétendre l'améliorer : le moteur
// étant déterministe, il tourne hors ligne, donc il se mesure.
//
// Chaque entrée porte la réponse ATTENDUE, pas celle que le moteur donne
// aujourd'hui — sinon on mesurerait le vide. Un écart n'est donc pas un bug du
// corpus : c'est le gisement de travail.
//
// `articleId` reste FACULTATIF : on n'épingle la fiche que quand une autre
// réponse serait franchement fausse. Sur-spécifier rendrait le corpus cassant
// à chaque enrichissement du savoir.
// ═══════════════════════════════════════════════════════════════════════════

export type FamilleQuestion =
  | 'debutant'
  | 'pro'
  | 'dictee'
  | 'fautes'
  | 'multi-faits'
  | 'produits';

export interface CasQuestion {
  question: string;
  famille: FamilleQuestion;
  /**
   * Ce que Maya DEVRAIT décider, au sens de `classifierTour` — c'est CE QUE LA
   * PRODUCTION APPELLE. `ecriture` = la phrase déclare un fait à enregistrer
   * (« j'ai récolté 18 kilos »), pas une question.
   */
  attendu: 'action' | 'savoir' | 'salutation' | 'capacites' | 'ecriture';
  /** Intention d'action attendue, quand `attendu === 'action'`. */
  intent?: string;
  /** Fiche attendue — seulement quand toute autre réponse serait fausse. */
  articleId?: string;
  /** Pourquoi ce cas mérite d'exister (lisible dans le rapport d'échec). */
  note?: string;
}

export const CORPUS: CasQuestion[] = [
  // ── Débutant : pas de jargon, formulation naïve ───────────────────────────
  { question: 'bonjour', famille: 'debutant', attendu: 'salutation' },
  { question: 'tu sais faire quoi ?', famille: 'debutant', attendu: 'capacites' },
  {
    question: "c'est quoi une hausse ?",
    famille: 'debutant',
    attendu: 'savoir',
    note: 'Le mot-clé du produit, ignoré du débutant complet.',
  },
  {
    question: 'comment je sais si ma ruche va bien ?',
    famille: 'debutant',
    attendu: 'action',
    intent: 'sante',
  },
  {
    question: 'mes abeilles sont toutes sorties devant la ruche, est-ce normal ?',
    famille: 'debutant',
    attendu: 'savoir',
    note: 'Barbe de chaleur ou essaimage — la confusion la plus fréquente du débutant.',
  },
  {
    question: 'je vois pas la reine, elle est morte ?',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'colonie-orpheline',
  },
  {
    question: 'quand est-ce que je peux récolter mon miel ?',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'quand-recolter',
  },
  {
    question: 'il faut nourrir les abeilles en hiver ?',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'nourrissement',
  },
  {
    question: 'combien de temps vit une abeille',
    famille: 'debutant',
    attendu: 'savoir',
  },
  {
    question: 'je débute, je fais quoi en premier ?',
    famille: 'debutant',
    attendu: 'savoir',
    note: 'Ne doit jamais tomber en cul-de-sac : c’est la toute première question.',
  },

  // ── Pro : télégraphique, jargon assumé ────────────────────────────────────
  { question: 'quelles ruches visiter', famille: 'pro', attendu: 'action', intent: 'ruches_visiter' },
  { question: 'état sanitaire du cheptel', famille: 'pro', attendu: 'action', intent: 'sante' },
  { question: 'stocks', famille: 'pro', attendu: 'action', intent: 'stocks' },
  { question: 'CA du mois', famille: 'pro', attendu: 'action', intent: 'finances' },
  { question: 'météo demain', famille: 'pro', attendu: 'action', intent: 'meteo' },
  { question: 'mes alertes', famille: 'pro', attendu: 'action', intent: 'alertes' },
  { question: 'liste des ruchers', famille: 'pro', attendu: 'action', intent: 'ruchers' },
  { question: 'dernières interventions', famille: 'pro', attendu: 'action', intent: 'interventions' },
  {
    question: 'seuil varroa avant traitement ?',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'compter-varroa',
  },
  {
    question: 'protocole loque américaine',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'loques',
  },
  {
    question: 'division sur couvain ouvert',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'essaim-artificiel',
  },

  // ── Dicté : pas de ponctuation, phrases qui coulent, nombres en lettres ────
  {
    question: 'dis moi quelles ruches je dois aller voir aujourd hui',
    famille: 'dictee',
    attendu: 'action',
    intent: 'ruches_visiter',
  },
  {
    question: 'est ce que je peux poser les hausses maintenant',
    famille: 'dictee',
    attendu: 'savoir',
    articleId: 'poser-hausses',
  },
  {
    question: 'j ai recolte vingt cinq kilos sur la ruche numero trois',
    famille: 'dictee',
    attendu: 'ecriture',
    note: 'Nombres dictés en lettres — « vingt cinq » doit devenir 25, « trois » la ruche 3.',
  },
  {
    // Volontairement AMBIGU, et volontairement attendu en `savoir`.
    // « J'ai 25 kilos de miel DANS la ruche 3 » décrit un état, sans verbe
    // d'action : y forcer une écriture fabriquerait des enregistrements que
    // l'apiculteur n'a pas demandés. Mieux vaut répondre à la question.
    question: 'j ai vingt cinq kilos de miel dans la ruche numero trois',
    famille: 'dictee',
    attendu: 'savoir',
    note: 'Sans verbe d’action, on ne devine JAMAIS une écriture.',
  },
  {
    question: 'comment je traite le varroa cette annee',
    famille: 'dictee',
    attendu: 'savoir',
    articleId: 'traitement-varroa',
  },
  {
    question: 'montre moi la meteo pour le rucher du bois',
    famille: 'dictee',
    attendu: 'action',
    intent: 'meteo',
  },

  // ── Fautes : saisie au téléphone, avec des gants, au soleil ────────────────
  {
    question: 'coment traiter le varoa',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'traitement-varroa',
    note: 'Double faute sur le mot porteur du sens.',
  },
  {
    question: 'ma ruche est orfeline',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'colonie-orpheline',
  },
  { question: 'kel ruche visiter', famille: 'fautes', attendu: 'action', intent: 'ruches_visiter' },
  {
    question: 'esaimage comment eviter',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'essaimage',
  },
  { question: 'mes stok', famille: 'fautes', attendu: 'action', intent: 'stocks' },
  {
    question: 'nourisement dhiver',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'nourrissement',
  },

  // ── Multi-faits : plusieurs informations dans UN message ──────────────────
  // C'est l'exigence forte du cap produit : « des sujets très complexes avec
  // beaucoup d'infos dans le message ».
  {
    question:
      "j'ai visité le rucher du bois ce matin, la ruche 3 a une belle ponte mais la 5 est faible et j'ai vu du varroa sur les cadres",
    famille: 'multi-faits',
    attendu: 'ecriture',
    note: 'Trois faits distincts : visite, état par ruche, observation sanitaire.',
  },
  {
    question:
      "sur la 12 j'ai récolté 18 kilos et posé une hausse, et il me reste plus que deux pains de candi",
    famille: 'multi-faits',
    attendu: 'ecriture',
    note: 'Récolte + pose de hausse + niveau de stock, en une phrase.',
  },
  {
    question:
      'la reine de la ruche 7 a deux ans, la colonie essaime tous les ans, est-ce que je dois la remplacer ?',
    famille: 'multi-faits',
    attendu: 'savoir',
    note: 'Deux faits + une question de décision : doit calculer, pas réciter.',
  },
  {
    question:
      "il fait 12 degrés, on est en mars, mes hausses ne sont pas posées et j'ai du varroa, je traite maintenant ou j'attends ?",
    famille: 'multi-faits',
    attendu: 'savoir',
    note: 'Quatre critères — saison, température, hausses, varroa — pour UNE décision.',
  },

  // ── Produits : connaître, distinguer, recommander ─────────────────────────
  {
    question: 'apivar ou acide oxalique ?',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'comparatif-varroacides',
  },
  {
    question: 'quelle différence entre sirop et candi',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'comparatif-nourrissement',
  },
  {
    question: 'dadant ou langstroth pour débuter ?',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'types-ruches',
  },
  {
    question: 'tu me conseilles quoi contre le varroa en bio ?',
    famille: 'produits',
    attendu: 'savoir',
    note: 'Recommandation sous contrainte (bio) — doit trancher, pas énumérer.',
  },
  {
    question: 'je nourris avec quoi en septembre ?',
    famille: 'produits',
    attendu: 'savoir',
    note: 'La saison doit suffire à choisir entre sirop et candi.',
  },
  {
    // « Quelle ruche pour la transhumance ? » était AMBIGU : on peut y lire
    // « quel modèle acheter » comme « laquelle de mes ruches déplacer ». Maya
    // choisissait la seconde lecture, ce qui est défendable. On demande donc ce
    // qu'on veut vraiment mesurer : la recommandation d'un TYPE selon un usage.
    question: 'quel type de ruche pour la transhumance ?',
    famille: 'produits',
    attendu: 'savoir',
    note: 'Recommandation selon un usage, pas une définition.',
  },
];

/** Familles présentes, dans l'ordre d'apparition. */
export const FAMILLES = [...new Set(CORPUS.map((c) => c.famille))] as FamilleQuestion[];
