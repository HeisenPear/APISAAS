/**
 * Registre des cas d'usage d'APIGO — pages d'atterrissage par intention de
 * recherche (« logiciel facturation apiculteur », « registre d'élevage apicole »,
 * « application suivi ruches »…). Source unique partagée par les pages
 * (/utilisations, /utilisations/[slug]), le sitemap et le llms.txt.
 */

export interface Usage {
  slug: string;
  /** Titre H1 / balise title (optimisé mot-clé). */
  titre: string;
  /** Méta description (~150-160 caractères). */
  description: string;
  /** Accroche courte affichée dans le hub. */
  accroche: string;
  /** Émoji d'illustration. */
  icone: string;
  motsCles: string[];
  /** Le besoin / le problème de l'apiculteur. */
  intro: string;
  /** Comment APIGO répond (paragraphe). */
  commentApigo: string;
  /** Points concrets (puces). */
  points: string[];
  /** Bénéfice de clôture. */
  benefice: string;
  /** Questions/réponses (alimente aussi le schema FAQPage). */
  faq?: { q: string; r: string }[];
  /** Slugs d'articles de blog liés (maillage interne). */
  articlesLies?: string[];
}

export const USAGES: Usage[] = [
  {
    slug: 'suivi-des-ruches',
    titre: 'Suivi des ruches : le carnet de ruche numérique',
    description:
      'Suivez vos ruches avec APIGO : saisie des visites en quelques secondes, historique de chaque colonie, ruches à visiter en priorité. Le carnet de ruche numérique.',
    accroche:
      'Saisissez vos visites en quelques secondes et gardez l’historique de chaque colonie.',
    icone: '🐝',
    motsCles: [
      'suivi des ruches',
      'carnet de ruche numérique',
      'application suivi ruches',
      'logiciel suivi ruche',
      'cahier de rucher',
    ],
    intro:
      "Le suivi des ruches est le cœur du métier d'apiculteur. Mais entre les carnets papier qui se perdent et les tableurs vite illisibles, garder une vision claire de chaque colonie relève souvent du casse-tête.",
    commentApigo:
      "APIGO remplace le carnet papier par un carnet de ruche numérique : chaque visite se saisit en quelques secondes depuis votre mobile, même sans réseau. L'application conserve l'historique complet de chaque colonie et met en avant les ruches à visiter en priorité.",
    points: [
      'Saisie rapide des visites (contrôle, nourrissement, traitement, récolte, pesée)',
      'Historique complet et chronologie par ruche',
      'Ruches à visiter en priorité, calculées automatiquement',
      'Photos et notes attachées à chaque intervention',
      'Fonctionne hors-ligne, synchronisation automatique',
    ],
    benefice:
      'Vous gardez une vision claire de tout votre cheptel, sans rien oublier, et vous gagnez un temps précieux à chaque visite.',
    faq: [
      {
        q: 'Peut-on suivre ses ruches sans connexion internet ?',
        r: 'Oui, APIGO enregistre vos saisies hors-ligne et les synchronise dès que la connexion revient.',
      },
    ],
    articlesLies: ['suivi-de-rucher', 'calendrier-apicole'],
  },
  {
    slug: 'registre-elevage-apicole',
    titre: 'Registre d’élevage apicole automatique',
    description:
      'Tenez votre registre d’élevage apicole sans effort avec APIGO : traitements, interventions et événements sanitaires consignés automatiquement, prêts pour un contrôle.',
    accroche: 'Votre registre d’élevage se remplit tout seul à partir de vos saisies.',
    icone: '📋',
    motsCles: [
      'registre élevage apicole',
      'registre d’élevage',
      'registre apiculture',
      'registre élevage abeilles',
      'cahier sanitaire apicole',
    ],
    intro:
      "Le registre d'élevage est obligatoire pour tout détenteur de ruches. Le tenir à jour, et surtout le retrouver le jour d'un contrôle, est une corvée que beaucoup repoussent.",
    commentApigo:
      "APIGO tient le registre automatiquement à partir de vos interventions et traitements saisis : chaque acte est horodaté et tracé (produit, date, dose, numéro de lot). Vous n'avez plus à le reconstituer de mémoire.",
    points: [
      'Registre alimenté automatiquement par vos saisies',
      'Traçabilité des traitements (produit, date, dose, lot)',
      'Événements sanitaires et mortalités consignés',
      'Édition et export pour les contrôles',
    ],
    benefice:
      'Vous êtes en règle en permanence, sans paperasse, et prêt à présenter votre registre à tout moment.',
    faq: [
      {
        q: 'Le registre d’élevage est-il obligatoire en apiculture ?',
        r: 'Oui, tout détenteur de ruches doit tenir un registre d’élevage retraçant notamment les traitements et événements sanitaires. APIGO le tient automatiquement.',
      },
    ],
    articlesLies: ['traiter-le-varroa', 'declarer-ses-ruches'],
  },
  {
    slug: 'declaration-des-ruches',
    titre: 'Déclaration des ruches : préparez-la en un clic',
    description:
      'Préparez la déclaration annuelle de vos ruches avec APIGO : nombre de colonies par emplacement prêt à reporter. Ne ratez plus l’obligation de déclaration (NAPI).',
    accroche: 'Le récapitulatif de votre déclaration annuelle se prépare tout seul.',
    icone: '🗂️',
    motsCles: [
      'déclaration des ruches',
      'déclarer ses ruches',
      'déclaration ruches en ligne',
      'NAPI',
      'recensement ruches',
    ],
    intro:
      "Chaque année, entre le 1er septembre et le 31 décembre, tout détenteur de ruches doit les déclarer. Compter ses colonies par emplacement à la dernière minute est source d'erreurs et de stress.",
    commentApigo:
      'Comme APIGO connaît vos ruchers et vos colonies à jour, il prépare le récapitulatif nécessaire à la déclaration : nombre de colonies par emplacement, prêt à reporter sur le téléservice national.',
    points: [
      'Nombre de colonies par rucher, toujours à jour',
      'Récapitulatif prêt pour la déclaration annuelle',
      'Rappels pour ne pas manquer la période de déclaration',
      'Suivi de votre numéro d’apiculteur (NAPI)',
    ],
    benefice:
      'Vous remplissez votre obligation de déclaration sereinement, sans comptage de dernière minute.',
    faq: [
      {
        q: 'Quand faut-il déclarer ses ruches ?',
        r: 'La déclaration annuelle obligatoire se fait en principe entre le 1er septembre et le 31 décembre. APIGO prépare le récapitulatif et vous le rappelle.',
      },
    ],
    articlesLies: ['declarer-ses-ruches'],
  },
  {
    slug: 'facturation-apiculteur',
    titre: 'Facturation pour apiculteur : vendez votre miel en règle',
    description:
      'Facturez vos ventes de miel facilement avec APIGO : factures conformes, bons de livraison, clients et traçabilité des lots. La facturation pensée pour les apiculteurs.',
    accroche: 'Des factures conformes pour vos ventes de miel, sans tableur séparé.',
    icone: '🧾',
    motsCles: [
      'facturation apiculteur',
      'logiciel facturation miel',
      'facture vente miel',
      'facturation apiculture',
      'bon de livraison miel',
    ],
    intro:
      "Dès que l'on vend son miel, la facturation devient incontournable — et elle doit être conforme. Jongler entre un tableur, un logiciel de facture générique et son carnet de récolte fait perdre un temps fou.",
    commentApigo:
      'APIGO intègre la facturation directement à votre exploitation : vous facturez vos ventes de miel en quelques clics, avec des documents conformes aux normes en vigueur, reliés à vos clients et à la traçabilité de vos lots.',
    points: [
      'Factures conformes (facturation électronique)',
      'Bons de livraison et conversion en facture',
      'Fiches clients et historique des ventes',
      'Traçabilité des lots de miel reliée à la vente',
    ],
    benefice:
      'Vous vendez votre miel en règle, avec une comptabilité qui se tient toute seule, du pot à la facture.',
    faq: [
      {
        q: 'APIGO permet-il de faire des factures conformes ?',
        r: 'Oui, APIGO génère des factures conformes aux normes en vigueur, avec gestion des clients, des bons de livraison et de la traçabilité des lots.',
      },
    ],
    articlesLies: ['vendre-son-miel'],
  },
  {
    slug: 'comptabilite-apicole',
    titre: 'Comptabilité apicole et suivi financier par rucher',
    description:
      'Pilotez la rentabilité de votre exploitation avec APIGO : suivi des ventes et des achats, résultats par rucher, comptabilité apicole intégrée au suivi des colonies.',
    accroche: 'Suivez vos ventes, vos achats et la rentabilité de chaque rucher.',
    icone: '💶',
    motsCles: [
      'comptabilité apicole',
      'logiciel comptabilité apiculture',
      'suivi financier rucher',
      'rentabilité apiculture',
      'gestion exploitation apicole',
    ],
    intro:
      "Savoir si son exploitation est rentable, rucher par rucher, demande de croiser ventes, achats et production. Sans outil dédié, l'analyse financière reste floue.",
    commentApigo:
      "APIGO relie la partie commerciale (ventes, achats, factures) au suivi de vos colonies et de votre production. Vous obtenez une vision claire de votre chiffre d'affaires, de vos charges et de vos résultats.",
    points: [
      'Suivi des ventes et des achats',
      'Chiffre d’affaires et factures impayées en un coup d’œil',
      'Analyse de la rentabilité par rucher',
      'Données prêtes pour votre comptabilité',
    ],
    benefice:
      'Vous pilotez votre exploitation avec des chiffres fiables, et vous repérez vite ce qui rapporte vraiment.',
    articlesLies: ['vendre-son-miel'],
  },
  {
    slug: 'gestion-des-stocks',
    titre: 'Gestion des stocks apicoles (matériel et miel)',
    description:
      'Gérez vos stocks de matériel et de miel avec APIGO : inventaire, seuils d’alerte et réapprovisionnement. Ne manquez plus de cadres, de pots ni de traitements.',
    accroche: 'Inventaire, seuils d’alerte : ne tombez plus à court au mauvais moment.',
    icone: '📦',
    motsCles: [
      'gestion des stocks apicoles',
      'stock matériel apiculture',
      'inventaire apiculture',
      'gestion stock miel',
      'réapprovisionnement apiculture',
    ],
    intro:
      "Manquer de cadres en pleine miellée ou de traitement au moment de traiter, c'est l'assurance de problèmes. Suivre ses stocks de matériel, de nourrissement et de pots demande de la rigueur.",
    commentApigo:
      "APIGO suit vos stocks (matériel, nourrissement, traitements, miel) avec des seuils d'alerte : vous êtes prévenu avant de manquer, et vous savez toujours ce qu'il vous reste.",
    points: [
      'Inventaire du matériel, du nourrissement et des traitements',
      'Suivi du stock de miel et des conditionnements',
      'Seuils d’alerte et réapprovisionnement',
      'Valorisation du stock de miel',
    ],
    benefice: 'Vous anticipez vos besoins et vous abordez chaque saison sans mauvaise surprise.',
    articlesLies: [],
  },
  {
    slug: 'production-et-tracabilite-du-miel',
    titre: 'Production et traçabilité du miel',
    description:
      'Suivez votre production de miel et assurez la traçabilité des lots avec APIGO : récoltes par ruche, lots, du rucher au pot vendu. Conformité et performance réunies.',
    accroche: 'De la récolte au pot : suivez la production et tracez vos lots de miel.',
    icone: '🍯',
    motsCles: [
      'traçabilité du miel',
      'lots de miel',
      'production de miel logiciel',
      'suivi récolte miel',
      'traçabilité apiculture',
    ],
    intro:
      "Suivre sa production de miel et pouvoir relier chaque pot vendu à sa récolte (le lot) est à la fois un gage de conformité et un moyen d'améliorer ses résultats.",
    commentApigo:
      "APIGO enregistre vos récoltes par ruche et par rucher, gère les lots de miel et assure la traçabilité du rucher jusqu'au pot vendu. Vous comparez aussi vos rendements d'une année sur l'autre.",
    points: [
      'Récoltes enregistrées par ruche et par rucher',
      'Gestion des lots et traçabilité réglementaire',
      'Comparaison des rendements et des emplacements',
      'Lien entre lot, stock et vente',
    ],
    benefice:
      'Vous valorisez une production tracée et vous identifiez vos meilleurs ruchers et vos meilleures saisons.',
    articlesLies: ['recolter-le-miel', 'vendre-son-miel'],
  },
  {
    slug: 'vente-de-miel',
    titre: 'Gérer la vente de son miel',
    description:
      'Gérez la vente de votre miel avec APIGO : clients, bons de livraison, factures et traçabilité des lots. Toute la commercialisation du miel dans un seul outil.',
    accroche: 'Clients, bons de livraison, factures : toute la vente de miel au même endroit.',
    icone: '🛒',
    motsCles: [
      'vente de miel',
      'gérer la vente de miel',
      'clients apiculture',
      'bons de livraison miel',
      'commercialiser son miel',
    ],
    intro:
      "Vendre son miel, c'est gérer des clients, des bons de livraison, des factures et la traçabilité des lots. Éparpillé entre plusieurs outils, le suivi commercial devient vite chronophage.",
    commentApigo:
      'APIGO centralise toute la commercialisation : fiches clients, bons de livraison convertibles en factures, traçabilité des lots et historique des ventes. Tout est relié à votre production.',
    points: [
      'Fiches clients et historique des ventes',
      'Bons de livraison et factures conformes',
      'Traçabilité du lot vendu',
      'Statistiques de ventes par variété de miel',
    ],
    benefice:
      'Vous commercialisez votre miel avec méthode, en gardant la maîtrise de vos clients et de vos marges.',
    articlesLies: ['vendre-son-miel'],
  },
  {
    slug: 'sante-des-colonies',
    titre: 'Suivi de la santé des colonies',
    description:
      'Surveillez la santé de vos colonies avec APIGO : score de santé par ruche, suivi du varroa, alertes et historique sanitaire. Repérez les colonies à risque à temps.',
    accroche: 'Un score de santé par ruche et des alertes pour agir au bon moment.',
    icone: '❤️‍🩹',
    motsCles: [
      'santé des colonies',
      'suivi sanitaire ruches',
      'score de santé ruche',
      'suivi varroa',
      'état de santé colonie',
    ],
    intro:
      'Repérer à temps une colonie qui faiblit, une reine défaillante ou une pression varroa qui monte fait toute la différence entre une colonie sauvée et une colonie perdue.',
    commentApigo:
      'À partir de vos observations de visite, APIGO calcule un état de santé par colonie, suit le varroa et les événements sanitaires, et vous alerte sur les colonies à surveiller en priorité.',
    points: [
      'Score de santé calculé par ruche',
      'Suivi du varroa et des observations sanitaires',
      'Alertes sur les colonies à risque',
      'Historique sanitaire complet',
    ],
    benefice:
      "Vous agissez avant qu'il ne soit trop tard et vous limitez vos pertes, saison après saison.",
    articlesLies: ['traiter-le-varroa', 'frelon-asiatique-proteger-ses-ruches'],
  },
  {
    slug: 'transhumance',
    titre: 'Transhumance et gestion des emplacements',
    description:
      'Organisez la transhumance de vos ruches avec APIGO : emplacements, déplacements et analyse mellifère pour choisir les meilleurs sites de butinage.',
    accroche: 'Choisissez vos emplacements et organisez vos déplacements de ruches.',
    icone: '🚚',
    motsCles: [
      'transhumance apiculture',
      'logiciel transhumance',
      'emplacements ruches',
      'analyse mellifère',
      'déplacer ses ruches',
    ],
    intro:
      "Suivre les miellées en déplaçant ses ruches demande d'organiser des emplacements, des trajets et d'évaluer le potentiel mellifère de chaque site.",
    commentApigo:
      "APIGO vous aide à gérer vos emplacements et vos plans de transhumance, et propose une analyse mellifère pour estimer les ressources autour d'un site avant d'y poser vos ruches.",
    points: [
      'Gestion des emplacements et des plans de transhumance',
      'Analyse mellifère autour d’un emplacement',
      'Suivi des déplacements de colonies',
      'Vue cartographique de vos ruchers',
    ],
    benefice:
      'Vous optimisez vos miellées en posant vos ruches là où les ressources sont les meilleures.',
    articlesLies: ['calendrier-apicole'],
  },
  {
    slug: 'elevage-de-reines',
    titre: 'Suivi de l’élevage de reines',
    description:
      'Pilotez votre élevage de reines avec APIGO : lignées, sessions de greffage, suivi des reines et tests de performance. Sélectionnez vos meilleures colonies.',
    accroche: 'Lignées, greffage, suivi des reines : structurez votre sélection.',
    icone: '👑',
    motsCles: [
      'élevage de reines',
      'logiciel élevage reines',
      'suivi greffage',
      'lignées de reines',
      'sélection apicole',
    ],
    intro:
      'Élever ses reines permet de sélectionner ses meilleures colonies et de renouveler son cheptel à moindre coût — mais cela demande un suivi rigoureux des lignées et des sessions.',
    commentApigo:
      'APIGO structure votre élevage : suivi des lignées, des sessions de greffage, des reines produites et de leurs performances. Vous bâtissez une vraie démarche de sélection.',
    points: [
      'Suivi des lignées et de leur origine',
      'Sessions de greffage et cellules produites',
      'Suivi des reines et de leur fécondation',
      'Tests de performance pour la sélection',
    ],
    benefice:
      'Vous professionnalisez votre élevage et vous améliorez votre cheptel génération après génération.',
    articlesLies: [],
  },
  {
    slug: 'apiculture-mobile-hors-ligne',
    titre: 'Application apiculture mobile et hors-ligne',
    description:
      'APIGO est l’application apiculture qui fonctionne sur mobile et hors-ligne : saisissez vos visites au rucher sans réseau, tout se synchronise automatiquement.',
    accroche: 'Au rucher sans réseau ? Vos saisies fonctionnent et se synchronisent.',
    icone: '📱',
    motsCles: [
      'application apiculture',
      'apiculture hors-ligne',
      'app ruche mobile',
      'application suivi ruches mobile',
      'apiculture sans réseau',
    ],
    intro:
      "L'apiculture se pratique souvent en pleine nature, là où le réseau mobile manque. Beaucoup d'applications deviennent alors inutilisables, juste au moment où on en a besoin.",
    commentApigo:
      "APIGO est conçu pour le terrain : l'application s'installe sur smartphone (iPhone et Android), et vos saisies de visites et d'interventions fonctionnent hors-ligne, puis se synchronisent dès que la connexion revient.",
    points: [
      'Installation comme une application mobile (iOS et Android)',
      'Saisie des visites hors-ligne, sans réseau',
      'Synchronisation automatique au retour du réseau',
      'Interface pensée pour une utilisation rapide au rucher',
    ],
    benefice:
      "Vous n'êtes jamais bloqué au milieu d'un rucher, et vous saisissez vos visites au moment où vous les faites.",
    faq: [
      {
        q: 'APIGO fonctionne-t-il sans connexion internet ?',
        r: 'Oui. APIGO enregistre vos saisies hors-ligne et les synchronise automatiquement dès que la connexion est rétablie.',
      },
    ],
    articlesLies: ['suivi-de-rucher'],
  },
];

/** Retrouve un cas d'usage par son slug. */
export function getUsage(slug: string): Usage | undefined {
  return USAGES.find((u) => u.slug === slug);
}
