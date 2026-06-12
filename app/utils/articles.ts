/**
 * Registre des articles du blog/ressources — contenu SEO longue traîne.
 * Source unique partagée par les pages (/blog, /blog/[slug]) et le sitemap.
 * 100 % statique : aucune base, aucune dépendance.
 */

export type BlocArticle =
  | { type: 'h2'; texte: string }
  | { type: 'p'; texte: string }
  | { type: 'ul'; items: string[] };

export interface Article {
  slug: string;
  /** Titre H1 / balise title (optimisé mot-clé). */
  titre: string;
  /** Méta description (~150-160 caractères). */
  description: string;
  /** Phrase d'accroche affichée dans la liste. */
  extrait: string;
  /** Date de publication (ISO). */
  date: string;
  /** Date de mise à jour éventuelle (ISO). */
  miseAJour?: string;
  /** Temps de lecture indicatif (minutes). */
  lectureMin: number;
  /** Mots-clés ciblés. */
  motsCles: string[];
  contenu: BlocArticle[];
  /** Étapes (optionnel) pour générer un schema HowTo — guides procéduraux. */
  etapes?: { nom: string; texte: string }[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'logiciel-gestion-apicole',
    titre: 'Logiciel de gestion apicole : comment bien choisir en 2026',
    description:
      'Comparatif des critères pour choisir un logiciel de gestion apicole : suivi des ruches, mobile/hors-ligne, conformité, facturation. Guide complet pour apiculteurs.',
    extrait:
      'Suivi des ruches, registre, conformité, facturation : les vrais critères pour choisir un logiciel de gestion apicole adapté à votre exploitation.',
    date: '2026-06-01',
    lectureMin: 7,
    motsCles: [
      'logiciel gestion apicole',
      'logiciel apiculture',
      'logiciel apiculteur',
      'application apiculture',
      'gestion de rucher',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Un logiciel de gestion apicole centralise tout ce qui faisait, hier, des carnets papier éparpillés : l'état de chaque ruche, les visites, les traitements, la production de miel, les stocks, et même la comptabilité. Bien choisi, il fait gagner un temps précieux et sécurise la conformité réglementaire. Voici les critères qui comptent vraiment.",
      },
      { type: 'h2', texte: 'Le suivi des ruches et des interventions' },
      {
        type: 'p',
        texte:
          "C'est le cœur du métier. Un bon outil doit permettre de saisir une visite en quelques secondes, de tracer chaque intervention (contrôle, nourrissement, traitement varroa, récolte, pesée) et de visualiser l'historique et la santé de chaque colonie dans le temps.",
      },
      { type: 'h2', texte: 'Le terrain : mobile et mode hors-ligne' },
      {
        type: 'p',
        texte:
          "L'apiculture se pratique souvent sans réseau, en pleine nature. Un logiciel réellement utile fonctionne sur mobile et conserve vos saisies hors-ligne, qui se synchronisent une fois la connexion revenue. C'est un point sur lequel beaucoup d'outils achoppent.",
      },
      { type: 'h2', texte: 'La conformité réglementaire' },
      {
        type: 'p',
        texte:
          "En France, tout détenteur de ruches doit les déclarer chaque année et tenir un registre d'élevage. Un logiciel adapté tient ce registre automatiquement à partir de vos saisies et prépare le récapitulatif de déclaration — un gain de sérénité non négligeable.",
      },
      { type: 'h2', texte: 'La gestion commerciale et la facturation' },
      {
        type: 'p',
        texte:
          "Dès que l'on vend son miel, la traçabilité des lots, les bons de livraison et la facturation conforme deviennent indispensables. Vérifiez que l'outil gère les ventes, les clients et la facturation électronique aux normes en vigueur.",
      },
      { type: 'h2', texte: 'Les critères à comparer' },
      {
        type: 'ul',
        items: [
          'Saisie rapide des visites et registre automatique',
          'Application mobile et fonctionnement hors-ligne',
          'Santé des colonies et alertes intelligentes',
          'Production, stocks et traçabilité du miel',
          'Facturation conforme et gestion des clients',
          'Tarif clair et essai gratuit',
        ],
      },
      { type: 'h2', texte: 'APIGO, le logiciel de gestion apicole tout-en-un' },
      {
        type: 'p',
        texte:
          "APIGO réunit tous ces critères dans une seule application, du rucher à la comptabilité : suivi des ruches en quelques secondes, mode hors-ligne, registre et déclaration automatisés, conformité et facturation intégrées. Vous pouvez l'essayer gratuitement pendant 14 jours et juger sur pièces.",
      },
    ],
  },
  {
    slug: 'debuter-en-apiculture',
    titre: 'Débuter en apiculture : le guide pour bien commencer',
    description:
      'Débuter en apiculture sereinement : formation, matériel, première ruche, réglementation et calendrier. Le guide pas à pas pour les apiculteurs débutants.',
    extrait:
      'Formation, matériel, première colonie, réglementation : toutes les étapes pour bien débuter en apiculture sans se décourager.',
    date: '2026-06-03',
    lectureMin: 8,
    motsCles: [
      'débuter en apiculture',
      'commencer apiculture',
      'apiculture débutant',
      'première ruche',
      'devenir apiculteur',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Se lancer dans l'apiculture est une belle aventure, à condition de bien s'y préparer. Voici les étapes essentielles pour démarrer du bon pied et donner toutes leurs chances à vos premières colonies.",
      },
      { type: 'h2', texte: '1. Se former avant d’acheter des abeilles' },
      {
        type: 'p',
        texte:
          "Rien ne remplace la pratique encadrée. Rejoignez un rucher-école ou un apiculteur de proximité : manipuler avec un mentor vous apprendra à lire une colonie et à gérer votre stress bien plus vite que n'importe quel livre.",
      },
      { type: 'h2', texte: '2. Choisir son matériel' },
      {
        type: 'p',
        texte:
          "Optez pour un modèle de ruche répandu dans votre région (souvent la Dadant en France), pour faciliter les échanges et l'achat d'essaims. Côté équipement, l'essentiel tient en peu de choses : une vareuse avec voile, des gants, un enfumoir et un lève-cadre.",
      },
      { type: 'h2', texte: '3. Démarrer avec deux colonies' },
      {
        type: 'p',
        texte:
          "Mieux vaut commencer avec deux ruches qu'une seule : vous pourrez comparer leur développement et, au besoin, prélever un cadre de couvain de l'une pour secourir l'autre. Achetez des essaims sains au printemps, auprès d'un apiculteur sérieux.",
      },
      { type: 'h2', texte: '4. Respecter la réglementation' },
      {
        type: 'p',
        texte:
          "Dès votre première ruche, vous devez la déclarer chaque année et tenir un registre d'élevage. Renseignez-vous aussi sur les distances d'implantation, fixées par arrêté préfectoral et variables d'un département à l'autre.",
      },
      { type: 'h2', texte: '5. Apprendre le rythme des saisons' },
      {
        type: 'p',
        texte:
          "L'année apicole suit un cycle : visite de printemps, surveillance de l'essaimage, pose des hausses, récolte, traitement contre le varroa, puis préparation de l'hivernage. Noter vos observations au fil de l'eau vous fera progresser d'année en année.",
      },
      { type: 'h2', texte: 'Garder une trace de tout' },
      {
        type: 'p',
        texte:
          "Un carnet de suivi — papier ou, plus simplement, une application comme APIGO — vous aide à mémoriser l'état de chaque colonie, à ne rien oublier et à tenir votre registre sans effort. C'est l'assurance de débuter avec méthode.",
      },
    ],
  },
  {
    slug: 'traiter-le-varroa',
    titre: 'Traiter le varroa : méthodes, calendrier et bonnes pratiques',
    description:
      'Comment traiter le varroa efficacement : comptage, traitements autorisés, calendrier après récolte et en hiver. Guide pratique pour protéger vos colonies.',
    extrait:
      "Le varroa est l'ennemi numéro un de l'abeille. Comptage, traitements et calendrier : les clés pour protéger durablement vos colonies.",
    date: '2026-06-05',
    lectureMin: 6,
    motsCles: [
      'traiter le varroa',
      'traitement varroa',
      'lutte varroa',
      'compter les varroas',
      'varroa destructor',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Varroa destructor est un acarien parasite présent dans toutes les colonies en France. Non maîtrisé, il affaiblit les abeilles, transmet des virus et provoque l'effondrement de la ruche, souvent à l'automne ou en hiver. La question n'est pas « ai-je du varroa ? » mais « à quel niveau ? ».",
      },
      { type: 'h2', texte: 'Mesurer avant de traiter' },
      {
        type: 'p',
        texte:
          "Plutôt que de traiter à l'aveugle, estimez la pression parasitaire : comptage de la chute naturelle sur lange graissé pendant quelques jours, méthode au sucre glace, ou désoperculation de couvain de mâles. Mesurer régulièrement permet aussi de vérifier l'efficacité d'un traitement.",
      },
      { type: 'h2', texte: 'Le traitement principal après la récolte' },
      {
        type: 'p',
        texte:
          "Le moment clé se situe en fin d'été, juste après la dernière récolte, pour protéger les abeilles d'hiver. On utilise des produits disposant d'une AMM (lanières à base d'amitraze, acide formique selon les conditions), en respectant scrupuleusement les doses.",
      },
      { type: 'h2', texte: 'Le traitement de complément en hiver' },
      {
        type: 'p',
        texte:
          "En hiver, hors couvain, un traitement à l'acide oxalique (par dégouttement ou sublimation) est très efficace car le parasite n'est plus protégé dans les cellules operculées.",
      },
      { type: 'h2', texte: 'Tracer ses traitements' },
      {
        type: 'p',
        texte:
          "Chaque traitement doit être consigné dans le registre d'élevage : produit, date, dose, numéro de lot. Une application comme APIGO enregistre ces traitements et tient la traçabilité automatiquement. En cas de doute, demandez conseil à votre groupement sanitaire ou à un vétérinaire.",
      },
    ],
    etapes: [
      {
        nom: 'Mesurer la pression varroa',
        texte:
          'Estimez l’infestation par comptage de la chute naturelle sur lange graissé, méthode au sucre glace ou désoperculation de couvain de mâles.',
      },
      {
        nom: 'Traiter après la dernière récolte',
        texte:
          'En fin d’été, appliquez un traitement disposant d’une AMM (lanières amitraze, acide formique selon conditions) en respectant les doses, pour protéger les abeilles d’hiver.',
      },
      {
        nom: 'Compléter en hiver hors couvain',
        texte:
          'En hiver, hors couvain, appliquez un traitement à l’acide oxalique (dégouttement ou sublimation), très efficace car le parasite n’est plus protégé.',
      },
      {
        nom: 'Consigner le traitement',
        texte:
          'Notez chaque traitement dans le registre d’élevage : produit, date, dose et numéro de lot.',
      },
    ],
  },
  {
    slug: 'declarer-ses-ruches',
    titre: 'Déclarer ses ruches : obligation, dates et démarche',
    description:
      'Déclaration de ruches : obligation annuelle, période (1er septembre au 31 décembre), numéro NAPI et démarche. Tout savoir pour être en règle.',
    extrait:
      "Tout détenteur de ruches doit les déclarer chaque année. Période, numéro d'apiculteur et démarche : le mode d'emploi pour être en règle.",
    date: '2026-06-07',
    lectureMin: 5,
    motsCles: [
      'déclarer ses ruches',
      'déclaration de ruches',
      'numéro apiculteur',
      'NAPI',
      'recensement ruches',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "En France, déclarer ses ruches est une obligation légale pour tout détenteur, même pour une seule ruche et même en loisir. Cette déclaration sert au suivi sanitaire du cheptel national et conditionne l'accès à certaines aides.",
      },
      { type: 'h2', texte: 'Quand déclarer ?' },
      {
        type: 'p',
        texte:
          "La déclaration annuelle obligatoire se fait en principe entre le 1er septembre et le 31 décembre. Elle recense le nombre de colonies et l'emplacement de vos ruchers. Une déclaration est par ailleurs possible à tout moment de l'année lors d'une première détention.",
      },
      { type: 'h2', texte: 'Le numéro d’apiculteur (NAPI)' },
      {
        type: 'p',
        texte:
          "À votre première déclaration, vous obtenez un numéro d'apiculteur (NAPI), à reporter de façon visible sur vos ruchers. Il vous identifie auprès des services et accompagne toutes vos démarches ultérieures.",
      },
      { type: 'h2', texte: 'La démarche' },
      {
        type: 'p',
        texte:
          "La déclaration s'effectue en ligne sur le téléservice national dédié. Préparez le nombre de colonies et la localisation de chaque rucher. Conservez l'accusé de réception : il peut vous être demandé.",
      },
      { type: 'h2', texte: 'Préparer sa déclaration sans effort' },
      {
        type: 'p',
        texte:
          "Si vous tenez vos ruchers et vos colonies à jour dans un logiciel comme APIGO, le récapitulatif nécessaire à la déclaration se prépare tout seul : nombre de colonies par emplacement, prêt à reporter. Plus d'oubli ni de comptage de dernière minute.",
      },
    ],
  },
  {
    slug: 'suivi-de-rucher',
    titre: 'Suivi de rucher : organiser ses visites et son registre',
    description:
      'Organiser le suivi de son rucher : planifier les visites, noter les observations, tenir le registre et suivre la santé des colonies. Méthode et bonnes pratiques.',
    extrait:
      'Planifier ses visites, noter ses observations, tenir son registre : la méthode pour un suivi de rucher efficace, saison après saison.',
    date: '2026-06-09',
    lectureMin: 6,
    motsCles: [
      'suivi de rucher',
      'gestion de rucher',
      'carnet apiculture',
      'registre élevage apicole',
      'suivi des ruches',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Un bon suivi de rucher, c'est ce qui distingue une conduite maîtrisée d'une apiculture subie. Observer régulièrement, noter ce que l'on voit et savoir quoi faire au bon moment : voici comment vous organiser.",
      },
      { type: 'h2', texte: 'Planifier ses visites' },
      {
        type: 'p',
        texte:
          "Les visites s'espacent selon la saison : rapprochées au printemps (surveillance de l'essaimage), plus légères en été et à l'automne. Profitez des journées douces et calmes pour ouvrir les ruches, quand les butineuses sont aux champs.",
      },
      { type: 'h2', texte: 'Noter les bonnes observations' },
      {
        type: 'p',
        texte:
          "À chaque visite, relevez l'essentiel : présence de la reine et de ponte, état du couvain, niveau des réserves, force de la colonie, comportement et observations sanitaires. Ces données, accumulées, dessinent la trajectoire de chaque colonie.",
      },
      { type: 'h2', texte: 'Tenir son registre' },
      {
        type: 'p',
        texte:
          "Le registre d'élevage est obligatoire et doit retracer notamment les traitements et les événements sanitaires. Le tenir au fil de l'eau, plutôt que de le reconstituer de mémoire, vous évite bien des soucis en cas de contrôle.",
      },
      { type: 'h2', texte: 'Suivre la santé des colonies' },
      {
        type: 'p',
        texte:
          "En centralisant vos saisies, un outil de suivi calcule un état de santé par ruche, repère les colonies à visiter en priorité et vous alerte au bon moment. C'est précisément ce que propose APIGO : un suivi de rucher clair, du terrain au registre, même sans réseau.",
      },
    ],
  },
  {
    slug: 'essaimage-des-abeilles',
    titre: "L'essaimage des abeilles : causes, prévention et récupération",
    description:
      "Comprendre l'essaimage des abeilles : pourquoi une colonie essaime, comment le prévenir et comment récupérer un essaim. Guide pratique pour apiculteurs.",
    extrait:
      "L'essaimage est naturel mais coûteux pour l'apiculteur. Causes, signes annonciateurs, prévention et récupération : tout comprendre.",
    date: '2026-06-10',
    lectureMin: 6,
    motsCles: [
      'essaimage',
      'essaimage des abeilles',
      'empêcher essaimage',
      'récupérer un essaim',
      'cellules royales',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "L'essaimage est le mode de reproduction naturel de la colonie : au printemps, une colonie forte élève des cellules royales, puis l'ancienne reine part avec environ la moitié des abeilles pour fonder une nouvelle colonie ailleurs. Naturel, mais coûteux pour l'apiculteur : moins d'abeilles, donc moins de récolte.",
      },
      { type: 'h2', texte: 'Les signes annonciateurs' },
      {
        type: 'ul',
        items: [
          'Présence de cellules royales, surtout en bordure basse des cadres',
          'Colonie très populeuse, à l’étroit',
          'Ralentissement de la ponte de la reine',
          'Barbe d’abeilles à l’entrée par beau temps',
        ],
      },
      { type: 'h2', texte: 'Comment prévenir l’essaimage' },
      {
        type: 'p',
        texte:
          'Donnez de la place à temps (pose des hausses), renouvelez régulièrement les reines, et retirez des cadres de couvain pour réaliser des essaims artificiels. La surveillance dès les premières chaleurs (avril-mai dans la plupart des régions) est déterminante : une visite par semaine en pleine saison permet de repérer les cellules royales à temps.',
      },
      { type: 'h2', texte: 'Récupérer un essaim' },
      {
        type: 'p',
        texte:
          "Un essaim posé sur une branche est généralement peu agressif. Placez une ruchette dessous, faites tomber la grappe d'un coup sec, et assurez-vous d'avoir capturé la reine : les autres la rejoignent en quelques minutes. Laissez le tout sur place jusqu'au soir que toutes les butineuses rentrent, puis déplacez la boîte.",
      },
      { type: 'h2', texte: 'Garder le contrôle' },
      {
        type: 'p',
        texte:
          "Plutôt que de subir l'essaimage, beaucoup d'apiculteurs divisent eux-mêmes leurs colonies fortes au printemps : on agrandit son cheptel tout en réduisant la fièvre d'essaimage. Noter la dynamique de chaque colonie dans un outil comme APIGO aide à anticiper les colonies à risque.",
      },
    ],
  },
  {
    slug: 'nourrissement-des-abeilles',
    titre: 'Le nourrissement des abeilles : sirop, candi, quand et comment',
    description:
      'Nourrir ses abeilles au bon moment : sirop de stimulation, sirop lourd d’automne, candi d’hiver. Quantités, méthodes et erreurs à éviter.',
    extrait:
      'Stimulation au printemps, complément à l’automne, candi en hiver : le nourrissement des abeilles expliqué simplement, sans fausse note.',
    date: '2026-06-11',
    lectureMin: 5,
    motsCles: [
      'nourrissement des abeilles',
      'nourrir les abeilles',
      'sirop abeilles',
      'candi',
      'réserves hiver',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "On nourrit les abeilles pour deux raisons : stimuler la ponte avant une miellée, ou compléter des réserves insuffisantes pour passer l'hiver. Bien dosé, le nourrissement sauve des colonies ; mal employé, il fausse le miel ou favorise le pillage.",
      },
      { type: 'h2', texte: 'Le nourrissement de stimulation' },
      {
        type: 'p',
        texte:
          "Au printemps, un sirop léger (50/50) relance la ponte avant une miellée. À manier avec prudence : il est inutile si la nature fournit déjà du nectar, et peut même favoriser l'essaimage en surpeuplant la colonie.",
      },
      { type: 'h2', texte: 'Le nourrissement de complément' },
      {
        type: 'p',
        texte:
          "À l'automne, un sirop lourd (type 60/40) complète les réserves avant les froids. Une colonie a besoin d'environ 12 à 18 kg de réserves selon la région. En plein hiver, on apporte plutôt du candi, posé directement sur les têtes de cadres.",
      },
      { type: 'h2', texte: 'La règle d’or' },
      {
        type: 'p',
        texte:
          'Ne jamais nourrir au sirop pendant une miellée destinée à la récolte : le sucre se retrouverait dans le miel, ce qui constitue une fraude. Distribuez de préférence le soir, sans répandre de sirop, pour ne pas exciter le rucher ni déclencher de pillage.',
      },
      { type: 'h2', texte: 'Tracer ses apports' },
      {
        type: 'p',
        texte:
          "Noter chaque nourrissement (type, quantité, date) permet de suivre la préparation à l'hiver colonie par colonie. APIGO enregistre ces gestes en quelques secondes et garde l'historique au chaud.",
      },
    ],
  },
  {
    slug: 'recolter-le-miel',
    titre: 'Récolter le miel : quand et comment extraire',
    description:
      'Quand récolter le miel et comment l’extraire : maturité (opercules), désoperculation, extracteur, filtrage, mise en pot. Le guide de la récolte.',
    extrait:
      'Le miel se récolte quand il est mûr, pas selon le calendrier. Maturité, extraction, mise en pot : les étapes d’une bonne récolte.',
    date: '2026-06-08',
    lectureMin: 6,
    motsCles: [
      'récolter le miel',
      'récolte du miel',
      'extraction du miel',
      'désoperculer',
      'extracteur de miel',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          'On récolte le miel quand il est mûr, pas selon une date. Le repère fiable : des cadres operculés à au moins 75-80 %. Le miel operculé a une teneur en eau suffisamment basse pour ne pas fermenter.',
      },
      { type: 'h2', texte: 'Vérifier la maturité' },
      {
        type: 'p',
        texte:
          "À défaut d'opercules, un réfractomètre doit indiquer une humidité inférieure à 18 % (la réglementation tolère jusqu'à 20 %, mais en dessous de 18 % le miel se conserve mieux). Un miel récolté trop tôt risque de fermenter.",
      },
      { type: 'h2', texte: 'Extraire le miel' },
      {
        type: 'ul',
        items: [
          'Désoperculer les cadres au couteau ou à la herse, au-dessus d’un bac',
          'Placer les cadres dans un extracteur (centrifugeuse), en montant en vitesse progressivement',
          'Filtrer le miel à travers un tamis',
          'Laisser reposer en maturateur quelques jours, puis écumer',
          'Mettre en pot et étiqueter (numéro de lot, DDM)',
        ],
      },
      { type: 'h2', texte: 'Ne pas chauffer' },
      {
        type: 'p',
        texte:
          "Ne jamais chauffer le miel au-delà d'environ 40 °C : au-delà, on dégrade ses arômes et ses enzymes. Travaillez dans un local propre et fermé aux abeilles, et nettoyez le matériel à l'eau (le miel est hydrosoluble).",
      },
      { type: 'h2', texte: 'Suivre sa production' },
      {
        type: 'p',
        texte:
          "Enregistrer les quantités récoltées par ruche et par rucher permet de comparer ses performances d'une année sur l'autre et d'identifier ses meilleurs emplacements. C'est l'un des usages clés d'un logiciel apicole comme APIGO.",
      },
    ],
    etapes: [
      {
        nom: 'Vérifier la maturité du miel',
        texte:
          'Récoltez quand les cadres sont operculés à au moins 75-80 %, ou quand un réfractomètre indique une humidité inférieure à 18 %.',
      },
      {
        nom: 'Désoperculer les cadres',
        texte:
          'Retirez la fine couche de cire des alvéoles au couteau ou à la herse à désoperculer, au-dessus d’un bac.',
      },
      {
        nom: 'Extraire',
        texte:
          'Placez les cadres dans un extracteur et montez en vitesse progressivement pour ne pas casser les rayons.',
      },
      {
        nom: 'Filtrer et faire maturer',
        texte:
          'Filtrez le miel au tamis, laissez-le reposer quelques jours en maturateur, puis écumez la surface.',
      },
      {
        nom: 'Mettre en pot',
        texte:
          'Mettez le miel clair en pot et étiquetez (numéro de lot, DDM). Ne chauffez jamais au-delà de 40 °C.',
      },
    ],
  },
  {
    slug: 'frelon-asiatique-proteger-ses-ruches',
    titre: 'Frelon asiatique : protéger ses ruches',
    description:
      'Le frelon asiatique menace les ruches de la fin d’été à l’automne. Reconnaissance, moyens de lutte (muselières, harpes) et bonnes pratiques de protection.',
    extrait:
      'Prédateur redoutable, le frelon asiatique attaque les ruches en fin d’été. Comment reconnaître la menace et protéger ses colonies.',
    date: '2026-06-06',
    lectureMin: 5,
    motsCles: [
      'frelon asiatique',
      'frelon asiatique ruche',
      'piège frelon',
      'protéger ruches frelon',
      'vespa velutina',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Le frelon asiatique (Vespa velutina) est un prédateur redoutable de l'abeille : il chasse les ouvrières en vol stationnaire devant la ruche. La pression est maximale de la fin de l'été à l'automne, quand le nid grossit, et peut épuiser une colonie qui n'ose plus sortir.",
      },
      { type: 'h2', texte: 'Reconnaître le frelon asiatique' },
      {
        type: 'p',
        texte:
          "Plus sombre que le frelon européen, il a un thorax noir et des pattes jaunes à l'extrémité. On le repère surtout à son comportement caractéristique : un vol stationnaire face à l'entrée de la ruche, à l'affût des butineuses.",
      },
      { type: 'h2', texte: 'Les moyens de lutte' },
      {
        type: 'ul',
        items: [
          'Muselières / réducteurs d’entrée pour aider les gardiennes',
          'Harpes électriques sur les ruchers très exposés',
          'Destruction des nids par des professionnels (ne jamais s’en approcher soi-même)',
          'Pièges sélectifs pour limiter les dégâts sur les autres insectes',
        ],
      },
      { type: 'h2', texte: 'Renforcer ses colonies' },
      {
        type: 'p',
        texte:
          "Une colonie forte résiste mieux : entrée réduite, ruches surélevées, et population vigoureuse à l'entrée de l'automne. Surveiller la pression du frelon et noter les ruchers les plus touchés aide à prioriser ses interventions — ce que facilite un suivi centralisé comme APIGO.",
      },
    ],
  },
  {
    slug: 'pourquoi-le-miel-cristallise',
    titre: 'Pourquoi le miel cristallise (et comment le rendre liquide)',
    description:
      'Le miel qui cristallise n’est pas un défaut. Pourquoi certains miels durcissent vite, comment les reliquéfier sans les abîmer et obtenir un miel crémeux.',
    extrait:
      'Un miel qui durcit inquiète parfois les clients. Pourtant la cristallisation est naturelle : on vous explique tout.',
    date: '2026-06-04',
    lectureMin: 4,
    motsCles: [
      'miel cristallisé',
      'miel qui cristallise',
      'miel qui durcit',
      'rendre le miel liquide',
      'miel crémeux',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "La cristallisation est naturelle et n'est en rien un défaut : c'est le passage du glucose du miel à l'état solide. Un miel qui cristallise est même souvent le signe d'un miel pur et peu chauffé.",
      },
      { type: 'h2', texte: 'Pourquoi certains miels durcissent plus vite' },
      {
        type: 'p',
        texte:
          "Plus un miel est riche en glucose (colza, tournesol, pissenlit), plus il cristallise vite — parfois en quelques semaines. À l'inverse, les miels riches en fructose (acacia, châtaignier) restent liquides longtemps.",
      },
      { type: 'h2', texte: 'Le rendre à nouveau liquide' },
      {
        type: 'p',
        texte:
          'Un miel cristallisé se reliquéfie en le chauffant doucement au bain-marie, sans dépasser 40 °C, pour préserver ses arômes et ses enzymes. On évite absolument le micro-ondes, qui surchauffe et dégrade le miel.',
      },
      { type: 'h2', texte: 'Obtenir un miel crémeux' },
      {
        type: 'p',
        texte:
          "Pour un miel crémeux et homogène, on pratique l'ensemencement : on ajoute un peu de miel finement cristallisé à un miel liquide, puis on brasse régulièrement. La cristallisation se fait alors en cristaux fins, agréables en bouche.",
      },
    ],
  },
  {
    slug: 'calendrier-apicole',
    titre: 'Le calendrier apicole : que faire mois par mois',
    description:
      'Le calendrier apicole saison par saison : hiver, printemps, été, automne. Visite de printemps, hausses, récolte, traitement varroa, hivernage.',
    extrait:
      'Visite de printemps, pose des hausses, récolte, traitement varroa, hivernage : les grands rendez-vous de l’année apicole.',
    date: '2026-06-02',
    lectureMin: 6,
    motsCles: [
      'calendrier apicole',
      'travaux apicoles',
      'année apicole',
      'que faire ce mois apiculture',
      'planning apiculture',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "L'année apicole suit un rythme régulier, à adapter à votre région et à l'altitude. En connaître les grandes étapes permet d'anticiper plutôt que de subir.",
      },
      { type: 'h2', texte: 'Hiver (décembre – février)' },
      {
        type: 'p',
        texte:
          "Repos des colonies, surveillance à distance, traitement varroa hors couvain (acide oxalique), préparation et réparation du matériel. On n'ouvre pas les ruches par grand froid.",
      },
      { type: 'h2', texte: 'Printemps (mars – mai)' },
      {
        type: 'p',
        texte:
          "Visite de printemps, nettoyage des plateaux, stimulation éventuelle, surveillance de l'essaimage, pose des hausses, premières miellées (colza, fruitiers, acacia). C'est la période la plus active.",
      },
      { type: 'h2', texte: 'Été (juin – août)' },
      {
        type: 'p',
        texte:
          "Récoltes, gestion des hausses, miellées d'été (tilleul, châtaignier, tournesol, montagne). La pression du frelon asiatique commence à monter en fin de saison.",
      },
      { type: 'h2', texte: 'Automne (septembre – novembre)' },
      {
        type: 'p',
        texte:
          "Dernière récolte, traitement varroa après récolte, complément de réserves, réduction des entrées, et déclaration annuelle des ruches. On prépare l'hivernage.",
      },
      { type: 'h2', texte: 'Ne rien oublier' },
      {
        type: 'p',
        texte:
          "Un calendrier et des alertes adaptés à vos colonies rythment ces travaux. APIGO génère des rappels (visites, météo favorable, traitements) pour rester au bon tempo toute l'année.",
      },
    ],
  },
  {
    slug: 'vendre-son-miel',
    titre: 'Vendre son miel : réglementation, étiquetage et traçabilité',
    description:
      'Vendre son miel en règle : étiquetage obligatoire (origine, poids, lot, DDM), traçabilité des lots et conseils. Le point sur la commercialisation du miel.',
    extrait:
      'Étiquetage, numéro de lot, DDM, traçabilité : les règles à connaître pour vendre son miel sereinement et en toute conformité.',
    date: '2026-05-30',
    lectureMin: 5,
    motsCles: [
      'vendre son miel',
      'étiquetage miel',
      'réglementation vente miel',
      'traçabilité miel',
      'commercialiser son miel',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Vendre son miel, même à petite échelle, suppose de respecter quelques règles d'étiquetage et de traçabilité. Rien d'insurmontable, mais mieux vaut s'y prendre proprement dès le départ.",
      },
      { type: 'h2', texte: 'Les mentions d’étiquetage' },
      {
        type: 'ul',
        items: [
          'La dénomination « miel »',
          'L’origine (France, ou mélange de miels…)',
          'Le nom et l’adresse du producteur',
          'Le poids net',
          'Le numéro de lot (traçabilité)',
          'La DDM (« à consommer de préférence avant »)',
        ],
      },
      { type: 'h2', texte: 'Pourquoi pas de DLC ?' },
      {
        type: 'p',
        texte:
          'Le miel ne porte pas de date limite de consommation (DLC) car il se conserve très longtemps. On y appose une DDM : passé cette date, le miel reste consommable, son goût évolue simplement.',
      },
      { type: 'h2', texte: 'La traçabilité des lots' },
      {
        type: 'p',
        texte:
          "Pouvoir relier chaque pot vendu à sa récolte (le lot) relève de la réglementation européenne sur la sécurité alimentaire. C'est aussi un gage de sérieux vis-à-vis de vos clients.",
      },
      { type: 'h2', texte: 'Gérer ses ventes simplement' },
      {
        type: 'p',
        texte:
          "Selon votre statut et votre chiffre d'affaires, des règles fiscales s'appliquent : renseignez-vous auprès de votre centre de gestion. Côté outils, APIGO gère les ventes, les clients, les bons de livraison, la traçabilité des lots et la facturation conforme, en un seul endroit.",
      },
    ],
  },
  {
    slug: 'choisir-sa-ruche',
    titre: 'Dadant, Langstroth, Warré : quelle ruche choisir ?',
    description:
      'Quelle ruche choisir pour débuter ou s’agrandir ? Comparaison des modèles Dadant, Langstroth et Warré et conseils pour bien s’équiper.',
    extrait:
      'Dadant, Langstroth, Warré : chaque modèle a sa logique. Comment choisir la ruche adaptée à vos objectifs et à votre région.',
    date: '2026-05-28',
    lectureMin: 5,
    motsCles: [
      'quelle ruche choisir',
      'types de ruches',
      'ruche dadant',
      'ruche langstroth',
      'ruche warré',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Le choix du modèle de ruche engage tout le matériel de votre exploitation pour des années. Mieux vaut s'aligner sur ce qui est répandu autour de vous, pour faciliter les échanges de cadres et l'achat d'essaims.",
      },
      { type: 'h2', texte: 'La Dadant' },
      {
        type: 'p',
        texte:
          "La plus courante en France. Corps de 10 cadres et hausses moins hautes. Polyvalente, bien adaptée à la production de miel : c'est la référence pour débuter dans la plupart des régions.",
      },
      { type: 'h2', texte: 'La Langstroth' },
      {
        type: 'p',
        texte:
          'Très répandue dans le monde, avec corps et hausses de même dimension (cadres interchangeables). Appréciée des professionnels et pour la transhumance grâce à sa modularité.',
      },
      { type: 'h2', texte: 'La Warré' },
      {
        type: 'p',
        texte:
          'Ruche « écologique » à conduite verticale, agrandie par le bas, souvent sans cadres. Conduite plus naturelle, mais récolte et visites différentes — un choix de niche, plutôt pour le loisir.',
      },
      { type: 'h2', texte: 'Notre conseil' },
      {
        type: 'p',
        texte:
          "Pour débuter en France, la Dadant 10 cadres est le choix le plus simple et le plus polyvalent. Quel que soit le modèle, l'essentiel est d'avoir du matériel cohérent et un bon suivi de vos colonies.",
      },
    ],
  },
  {
    slug: 'combien-de-temps-vit-une-abeille',
    titre: 'Combien de temps vit une abeille ?',
    description:
      "Combien de temps vit une abeille ? La durée de vie d'une ouvrière, d'une reine et d'un faux-bourdon varie fortement selon la saison et le rôle. Explications.",
    extrait:
      "Quelques semaines pour une ouvrière d'été, plusieurs années pour une reine : la durée de vie d'une abeille dépend de son rôle et de la saison.",
    date: '2026-05-26',
    lectureMin: 4,
    motsCles: [
      'combien de temps vit une abeille',
      'durée de vie abeille',
      'durée de vie ouvrière',
      'durée de vie reine abeille',
      'espérance de vie abeille',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "La durée de vie d'une abeille n'a rien d'uniforme : elle dépend de sa caste (ouvrière, reine ou faux-bourdon) et, pour les ouvrières, de la saison de naissance.",
      },
      { type: 'h2', texte: "L'ouvrière : de quelques semaines à plusieurs mois" },
      {
        type: 'p',
        texte:
          "Une ouvrière née au printemps ou en été vit environ 5 à 6 semaines : son corps s'use vite, surtout lorsqu'elle devient butineuse. À l'inverse, les ouvrières nées à l'automne, dites « abeilles d'hiver », vivent 5 à 6 mois : elles assurent la survie de la colonie jusqu'au printemps.",
      },
      { type: 'h2', texte: 'La reine : 3 à 5 ans' },
      {
        type: 'p',
        texte:
          "La reine est de loin la plus longévive : elle peut vivre 3 à 5 ans. Sa ponte décline toutefois avec l'âge, ce qui pousse souvent les apiculteurs à la remplacer au bout d'un à deux ans pour maintenir des colonies vigoureuses.",
      },
      { type: 'h2', texte: 'Le faux-bourdon : une vie courte' },
      {
        type: 'p',
        texte:
          "Le faux-bourdon (le mâle) ne vit que le temps d'une saison : il est chassé de la ruche à l'automne, lorsque la colonie cesse de le nourrir. Sa seule fonction est de féconder une reine vierge en vol.",
      },
    ],
  },
  {
    slug: 'combien-d-abeilles-dans-une-ruche',
    titre: "Combien d'abeilles compte une ruche ?",
    description:
      "Combien d'abeilles dans une ruche ? De 20 000 en hiver à 60 000 au pic de l'été : le nombre d'abeilles d'une colonie varie au fil des saisons. Explications.",
    extrait:
      "Une colonie compte de 20 000 abeilles en hiver à 50 000-60 000 au cœur de l'été. Pourquoi un tel écart ?",
    date: '2026-05-24',
    lectureMin: 3,
    motsCles: [
      "combien d'abeilles dans une ruche",
      "nombre d'abeilles ruche",
      'population colonie abeilles',
      'combien abeilles colonie',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Le nombre d'abeilles d'une colonie n'est jamais figé : il suit le rythme des saisons et la dynamique de ponte de la reine.",
      },
      { type: 'h2', texte: 'De 20 000 à 60 000 abeilles' },
      {
        type: 'p',
        texte:
          "Au pic de l'activité, en été, une colonie forte peut compter 50 000 à 60 000 ouvrières, accompagnées d'une reine et de quelques centaines à milliers de faux-bourdons. En hiver, la population se réduit à environ 20 000 abeilles, regroupées en grappe pour se réchauffer.",
      },
      { type: 'h2', texte: 'Pourquoi un tel écart ?' },
      {
        type: 'p',
        texte:
          "Au printemps, la reine pond jusqu'à 1 500 à 2 000 œufs par jour : la population explose pour profiter des miellées. À l'automne, la ponte ralentit et seules les robustes « abeilles d'hiver » subsistent, juste assez nombreuses pour maintenir la chaleur et passer la mauvaise saison.",
      },
      { type: 'h2', texte: 'Une seule reine par colonie' },
      {
        type: 'p',
        texte:
          "Quelle que soit la population, une colonie ne compte normalement qu'une seule reine pondeuse. C'est elle qui assure, à elle seule, le renouvellement permanent de dizaines de milliers d'ouvrières.",
      },
    ],
  },
  {
    slug: 'comment-les-abeilles-font-le-miel',
    titre: 'Comment les abeilles fabriquent le miel',
    description:
      'Comment les abeilles font-elles le miel ? Du nectar des fleurs au miel operculé : récolte, transformation enzymatique, déshydratation et stockage. Explications simples.',
    extrait:
      'Le miel naît du nectar des fleurs, transformé et déshydraté par les abeilles. Voici, étape par étape, comment elles le fabriquent.',
    date: '2026-05-22',
    lectureMin: 4,
    motsCles: [
      'comment les abeilles font le miel',
      'fabrication du miel',
      'comment est fait le miel',
      'du nectar au miel',
      'production du miel',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Le miel est le fruit d'un travail collectif remarquable : les abeilles transforment le nectar des fleurs en une réserve de sucre stable, capable de nourrir la colonie pendant des mois.",
      },
      { type: 'h2', texte: '1. La récolte du nectar' },
      {
        type: 'p',
        texte:
          "Les butineuses aspirent le nectar des fleurs avec leur langue et le stockent dans leur jabot (un estomac dédié). De retour à la ruche, elles le transmettent, bouche à bouche, aux abeilles d'intérieur.",
      },
      { type: 'h2', texte: '2. La transformation' },
      {
        type: 'p',
        texte:
          "Au passage, des enzymes (notamment l'invertase) transforment les sucres complexes du nectar en sucres simples. Le nectar est régurgité et repris plusieurs fois, ce qui poursuit cette maturation.",
      },
      { type: 'h2', texte: '3. La déshydratation' },
      {
        type: 'p',
        texte:
          "Le nectar contient beaucoup d'eau. Les abeilles l'évaporent en ventilant avec leurs ailes et en l'étalant dans les alvéoles, jusqu'à ce que sa teneur en eau descende sous 18-20 %. À ce stade, il ne fermentera plus : c'est devenu du miel.",
      },
      { type: 'h2', texte: '4. Le stockage et l’operculation' },
      {
        type: 'p',
        texte:
          "Le miel mûr est stocké dans les alvéoles, que les abeilles ferment d'un fin opercule de cire. C'est ce miel operculé que l'apiculteur récolte, signe qu'il est arrivé à maturité.",
      },
    ],
  },
  {
    slug: 'role-des-abeilles-pollinisation',
    titre: 'Le rôle essentiel des abeilles dans la nature',
    description:
      "Quel est le rôle des abeilles ? Bien au-delà du miel, elles assurent la pollinisation d'une grande partie des cultures et des plantes sauvages. Pourquoi elles sont essentielles.",
    extrait:
      'Au-delà du miel, les abeilles rendent un service écologique majeur : la pollinisation, dont dépend une grande part de notre alimentation.',
    date: '2026-05-20',
    lectureMin: 4,
    motsCles: [
      'rôle des abeilles',
      'importance des abeilles',
      'pollinisation abeilles',
      'à quoi servent les abeilles',
      'abeilles environnement',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Quand on pense aux abeilles, on pense au miel. Pourtant, leur rôle le plus important pour la nature et pour l'humain se joue ailleurs : dans la pollinisation.",
      },
      { type: 'h2', texte: 'La pollinisation, un service vital' },
      {
        type: 'p',
        texte:
          "En butinant de fleur en fleur, l'abeille transporte le pollen et assure la fécondation des plantes. Une grande partie des cultures (fruits, légumes, oléagineux) et d'innombrables plantes sauvages dépendent, en tout ou partie, des insectes pollinisateurs.",
      },
      { type: 'h2', texte: 'Un maillon de la biodiversité' },
      {
        type: 'p',
        texte:
          "En pollinisant les plantes sauvages, les abeilles (domestiques comme sauvages) soutiennent des écosystèmes entiers : les plantes nourrissent et abritent quantité d'autres espèces. Leur déclin fragilise donc bien plus que la production de miel.",
      },
      { type: 'h2', texte: 'Comment les protéger' },
      {
        type: 'ul',
        items: [
          'Limiter les pesticides, surtout en période de floraison',
          'Préserver et semer des plantes mellifères',
          'Maintenir des points d’eau et des haies',
          'Soutenir l’apiculture locale et les pollinisateurs sauvages',
        ],
      },
    ],
  },
  {
    slug: 'difference-abeille-guepe-frelon',
    titre: 'Abeille, guêpe, frelon : comment les différencier',
    description:
      'Comment différencier une abeille, une guêpe et un frelon ? Apparence, comportement, alimentation et piqûre : les repères simples pour ne plus les confondre.',
    extrait:
      "Velue et pacifique pour l'abeille, fine et carnivore pour la guêpe : voici comment reconnaître abeille, guêpe et frelon.",
    date: '2026-05-18',
    lectureMin: 4,
    motsCles: [
      'différence abeille guêpe',
      'abeille ou guêpe',
      'reconnaître abeille guêpe frelon',
      'différence abeille frelon',
      'abeille guêpe frelon',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          'On les confond souvent, pourtant abeilles, guêpes et frelons se distinguent assez facilement par leur apparence et leur comportement.',
      },
      { type: 'h2', texte: "L'abeille" },
      {
        type: 'p',
        texte:
          "L'abeille domestique est trapue et velue, de couleur brun-roux à noire. Elle se nourrit de nectar et de pollen, et n'est pas agressive loin de sa ruche. Elle ne pique qu'en dernier recours : son dard reste planté, ce qui lui est fatal.",
      },
      { type: 'h2', texte: 'La guêpe' },
      {
        type: 'p',
        texte:
          "La guêpe est plus fine, glabre (sans poils) et d'un jaune vif rayé de noir, avec une taille très marquée. Carnivore et attirée par les aliments sucrés et la viande, elle peut piquer plusieurs fois sans en mourir.",
      },
      { type: 'h2', texte: 'Le frelon' },
      {
        type: 'p',
        texte:
          "Le frelon est nettement plus gros. Le frelon européen est brun et jaune ; le frelon asiatique, plus sombre, a un thorax noir et des pattes jaunes à l'extrémité. Ce dernier est un prédateur des abeilles, qu'il chasse devant les ruches en fin d'été.",
      },
      { type: 'h2', texte: 'En cas de doute' },
      {
        type: 'p',
        texte:
          'Un insecte velu qui butine paisiblement une fleur est presque toujours une abeille — à protéger. Une présence répétée de frelons asiatiques près de ruches doit, elle, alerter les apiculteurs.',
      },
    ],
  },
  {
    slug: 'pourquoi-les-abeilles-disparaissent',
    titre: 'Pourquoi les abeilles disparaissent ?',
    description:
      'Pourquoi les abeilles disparaissent-elles ? Varroa, pesticides, frelon asiatique, manque de ressources, climat : les causes du déclin des abeilles expliquées.',
    extrait:
      "Le déclin des abeilles n'a pas une cause unique mais une combinaison de facteurs. Tour d'horizon des principales menaces.",
    date: '2026-05-16',
    lectureMin: 5,
    motsCles: [
      'pourquoi les abeilles disparaissent',
      'déclin des abeilles',
      'mortalité des abeilles',
      'disparition des abeilles',
      'menaces abeilles',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "La disparition des abeilles inquiète à juste titre. Elle ne s'explique pas par une cause unique, mais par l'accumulation de plusieurs facteurs qui affaiblissent les colonies.",
      },
      { type: 'h2', texte: 'Le varroa et les maladies' },
      {
        type: 'p',
        texte:
          "L'acarien Varroa destructor est l'ennemi numéro un : il affaiblit les abeilles et transmet des virus. Non maîtrisé, il provoque l'effondrement des colonies. D'autres maladies (loques, nosémose) pèsent également.",
      },
      { type: 'h2', texte: 'Les pesticides' },
      {
        type: 'p',
        texte:
          'Certains traitements phytosanitaires sont toxiques pour les abeilles, surtout appliqués sur des cultures en fleurs. Ils peuvent provoquer des mortalités brutales ou, à faible dose, désorienter les butineuses.',
      },
      { type: 'h2', texte: 'Le frelon asiatique' },
      {
        type: 'p',
        texte:
          "Prédateur introduit, le frelon asiatique chasse les ouvrières devant les ruches, surtout en fin d'été, et peut épuiser des colonies entières.",
      },
      { type: 'h2', texte: 'Le manque de ressources et le climat' },
      {
        type: 'p',
        texte:
          'La raréfaction des fleurs (monocultures, artificialisation) prive les abeilles de nourriture variée. Les aléas climatiques perturbent par ailleurs les floraisons et les saisons. Tous ces facteurs, combinés, fragilisent les colonies.',
      },
    ],
  },
  {
    slug: 'installer-une-ruche-dans-son-jardin',
    titre: 'Installer une ruche dans son jardin : ce qu’il faut savoir',
    description:
      'Installer une ruche dans son jardin : emplacement, distances réglementaires, voisinage et premiers pas. Le guide pour accueillir des abeilles chez soi.',
    extrait:
      "Avoir une ruche au jardin est accessible, à condition de respecter quelques règles d'emplacement et de réglementation. Le point.",
    date: '2026-05-14',
    lectureMin: 5,
    motsCles: [
      'installer une ruche dans son jardin',
      'ruche dans son jardin',
      'ruche jardin réglementation',
      'avoir des abeilles chez soi',
      'ruche maison',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          'Accueillir une ruche dans son jardin est tout à fait possible, même sur une petite surface. Encore faut-il bien choisir son emplacement et respecter la réglementation, pour le bien des abeilles comme du voisinage.',
      },
      { type: 'h2', texte: 'Bien choisir l’emplacement' },
      {
        type: 'ul',
        items: [
          'Entrée orientée plutôt sud/sud-est, à l’abri du vent dominant',
          'Un point d’eau à proximité',
          'À l’écart des passages, ruche légèrement surélevée',
          'Un environnement fleuri (ressources mellifères)',
        ],
      },
      { type: 'h2', texte: 'Respecter les distances' },
      {
        type: 'p',
        texte:
          "Les distances minimales par rapport aux voisins et à la voie publique sont fixées par arrêté préfectoral et varient selon les départements. Une haie ou un mur d'au moins 2 m de haut, qui oblige les abeilles à prendre de la hauteur, dispense souvent de ces distances. Vérifiez toujours l'arrêté de votre département.",
      },
      { type: 'h2', texte: 'Déclarer ses ruches' },
      {
        type: 'p',
        texte:
          "Même pour une seule ruche de loisir, la déclaration annuelle est obligatoire. Elle est simple et gratuite, et vous donne un numéro d'apiculteur.",
      },
      { type: 'h2', texte: 'Se former d’abord' },
      {
        type: 'p',
        texte:
          'Avant de vous lancer, suivez une formation ou rejoignez un rucher-école : manipuler une colonie avec un mentor change tout. Et pour tenir le suivi de vos visites et votre registre, une application comme APIGO simplifie la vie dès la première ruche.',
      },
    ],
  },
  {
    slug: 'apiculture-urbaine',
    titre: 'L’apiculture urbaine : des ruches en ville',
    description:
      "L'apiculture urbaine séduit de plus en plus : ruches sur les toits, en ville, et bonne production de miel. Atouts, limites et points de vigilance.",
    extrait:
      "Des ruches sur les toits des villes ? L'apiculture urbaine fonctionne étonnamment bien. Atouts, limites et précautions.",
    date: '2026-05-12',
    lectureMin: 4,
    motsCles: [
      'apiculture urbaine',
      'ruche en ville',
      'ruche sur toit',
      'abeilles en ville',
      'apiculture en ville',
    ],
    contenu: [
      {
        type: 'p',
        texte:
          "Installer des ruches en ville peut sembler paradoxal, et pourtant l'apiculture urbaine se développe rapidement — sur des toits, des balcons ou dans des jardins partagés.",
      },
      { type: 'h2', texte: 'Pourquoi ça marche en ville' },
      {
        type: 'p',
        texte:
          "Les villes offrent une grande diversité de fleurs (parcs, jardins, balcons, arbres d'alignement) qui s'étale sur une longue période, et souvent moins de pesticides que certaines zones agricoles intensives. Les colonies urbaines y sont fréquemment productives.",
      },
      { type: 'h2', texte: 'Les points de vigilance' },
      {
        type: 'ul',
        items: [
          'Respecter la réglementation et le voisinage (distances, obstacle qui fait monter les abeilles)',
          'Assurer un point d’eau, indispensable en ville',
          'Éviter la surdensité de ruches, qui concurrence les pollinisateurs sauvages',
          'Sécuriser l’accès au toit ou à l’emplacement',
        ],
      },
      { type: 'h2', texte: 'Un bon moyen de sensibiliser' },
      {
        type: 'p',
        texte:
          "Au-delà du miel, les ruches urbaines sensibilisent le public à l'importance des pollinisateurs. Comme à la campagne, elles demandent un vrai suivi : visites régulières, surveillance sanitaire et tenue du registre.",
      },
    ],
  },
];

/** Retrouve un article par son slug. */
export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
