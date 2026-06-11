/**
 * Base de connaissances apicole du Copilote — réponses pré-rédigées.
 *
 * 100 % statique et embarqué : aucune recherche web, aucun appel externe,
 * aucun coût. Sert à répondre aux questions « culturelles » que se pose un
 * apiculteur, en plus des actions sur ses données. Recherche par score de
 * mots-clés normalisés (cf. copilote-local.ts).
 *
 * Ton : pédagogique, concret, prudent sur le sanitaire et le réglementaire.
 * Pour étoffer la couverture : ajouter une entrée ici, rien d'autre à toucher.
 */

export interface ArticleSavoir {
  id: string;
  theme: 'biologie' | 'pratique' | 'sante' | 'reglementation' | 'produits' | 'saison';
  titre: string;
  /** Mots-clés déclencheurs (sans accents, minuscules) — pondèrent le match */
  motsCles: string[];
  contenu: string;
  /** Questions liées proposées à l'utilisateur après la réponse */
  voirAussi?: string[];
}

export const SAVOIR: ArticleSavoir[] = [
  // ─── Biologie ──────────────────────────────────────────────────────────────
  {
    id: 'reine-role',
    theme: 'biologie',
    titre: 'Le rôle de la reine',
    motsCles: ['reine', 'role reine', 'a quoi sert la reine', 'ponte', 'pondre', 'mere'],
    contenu:
      "**La reine est l'unique femelle féconde de la colonie.** Son rôle principal est la ponte : jusqu'à **1 500 à 2 000 œufs par jour** au pic de saison, soit plus que son propre poids. Elle assure le renouvellement permanent des abeilles.\n\nElle régule aussi la cohésion de la colonie par ses **phéromones** : tant qu'elles circulent, les ouvrières savent que la colonie est « queen-right » (avec reine). Si la reine disparaît, l'absence de phéromone déclenche en quelques heures l'élevage de cellules royales de sauveté.\n\nUne reine vit **3 à 5 ans**, mais sa ponte décline ; en exploitation, beaucoup d'apiculteurs la remplacent au bout de **1 à 2 ans** pour maintenir des colonies vigoureuses.",
    voirAussi: ['Comment reconnaître une colonie orpheline ?', "Qu'est-ce que l'essaimage ?"],
  },
  {
    id: 'colonie-orpheline',
    theme: 'biologie',
    titre: 'Reconnaître une colonie orpheline',
    motsCles: [
      'orpheline',
      'orphelinage',
      'colonie sans reine',
      'perte de reine',
      'plus de reine',
      'reconnaitre orpheline',
      'bourdonneuse',
      'ponteuses',
      'absence de ponte',
    ],
    contenu:
      "Une colonie **orpheline** a perdu sa reine et ne parvient pas (encore) à la remplacer. Signes qui doivent alerter :\n\n- **Plus d'œufs ni de jeune couvain** alors qu'il devrait y en avoir (en saison) — le signe le plus fiable.\n- **Cellules royales de sauveté** au milieu des cadres (sur du couvain) : la colonie tente de se refaire une reine.\n- **Comportement** : colonie agitée, bruyante (« chant » plaintif), baisse de population au fil des semaines.\n- À un stade avancé : **ouvrières pondeuses** — du couvain de mâles bombé dispersé, plusieurs œufs par cellule posés sur les parois. La colonie est alors dite **bourdonneuse** et difficile à sauver.\n\nQue faire : si la colonie élève déjà des cellules royales et qu'il y a encore du couvain, on peut **laisser faire** (≈ 1 mois jusqu'à la ponte de la nouvelle reine). Sinon, **introduire une reine fécondée** ou **réunir** la colonie à une colonie avec reine (méthode du journal). Pour une bourdonneuse, la réunion est souvent la seule issue raisonnable.",
    voirAussi: ['Le rôle de la reine', "Qu'est-ce que l'essaimage ?"],
  },
  {
    id: 'ouvrieres-faux-bourdons',
    theme: 'biologie',
    titre: 'Ouvrières et faux-bourdons',
    motsCles: [
      'ouvriere',
      'ouvrieres',
      'faux bourdon',
      'faux-bourdon',
      'male',
      'males',
      'castes',
      'metiers abeille',
    ],
    contenu:
      "Une colonie compte trois castes :\n\n- **Les ouvrières** (femelles stériles, 20 000 à 60 000 selon la saison) font tout : nettoyage, nourrissage du couvain, production de cire, garde, puis butinage en fin de vie. Une ouvrière d'été vit **environ 5 à 6 semaines** ; celles d'automne (« abeilles d'hiver ») vivent **5 à 6 mois** pour passer l'hiver.\n- **Les faux-bourdons** (mâles) n'ont qu'une fonction : féconder une reine vierge en vol. Ils ne piquent pas, ne butinent pas. Ils sont chassés de la ruche à l'automne.\n- **La reine** : voir la question dédiée.",
    voirAussi: ['Le rôle de la reine', 'Comment naît une abeille ?'],
  },
  {
    id: 'cycle-developpement',
    theme: 'biologie',
    titre: 'Le cycle de développement',
    motsCles: [
      'cycle',
      'developpement',
      'oeuf',
      'larve',
      'nymphe',
      'naissance abeille',
      'comment nait',
      'combien de jours',
      'naitre',
      'nait',
      'couvain',
    ],
    contenu:
      "Du œuf à l'adulte, le développement passe par œuf → larve → nymphe operculée → adulte. Les durées diffèrent selon la caste :\n\n- **Reine : 16 jours**\n- **Ouvrière : 21 jours**\n- **Faux-bourdon : 24 jours**\n\nRepère pratique : du couvain operculé bien compact et régulier est un signe de **bonne reine**. Un couvain « en mosaïque » (trous, irrégulier) peut signaler une reine vieillissante, un problème sanitaire ou une consanguinité.",
    voirAussi: ['Le rôle de la reine', 'Comment lire un cadre de couvain ?'],
  },
  {
    id: 'essaimage',
    theme: 'biologie',
    titre: "L'essaimage",
    motsCles: [
      'essaimage',
      'essaim',
      'essaimer',
      'cellules royales',
      'partir essaim',
      'reproduction colonie',
    ],
    contenu:
      "**L'essaimage est le mode de reproduction naturel de la colonie** : au printemps, une colonie forte élève des cellules royales puis l'ancienne reine part avec environ la moitié des abeilles pour fonder une nouvelle colonie ailleurs.\n\nC'est naturel mais coûteux pour l'apiculteur : perte d'abeilles, donc de récolte. Signes annonciateurs : **cellules royales** sur les cadres (surtout en bordure basse), colonie très populeuse, ralentissement de ponte.\n\nMoyens de limiter l'essaimage : donner de la place (hausses), renouveler les reines, retirer des cadres de couvain pour faire des essaims artificiels, et surveiller dès les premières chaleurs (avril-mai dans la plupart des régions).",
    voirAussi: ['Quand poser les hausses ?', "Qu'est-ce qu'un essaim artificiel ?"],
  },
  {
    id: 'gelee-royale-bio',
    theme: 'biologie',
    titre: 'La gelée royale',
    motsCles: ['gelee royale', 'gelee', 'nourriture larve', 'nourrice'],
    contenu:
      "La **gelée royale** est une sécrétion des glandes hypopharyngiennes des jeunes ouvrières (les nourrices). Toutes les larves en reçoivent les 3 premiers jours ; **seule la future reine en est nourrie en exclusivité toute sa vie larvaire**, ce qui détermine qu'elle devienne reine plutôt qu'ouvrière. C'est un cas remarquable où l'alimentation, et non la génétique, décide de la caste.\n\nSa production à but commercial est très technique (greffage, récolte tous les 3 jours) et reste une activité de niche.",
    voirAussi: ['Le rôle de la reine', 'Quels sont les produits de la ruche ?'],
  },

  // ─── Pratiques ───────────────────────────────────────────────────────────
  {
    id: 'quand-recolter',
    theme: 'pratique',
    titre: 'Quand récolter le miel',
    motsCles: [
      'quand recolter',
      'recolte miel',
      'recolter',
      'extraction',
      'miel mur',
      'operculé',
      'refractometre',
    ],
    contenu:
      "On récolte quand **le miel est mûr**, pas selon le calendrier. Le repère fiable : les cadres sont **operculés à au moins 75-80 %** (les alvéoles sont fermées par une fine pellicule de cire). Le miel operculé a une teneur en eau suffisamment basse pour ne pas fermenter.\n\nÀ défaut d'opercules, un **réfractomètre** doit indiquer une humidité **inférieure à 18 %** (la réglementation tolère jusqu'à 20 %, mais en dessous de 18 % le miel se conserve mieux).\n\nSelon les régions et les miellées, les récoltes s'étalent de la fin du printemps (acacia, colza) à la fin de l'été (tournesol, châtaignier, montagne).",
    voirAussi: ['Calendrier apicole de la saison', 'Comment éviter que le miel cristallise ?'],
  },
  {
    id: 'traitement-varroa',
    theme: 'pratique',
    titre: 'Traiter contre le varroa',
    motsCles: [
      'traiter varroa',
      'traitement varroa',
      'lutte varroa',
      'traiter contre',
      'acide oxalique',
      'amitraze',
      'lanieres',
      'quand traiter',
    ],
    contenu:
      "**Le varroa est l'ennemi n°1 de l'abeille.** Sans traitement, une colonie meurt généralement en 1 à 3 ans. La stratégie classique :\n\n- **Traitement principal après la dernière récolte** (fin d'été / début d'automne), pour protéger les abeilles d'hiver. Produits avec AMM : lanières (amitraze, fluvalinate), ou acide formique selon conditions.\n- **Traitement de complément en hiver** hors couvain (souvent à l'**acide oxalique** par dégouttement ou sublimation), quand il n'y a quasi plus de couvain operculé — c'est là qu'il est le plus efficace.\n\n⚠️ **N'utilisez que des produits autorisés (AMM), respectez les doses, et notez chaque traitement dans votre registre.** APIGO vous permet d'enregistrer ces traitements et de garder une traçabilité. En cas de doute, demandez conseil à votre groupement sanitaire ou vétérinaire.",
    voirAussi: ['Comment compter les varroas ?', "Tenir son registre d'élevage"],
  },
  {
    id: 'nourrissement',
    theme: 'pratique',
    titre: 'Le nourrissement',
    motsCles: [
      'nourrir',
      'nourrissement',
      'sirop',
      'candi',
      'nourrir abeilles',
      'reserves insuffisantes',
      'sucre',
    ],
    contenu:
      "On nourrit pour deux raisons :\n\n- **Nourrissement de stimulation** (sirop léger 50/50, au printemps) : relance la ponte avant une miellée. À manier avec prudence — inutile si la nature fournit déjà.\n- **Nourrissement de complément** (sirop lourd type 60/40 à l'automne, ou **candi** en hiver) : complète les réserves quand elles sont insuffisantes pour passer l'hiver. Une colonie a besoin d'environ **12 à 18 kg de réserves** selon la région.\n\nRègle d'or : **ne jamais nourrir au sirop pendant une miellée destinée à la récolte** — le sucre se retrouverait dans le miel, ce qui est une fraude.",
    voirAussi: ['Préparer ses colonies pour l’hiver', 'Quand récolter le miel'],
  },
  {
    id: 'hivernage',
    theme: 'pratique',
    titre: "Préparer l'hivernage",
    motsCles: [
      'hiver',
      'hivernage',
      'preparer hiver',
      'hiverner',
      'passer hiver',
      'reserves hiver',
      'grappe',
    ],
    contenu:
      "Une bonne préparation à l'hiver se joue dès la fin de l'été. Les piliers :\n\n1. **Colonie populeuse et jeune** : beaucoup d'abeilles d'hiver, donc une ponte automnale soutenue par une bonne reine.\n2. **Varroa maîtrisé** : un traitement post-récolte efficace est non négociable (le varroa affaiblit les abeilles d'hiver).\n3. **Réserves suffisantes** : 12-18 kg selon la région ; compléter au sirop lourd si besoin avant les froids.\n4. **Ruche saine et abritée** : réduire l'entrée (contre les souris), vérifier l'étanchéité du toit, bonne ventilation pour évacuer l'humidité.\n\nEn hiver, les abeilles forment une **grappe** qui se réchauffe en consommant le miel. On évite d'ouvrir les ruches par grand froid.",
    voirAussi: ['Le nourrissement', 'Traiter contre le varroa'],
  },
  {
    id: 'visite-printemps',
    theme: 'pratique',
    titre: 'La visite de printemps',
    motsCles: [
      'visite printemps',
      'sortie hiver',
      'premiere visite',
      'reprise',
      'visite sanitaire printemps',
    ],
    contenu:
      "La **visite de printemps** est la plus importante de l'année : elle fait le bilan de sortie d'hiver. À vérifier, par une journée douce (idéalement >14-15 °C, peu de vent) :\n\n- **Présence de la reine et de ponte** (œufs, couvain de tous âges) — sinon la colonie est peut-être orpheline.\n- **Niveau des réserves** : compléter si la colonie est légère.\n- **Force de la colonie** : nombre de cadres couverts d'abeilles.\n- **État sanitaire** : aspect du couvain, présence de varroa, propreté.\n\nC'est le moment de nettoyer les plateaux, remplacer les vieux cadres et planifier la saison. APIGO calcule un **score de santé** par ruche à partir de ces observations.",
    voirAussi: ['Comment lire un cadre de couvain ?', 'Calendrier apicole de la saison'],
  },
  {
    id: 'poser-hausses',
    theme: 'pratique',
    titre: 'Quand poser les hausses',
    motsCles: ['hausse', 'hausses', 'poser hausse', 'quand hausse', 'grille a reine', 'miellee'],
    contenu:
      "On pose une **hausse** quand le corps de ruche est bien occupé (environ 7-8 cadres couverts d'abeilles) et qu'une miellée arrive. Poser trop tôt refroidit la colonie ; trop tard, on risque l'essaimage ou on perd de la récolte.\n\nUne **grille à reine** entre le corps et la hausse empêche la reine de pondre dans le miel. On ajoute une 2ᵉ hausse quand la première est remplie aux ¾.\n\nIdéalement, on suit la météo et les floraisons locales pour anticiper les miellées — c'est l'objet du module Transhumance et de l'analyse mellifère dans APIGO.",
    voirAussi: ["Qu'est-ce que l'essaimage ?", 'Quand récolter le miel'],
  },
  {
    id: 'cadre-couvain',
    theme: 'pratique',
    titre: 'Lire un cadre de couvain',
    motsCles: [
      'lire cadre',
      'cadre couvain',
      'couvain mosaique',
      'couvain compact',
      'observer cadre',
      'diagnostic cadre',
    ],
    contenu:
      "Un cadre se lit comme un bilan de santé :\n\n- **Couvain compact et régulier** = reine performante.\n- **Couvain en mosaïque** (alvéoles vides éparpillées) = reine âgée, consanguinité, ou maladie du couvain → à surveiller.\n- **Couvain bombé/perforé, odeur** = suspicion de loque → voir la question maladies.\n- **Présence de réserves** : couronne de miel en haut, pollen multicolore autour du couvain = colonie bien approvisionnée.\n- **Cellules royales** en bordure basse = préparation d'essaimage ; au centre sur couvain percé = remplacement de reine.",
    voirAussi: ['Le cycle de développement', 'Les maladies de la ruche'],
  },

  {
    id: 'essaim-artificiel',
    theme: 'pratique',
    titre: "L'essaim artificiel (division)",
    motsCles: [
      'essaim artificiel',
      'division',
      'diviser',
      'diviser une ruche',
      'faire un essaim',
      'multiplier colonies',
      'nuclei',
      'nucleus',
    ],
    contenu:
      "Un **essaim artificiel** consiste à diviser soi-même une colonie forte au lieu de la laisser essaimer : on garde le contrôle et on agrandit son cheptel.\n\nLa méthode la plus simple (division) :\n\n1. Choisir une **colonie forte** au printemps, par belle journée.\n2. Prélever **2-3 cadres de couvain** (dont du couvain ouvert avec œufs) + **1-2 cadres de réserves**, avec leurs abeilles, **sans la reine**.\n3. Les placer dans une ruchette, compléter avec des cadres de cire gaufrée.\n4. Soit laisser les abeilles élever une **reine de sauveté** à partir des jeunes larves (≈ 1 mois avant la ponte), soit introduire une **reine fécondée** (plus rapide et plus sûr).\n5. Déplacer la ruchette à plus de 3 km, ou la garder sur place en assumant le retour des butineuses à la souche.\n\nC'est aussi un excellent levier **anti-essaimage** : retirer des cadres de couvain à une colonie qui se prépare à essaimer réduit la fièvre d'essaimage tout en créant une nouvelle colonie. À pratiquer au printemps, sur des colonies saines et populeuses.",
    voirAussi: ["Qu'est-ce que l'essaimage ?", 'Le rôle de la reine'],
  },
  {
    id: 'varroa-bio',
    theme: 'sante',
    titre: "Le varroa, qu'est-ce que c'est",
    motsCles: ['varroa', 'varroase', 'acarien', 'varroa destructor', 'parasite abeille'],
    contenu:
      "**Varroa destructor** est un acarien parasite externe de l'abeille. Il se reproduit dans le couvain operculé et se nourrit des réserves de l'abeille (corps gras), l'affaiblissant et transmettant des virus (notamment celui des ailes déformées).\n\nNon maîtrisé, il provoque l'effondrement de la colonie, souvent à l'automne ou en hiver. **Toutes les colonies en France sont infestées** : la question n'est pas « ai-je du varroa ? » mais « à quel niveau ? ». On surveille la pression (comptage sur lange graissé ou en désoperculant du couvain de mâle) et on traite en conséquence.",
    voirAussi: ['Traiter contre le varroa', 'Comment compter les varroas ?'],
  },
  {
    id: 'compter-varroa',
    theme: 'sante',
    titre: 'Compter les varroas',
    motsCles: [
      'compter varroa',
      'comptage varroa',
      'compter les varroas',
      'niveau infestation',
      'taux infestation',
      'lange',
      'chute naturelle',
      'sucre glace',
      'vp50',
      'combien de varroa',
      'mesurer varroa',
    ],
    contenu:
      "Compter les varroas permet de **décider quand traiter** plutôt que de traiter à l'aveugle. Trois méthodes courantes :\n\n1. **Chute naturelle sur lange graissé** : on glisse un lange (plateau graissé) sous la ruche, on le laisse **3 à 7 jours**, puis on compte les varroas tombés et on divise par le nombre de jours. On obtient une **chute naturelle par jour (VP/j)**.\n2. **Méthode au sucre glace** : ~300 abeilles (½ verre) prélevées sur des cadres de couvain, secouées avec une cuillère de sucre glace dans un pot à grille, puis tamisées au-dessus d'eau. On compte les varroas détachés et on rapporte au nombre d'abeilles (**varroas pour 100 abeilles**). Non létal pour l'échantillon.\n3. **Désoperculation de couvain de mâles** : on ouvre des cellules de mâles (le varroa les préfère) et on compte les acariens.\n\n**Repères indicatifs** : une chute naturelle de plus de **~5 varroas/jour en été** ou un taux supérieur à **3 varroas pour 100 abeilles** signale une pression forte appelant une intervention rapide. Ces seuils varient selon la saison et les sources — l'essentiel est de **mesurer régulièrement** (avant et après traitement) pour suivre l'efficacité. APIGO vous permet d'enregistrer le varroa observé à chaque visite.",
    voirAussi: ['Traiter contre le varroa', "Le varroa, qu'est-ce que c'est"],
  },
  {
    id: 'loques',
    theme: 'sante',
    titre: 'Les loques (américaine et européenne)',
    motsCles: [
      'loque',
      'loques',
      'loque americaine',
      'loque europeenne',
      'maladie couvain',
      'couvain malade',
      'danger sanitaire',
    ],
    contenu:
      "Les **loques** sont des maladies bactériennes du couvain.\n\n- **Loque américaine** (*Paenibacillus larvae*) : la plus grave. Couvain operculé affaissé, perforé, brun et filant (« test de l'allumette »), odeur de colle. ⚠️ **C'est un danger sanitaire de 1ʳᵉ catégorie : sa suspicion impose une déclaration à la DDPP.** Très contagieuse, les spores survivent des décennies.\n- **Loque européenne** : larves mortes avant operculation, jaunâtres, tordues. Moins grave mais affaiblit la colonie.\n\n⚠️ Je ne remplace pas un diagnostic : en cas de doute sur du couvain anormal, **contactez votre vétérinaire ou agent sanitaire apicole (TSA)** et déclarez si nécessaire. APIGO vous aide à tenir le registre et les visites sanitaires.",
    voirAussi: ['Quelles maladies sont à déclarer ?', "Tenir son registre d'élevage"],
  },
  {
    id: 'frelon-asiatique',
    theme: 'sante',
    titre: 'Le frelon asiatique',
    motsCles: [
      'frelon',
      'frelon asiatique',
      'vespa velutina',
      'predateur',
      'attaque ruche',
      'piege frelon',
    ],
    contenu:
      "Le **frelon asiatique** (*Vespa velutina*) est un prédateur redoutable : il chasse les ouvrières en vol stationnaire devant la ruche. La pression est maximale **de fin d'été à l'automne**, quand le nid grossit.\n\nMoyens de lutte : **muselières / réducteurs d'entrée** pour aider les gardiennes, **harpes électriques** sur les ruchers très exposés, destruction des nids par des professionnels (ne jamais s'en approcher soi-même). Le piégeage de printemps des fondatrices est débattu — privilégier des pièges sélectifs pour ne pas nuire aux autres insectes.\n\nUne colonie forte résiste mieux : entrée réduite, ruches surélevées.",
    voirAussi: ["Préparer l'hivernage", 'Calendrier apicole de la saison'],
  },
  {
    id: 'maladies-apercu',
    theme: 'sante',
    titre: 'Les maladies de la ruche',
    motsCles: [
      'maladies',
      'maladie ruche',
      'nosema',
      'nosemose',
      'couvain sacciforme',
      'mortalite',
      'colonie malade',
    ],
    contenu:
      "Les principaux problèmes sanitaires de l'abeille :\n\n- **Varroase** (acarien varroa) — omniprésente, à surveiller et traiter.\n- **Loques américaine et européenne** (bactéries du couvain) — la loque américaine est à déclaration obligatoire.\n- **Nosémose** (champignon *Nosema*, troubles digestifs) — favorisée par l'humidité et le stress hivernal ; signes : diarrhées sur la planche d'envol, dépopulation.\n- **Couvain sacciforme, paralysie** (virus) — souvent liés au varroa.\n- **Prédateurs** : frelon asiatique, fausse teigne (sur cadres mal stockés).\n\n⚠️ Le Copilote oriente mais ne pose pas de diagnostic : devant une mortalité anormale ou un couvain suspect, contactez un vétérinaire ou un agent sanitaire apicole.",
    voirAussi: ['Les loques', 'Quelles maladies sont à déclarer ?'],
  },

  // ─── Réglementation ────────────────────────────────────────────────────
  {
    id: 'declaration-ruches',
    theme: 'reglementation',
    titre: 'Déclarer ses ruches (obligation annuelle)',
    motsCles: [
      'declaration ruches',
      'declarer ruches',
      'napi',
      'nui',
      'numero apiculteur',
      'obligation declarer',
      'recensement',
    ],
    contenu:
      "**Tout détenteur de ruches doit les déclarer chaque année**, même une seule, même pour le loisir. C'est une obligation légale en France.\n\n- La **déclaration annuelle** se fait en principe **entre le 1ᵉʳ septembre et le 31 décembre**, sur le téléservice national, et recense le nombre de colonies et leurs emplacements.\n- À la première déclaration, vous obtenez un **numéro d'apiculteur (NAPI)**, à reporter sur vos ruchers (panneau visible).\n- Cette déclaration conditionne l'accès à certaines aides et au suivi sanitaire.\n\nAPIGO prépare le récapitulatif de votre déclaration à partir de vos ruchers et colonies enregistrés.",
    voirAussi: ["Tenir son registre d'élevage", 'Quelles maladies sont à déclarer ?'],
  },
  {
    id: 'registre-elevage',
    theme: 'reglementation',
    titre: "Le registre d'élevage",
    motsCles: [
      'registre',
      "registre d'elevage",
      'registre elevage',
      'tracabilite traitements',
      'obligation registre',
      'cahier',
    ],
    contenu:
      "Le **registre d'élevage** est obligatoire pour tout détenteur d'animaux, abeilles comprises. Il doit retracer notamment :\n\n- Les **traitements** administrés (produit, date, dose, n° de lot, ordonnance le cas échéant), conservés plusieurs années.\n- Les **interventions** et événements sanitaires.\n- Les entrées/sorties de colonies.\n\nIl peut être contrôlé. APIGO le tient automatiquement à partir de vos interventions et traitements saisis, et permet de l'éditer en PDF — c'est tout l'intérêt d'enregistrer au fil de l'eau.",
    voirAussi: ['Déclarer ses ruches', 'Traiter contre le varroa'],
  },
  {
    id: 'maladies-declarables',
    theme: 'reglementation',
    titre: 'Quelles maladies sont à déclarer',
    motsCles: [
      'maladie a declarer',
      'declaration maladie',
      'danger sanitaire',
      'ddpp',
      'obligation sanitaire',
      'declarer loque',
    ],
    contenu:
      "Certaines maladies de l'abeille sont des **dangers sanitaires réglementés** : leur suspicion ou constat impose une **déclaration aux services vétérinaires (DDPP)**.\n\nC'est notamment le cas de la **loque américaine** et de l'**infestation par le petit coléoptère de la ruche (*Aethina tumida*)** ou *Tropilaelaps* (non présents en France métropolitaine, mais à signaler immédiatement s'ils étaient observés).\n\nEn pratique : devant un couvain très suspect, ne déplacez pas les colonies, et contactez votre **vétérinaire** ou **agent sanitaire apicole**. Mieux vaut une fausse alerte qu'une propagation. APIGO trace vos visites sanitaires et mortalités pour faciliter ce suivi.",
    voirAussi: ['Les loques', "Tenir son registre d'élevage"],
  },
  {
    id: 'vente-miel',
    theme: 'reglementation',
    titre: 'Vendre son miel',
    motsCles: [
      'vendre miel',
      'vente miel',
      'etiquetage',
      'etiquette miel',
      'commercialiser',
      'dluo',
      'tva miel',
    ],
    contenu:
      "Pour vendre son miel, quelques règles d'étiquetage s'appliquent : **dénomination « miel »**, **origine** (France / mélange…), **nom et adresse** du producteur, **poids net**, **n° de lot** (traçabilité) et **DDM** (date de durabilité minimale, « à consommer de préférence avant »). Le miel n'impose pas de DLC car il se conserve très longtemps.\n\nLa **traçabilité des lots** (de la récolte au pot vendu) relève du règlement CE 178/2002 — c'est ce que gère le module Production/Lots d'APIGO. Selon votre statut et votre chiffre d'affaires, des règles fiscales et de TVA s'appliquent : renseignez-vous auprès de votre centre de gestion ou des douanes.",
    voirAussi: ['Quand récolter le miel', 'Quels sont les produits de la ruche ?'],
  },

  // ─── Produits ────────────────────────────────────────────────────────────
  {
    id: 'produits-ruche',
    theme: 'produits',
    titre: 'Les produits de la ruche',
    motsCles: [
      'produits ruche',
      'pollen',
      'propolis',
      'cire',
      'gelee royale',
      'venin',
      'que produit la ruche',
    ],
    contenu:
      "Au-delà du miel, la ruche fournit plusieurs produits :\n\n- **Le pollen** : source de protéines, récolté à l'aide d'une trappe à pollen, séché ou congelé.\n- **La propolis** : résine récoltée par les abeilles sur les bourgeons, utilisée pour assainir la ruche ; valorisée pour ses propriétés.\n- **La cire** : produite par les ouvrières, récupérée aux opercules et vieux cadres, refondue (gaufrage, cosmétique, bougies).\n- **La gelée royale** : production très technique et de niche.\n- **Le venin** : usage marginal, prélèvement spécialisé.\n\nDiversifier les produits peut améliorer le revenu d'une exploitation, mais chaque produit a ses contraintes de récolte et de réglementation.",
    voirAussi: ['Vendre son miel', 'La gelée royale'],
  },
  {
    id: 'miel-cristallisation',
    theme: 'produits',
    titre: 'Pourquoi le miel cristallise',
    motsCles: [
      'cristallise',
      'cristallisation',
      'miel dur',
      'miel solide',
      'figer',
      'pourquoi miel durcit',
    ],
    contenu:
      "**La cristallisation est naturelle et n'est pas un défaut** : c'est le passage du glucose du miel à l'état solide. Plus un miel est riche en glucose (colza, tournesol, pissenlit), plus il cristallise vite — parfois en quelques semaines. Les miels riches en fructose (acacia, châtaignier) restent liquides longtemps.\n\nUn miel cristallisé peut être redonné liquide en le chauffant **doucement au bain-marie (< 40 °C)** pour ne pas dégrader ses arômes et enzymes. Pour un miel crémeux et homogène, on pratique l'**ensemencement** (ajout d'un peu de miel finement cristallisé + brassage).",
    voirAussi: ['Quand récolter le miel', 'Vendre son miel'],
  },

  // ─── Saison ──────────────────────────────────────────────────────────────
  {
    id: 'calendrier-apicole',
    theme: 'saison',
    titre: 'Le calendrier apicole',
    motsCles: [
      'calendrier apicole',
      'calendrier',
      'que faire ce mois',
      'travaux saison',
      'annee apicole',
      'planning',
    ],
    contenu:
      "Grandes lignes de l'année apicole (à adapter à votre région et à l'altitude) :\n\n- **Hiver (déc.-févr.)** : repos, surveillance à distance, traitement varroa hors couvain, préparation du matériel. On n'ouvre pas par grand froid.\n- **Printemps (mars-mai)** : visite de printemps, nettoyage, stimulation éventuelle, **surveillance de l'essaimage**, pose des hausses, premières miellées (colza, fruitiers, acacia).\n- **Été (juin-août)** : récoltes, gestion des hausses, miellées d'été (tilleul, châtaignier, tournesol, montagne), pression du frelon qui monte.\n- **Automne (sept.-nov.)** : dernière récolte, **traitement varroa**, complément de réserves, réduction des entrées, **déclaration annuelle des ruches**.\n\nAPIGO génère des alertes (visites, météo favorable) pour rythmer ces travaux.",
    voirAussi: ['La visite de printemps', "Préparer l'hivernage"],
  },
  {
    id: 'plantes-melliferes',
    theme: 'saison',
    titre: 'Les plantes mellifères',
    motsCles: [
      'plantes melliferes',
      'fleurs melliferes',
      'miellee',
      'nectar',
      'quelles fleurs',
      'colza acacia tournesol',
      'floraison',
    ],
    contenu:
      "Une **plante mellifère** fournit nectar et/ou pollen aux abeilles. Quelques grandes miellées françaises et leur période indicative :\n\n- **Colza** : avril-mai — gros apport, miel qui cristallise vite.\n- **Acacia (robinier)** : mai — miel clair très liquide, prisé.\n- **Tilleul** : juin-juillet.\n- **Châtaignier** : juin-juillet — miel corsé.\n- **Lavande / lavandin** : juin-juillet (Sud).\n- **Tournesol** : juillet-août.\n- **Bruyère, sarrasin, montagne** : fin d'été.\n\nConnaître les floraisons autour de ses ruchers permet d'anticiper les miellées et d'orienter la transhumance — c'est l'objet de l'**analyse mellifère** d'APIGO, qui estime les ressources autour d'un emplacement.",
    voirAussi: ['Quand poser les hausses ?', 'Le calendrier apicole'],
  },
];

/** Suggestions affichées quand le Copilote ne comprend pas la question */
export const SUGGESTIONS_FALLBACK = [
  'Quelles ruches dois-je visiter en priorité ?',
  'Comment traiter contre le varroa ?',
  "Qu'est-ce que l'essaimage ?",
  'Quand récolter le miel ?',
];
