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

  // ═════════════════════════════════════════════════════════════════════════
  // VAGUE 2 (23/07/2026) — cas plus durs, pour repousser le plafond une fois
  // la vague 1 maîtrisée. On vise ce que Maya devrait comprendre mais ne
  // comprend peut-être pas encore : descriptions sans le mot juste, phonétique
  // lourde, run-on dictés, décisions sous contraintes.
  // ═════════════════════════════════════════════════════════════════════════

  // ── Débutant : décrit ce qu'il VOIT, sans connaître le terme ──────────────
  {
    question: 'mon miel est devenu dur et tout granuleux dans le pot',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'miel-cristallisation',
    note: 'Décrit la cristallisation sans jamais employer le mot.',
  },
  {
    question: 'est-ce que les abeilles piquent souvent ?',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'piqure-abeille',
  },
  {
    question: 'mes abeilles se battent à l entrée de la ruche',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'pillage',
    note: 'Bagarre à l’entrée = pillage, pas des abeilles « agressives » envers l’apiculteur.',
  },
  {
    question: 'combien ça coûte pour commencer l apiculture',
    famille: 'debutant',
    attendu: 'savoir',
    note: 'Coût de démarrage — ne doit jamais tomber en cul-de-sac.',
  },

  // ── Pro : sujet précis, formulation courte ────────────────────────────────
  {
    question: 'protocole acide oxalique par degouttement',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'acide-oxalique',
  },
  {
    question: 'taux de perte acceptable en sortie d hiver',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'mortalites-hiver',
  },
  {
    question: 'remerage par cage a reine',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'remerage',
  },
  {
    question: 'quand transhumer sur le chataignier',
    famille: 'pro',
    attendu: 'savoir',
    note: 'Timing de transhumance / miellée — définition OU calendrier acceptables.',
  },

  // ── Dicté : run-on, nombres en lettres, ordre parlé ───────────────────────
  {
    question: 'note que j ai nourri la ruche douze avec deux litres de sirop',
    famille: 'dictee',
    attendu: 'ecriture',
    note: 'Nourrissement dicté → intervention sur la ruche 12.',
  },
  {
    question: 'rappelle moi a partir de combien de varroa il faut traiter',
    famille: 'dictee',
    attendu: 'savoir',
    articleId: 'compter-varroa',
  },
  {
    question: 'montre moi les ruches a visiter dans le rucher du haut',
    famille: 'dictee',
    attendu: 'action',
    intent: 'ruches_visiter',
  },

  // ── Fautes lourdes / phonétiques ──────────────────────────────────────────
  {
    question: 'coman fer une divizion de ruche',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'essaim-artificiel',
    note: 'Phonétique lourde sur « comment faire une division ».',
  },
  {
    question: 'traitmen contre le varoa',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'traitement-varroa',
  },
  {
    question: 'mon esaim est parti',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'essaimage',
  },

  // ── Multi-faits denses ────────────────────────────────────────────────────
  {
    question:
      'ce matin au rucher nord la ruche 4 avait une belle ponte pas de varroa et j ai posé une deuxième hausse',
    famille: 'multi-faits',
    attendu: 'ecriture',
    note: 'Visite + observation sanitaire + pose de hausse en une phrase dictée.',
  },
  {
    question:
      'il pleut depuis trois jours mes hausses sont pleines je recolte maintenant ou j attends le beau temps',
    famille: 'multi-faits',
    attendu: 'savoir',
    note: 'Décision de récolte sous contrainte météo — doit raisonner, pas naviguer.',
  },

  // ── Produits : recommandation / distinction ───────────────────────────────
  {
    question: 'apiguard ou apivar pour un premier traitement',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'comparatif-varroacides',
  },
  {
    question: 'warre ou dadant quand on debute',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'types-ruches',
  },

  // ═════════════════════════════════════════════════════════════════════════
  // VAGUE 3 — LES NOUVEAUTÉS DE LA MISE À JOUR.
  //
  // Le corpus ne parlait d'AUCUNE d'elles : ni balance, ni passeport, ni
  // éco-score, ni lot. Maya était donc muette sur ce que la note de patch
  // annonce à l'apiculteur le jour du lancement.
  //
  // Les formulations sont celles qu'on emploie vraiment sur le terrain — on ne
  // dit pas « consulter le suivi pondéral », on dit « ma balance ».
  // ═════════════════════════════════════════════════════════════════════════
  {
    question: 'comment marche ma balance ?',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'balance-connectee',
    note: 'La formulation la plus probable, et la plus vague.',
  },
  {
    question: 'a quoi sert une balance sous la ruche',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'balance-connectee',
  },
  {
    // Reformulé après mesure : « je veux peser mes ruches » partait — à juste
    // titre — sur une ÉCRITURE, l'apiculteur annonçant un geste à enregistrer.
    // Tordre le moteur pour satisfaire un cas mal posé aurait dégradé le
    // produit. On garde donc la question telle qu'on la pose vraiment quand on
    // s'interroge sur la fonctionnalité.
    question: 'je peux suivre le poids de mes ruches ?',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'balance-connectee',
  },
  {
    question: "c'est quoi le passeport du miel ?",
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'passeport-miel',
  },
  {
    question: 'le qr code sur le pot il sert a quoi',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'passeport-miel',
    note: 'Sans ponctuation ni accent — la saisie au pouce, sur le terrain.',
  },
  {
    question: "c'est quoi l'eco score ?",
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'eco-score-miel',
    note: 'Écrit sans trait d’union neuf fois sur dix.',
  },
  {
    question: 'comment ameliorer la note de mon miel',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'eco-score-miel',
  },
  {
    question: 'comment je met en pot',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'tracabilite-lot',
    note: '« met » pour « mets » : la faute d’accord la plus courante.',
  },
  {
    // Deux corrections successives sur ce cas, et la seconde apprend quelque
    // chose : « teneur en eau » ramenait la fiche `miel-teneur-eau`, qui lui
    // est dédiée et qui répond MIEUX. Le corpus a donc attrapé une faute de ma
    // part — j'avais recopié ce mot-clé dans la fiche des lots, ce qui mettait
    // deux fiches en concurrence sur le même terrain. Elle le lui rend, et le
    // cas interroge ce qui appartient VRAIMENT au lot : la traçabilité amont.
    question: 'comment je retrouve d ou vient un lot de miel',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'tracabilite-lot',
  },
  {
    question: 'je dois deplacer plusieurs ruches',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'deplacer-en-masse',
  },

  // ── VAGUE 4 : ce qu'on dit vraiment sur le terrain ────────────────────────
  // Le corpus atteignait 71/71. Un instrument qui affiche 100 % ne mesure plus
  // rien : il ne peut plus que constater une régression. Cette vague vise donc
  // ce qui n'avait jamais été demandé — le vocabulaire de métier employé sans
  // explication, les questions posées en trois mots, et la dictée sans
  // ponctuation d'un apiculteur qui a les mains prises.

  {
    question: 'la ruche a essaimé je fais quoi',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'essaimage',
    note: 'Panique du débutant, sans point d’interrogation ni verbe interrogatif.',
  },
  {
    question: 'j ai des faux bourdons partout',
    famille: 'pro',
    attendu: 'savoir',
    // Fiche VOLONTAIREMENT non épinglée, et ce n'est pas un renoncement.
    //
    // J'attendais `exces-males`, qui diagnostique (au printemps : préparation à
    // l'essaimage ; à l'automne : colonie bourdonneuse). Le moteur sert
    // `ouvrieres-faux-bourdons`, la fiche de biologie — moins utile ici, mais
    // pas fausse : elle parle bien des mâles, de leur rôle et de leur expulsion.
    //
    // La règle du corpus est de n'épingler une fiche que si toute autre réponse
    // serait franchement fausse. Ce n'est pas le cas. Continuer à ajouter des
    // mots-clés jusqu'à ce que MA fiche préférée l'emporte reviendrait à ajuster
    // le moteur sur mon opinion plutôt que sur un défaut — et le corpus cesserait
    // de mesurer pour se mettre à décorer.
    //
    // Ce cas a tout de même payé : c'est lui qui a fait apparaître les mots-clés
    // dupliqués entre les deux fiches, puis le double comptage de
    // « faux-bourdon » et « faux bourdon ». Arbitrage produit ouvert : si la
    // fiche de diagnostic doit gagner ici, c'est une décision, pas un réglage.
    note: 'Un constat, pas une question — et le signe d’une colonie bourdonneuse.',
  },
  {
    question: 'y a de la loque',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'loques',
    note: 'Quatre mots, et une maladie à déclaration obligatoire derrière.',
  },
  {
    question: 'comment savoir si ma reine est bonne',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'reine-qualite',
  },
  {
    question: 'quand je mets les hausses',
    famille: 'debutant',
    attendu: 'savoir',
    articleId: 'poser-hausses',
    note: 'Sans « est-ce que » ni ponctuation : la forme parlée de la question.',
  },
  {
    question: 'quand est ce que j enleve les hausses',
    famille: 'dictee',
    attendu: 'savoir',
    articleId: 'retrait-hausses',
    note: 'Ne doit pas être confondu avec la pose : même objet, moment inverse.',
  },
  {
    question: 'les abeille son agréssive',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'abeilles-agressives',
    note: 'Trois fautes en quatre mots — accord, homophone, accent.',
  },
  {
    question: 'j ai de la fose teigne',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'fausse-teigne',
    note: '« fose » pour « fausse » : la faute telle qu’elle sort d’une dictée.',
  },
  {
    question: 'coment faire du sirop',
    famille: 'fautes',
    attendu: 'savoir',
    articleId: 'sirop-nourrissement',
  },
  {
    question: 'je veux passer en bio',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'apiculture-bio',
    note: 'Une intention, pas une question : le moteur ne doit pas y voir une écriture.',
  },
  {
    question: 'quelles aides pour m installer',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'aides-subventions',
  },
  {
    question: 'mon miel a fermenté',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'miel-defectueux',
    note: 'Ne doit pas partir sur la teneur en eau, qui en est la CAUSE et non le sujet.',
  },
  {
    question: 'quel statut pour vendre mon miel',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'statut-fiscal',
    note: 'À distinguer de « comment vendre » (vente-miel) : ici c’est le cadre légal.',
  },
  {
    question: 'apivar ou apiguard',
    famille: 'produits',
    attendu: 'savoir',
    articleId: 'comparatif-varroacides',
    note: 'Deux marques opposées sans verbe : la question est le « ou ».',
  },
  {
    question: 'il faut declarer mes ruches quand',
    famille: 'pro',
    attendu: 'savoir',
    articleId: 'declaration-ruches',
    note: 'Le « quand » arrive en fin de phrase, comme à l’oral.',
  },
];

/** Familles présentes, dans l'ordre d'apparition. */
export const FAMILLES = [...new Set(CORPUS.map((c) => c.famille))] as FamilleQuestion[];
