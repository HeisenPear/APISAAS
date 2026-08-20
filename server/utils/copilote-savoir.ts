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
  /**
   * Contextualisation dynamique optionnelle, injectée en tête de réponse par le
   * moteur (copilote-local.ts) — JAMAIS ici : ce fichier reste 100 % statique et
   * sans accès base, pour que `classifier()` demeure pur et testable.
   * - `'saison'` : note datée selon le mois courant (pur, sans base).
   * - `'ruches'` : rappel du nombre de ruches actives du compte (lecture base).
   */
  contexte?: 'saison' | 'ruches';
}

export const SAVOIR: ArticleSavoir[] = [
  // ─── Biologie ──────────────────────────────────────────────────────────────
  {
    id: 'abeilles-generalites',
    theme: 'biologie',
    titre: 'Les abeilles : l’essentiel',
    // « abeilles » (mot-clé simple, +3) couvre « parle-moi des abeilles » sans
    // détrôner les fiches précises (qui matchent une EXPRESSION, +4).
    motsCles: [
      'abeilles',
      'parle moi des abeilles',
      'parler des abeilles',
      'parle moi de l abeille',
      'tout savoir sur les abeilles',
      'c est quoi une abeille',
      'generalites abeilles',
      'apis mellifera',
      'abeille domestique',
    ],
    contenu:
      "**L'abeille domestique (_Apis mellifera_) vit en colonie**, un véritable superorganisme de 20 000 à 60 000 individus selon la saison. Trois castes la composent :\n\n- **La reine** — l'unique femelle féconde : elle pond et fédère la colonie par ses phéromones.\n- **Les ouvrières** — femelles stériles qui font tout : nettoyage, nourrissage du couvain, cire, garde, puis butinage.\n- **Les faux-bourdons** — les mâles, dont l'unique rôle est de féconder une reine.\n\nChaque abeille suit le cycle œuf → larve → nymphe → adulte (**21 jours** pour une ouvrière). La colonie stocke du **miel** (énergie) et du **pollen** (protéines), se reproduit au printemps par **essaimage**, et traverse l'hiver en grappe grâce aux « abeilles d'hiver », qui vivent plusieurs mois.\n\nDe quel aspect veux-tu que je te parle ?",
    voirAussi: [
      'Le rôle de la reine',
      'Ouvrières et faux-bourdons',
      'Le cycle de développement',
      "Qu'est-ce que l'essaimage ?",
    ],
  },
  {
    id: 'reine-role',
    theme: 'biologie',
    titre: 'Le rôle de la reine',
    motsCles: [
      'pheromone reine',
      'pheromones',
      'signal chimique',
      'cohesion colonie',
      'reine vivante',
      'reine',
      'role reine',
      'a quoi sert la reine',
      'ponte',
      'pondre',
      'mere',
    ],
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
      'reine disparue',
      // Le débutant ne dit pas « disparue » mais « morte », et décrit ce qu'il
      // voit : « je vois pas la reine ». Sans ces formulations, la question
      // partait sur l'aperçu des maladies (corpus Maya).
      'reine morte',
      'reine est morte',
      'pas la reine',
      'trouve pas la reine',
      'reine partie',
      'reine s en va',
      'reine s enfuit',
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
      // Les formulations d'EXCÈS (« plein de mâles », « trop de mâles »…) sont
      // volontairement absentes : elles appartiennent à `exces-males`, qui
      // diagnostique. Elles figuraient dans les deux fiches, à l'identique, et
      // l'égalité se tranchait au hasard — « j'ai des faux bourdons partout »
      // tombait sur la fiche de biologie au lieu de celle qui explique quoi
      // faire. Cette fiche-ci répond à « qu'est-ce qu'un faux-bourdon ».
      'pourquoi des males',
      'abeille hiver',
      'abeille d hiver',
      'duree de vie abeille',
      'longevite abeille',
      'ouvriere d ete',
      'ouvriere d automne',
      'ouvriere',
      'ouvrieres',
      // « faux bourdon » suffit : la normalisation transforme le trait d'union
      // en espace, donc « faux-bourdon » produisait EXACTEMENT les mêmes jetons
      // et comptait une seconde fois. Un même concept pesait double, et cette
      // fiche de biologie générale l'emportait sur `exces-males` — celle qui
      // diagnostique — quand un apiculteur signalait « des faux bourdons
      // partout ».
      'faux bourdon',
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
    contexte: 'saison',
    titre: "L'essaimage",
    motsCles: [
      'partir essaim',
      'abeilles s en vont',
      'abeilles partent',
      'quand essaimer',
      'signe essaimage',
      'signes essaimage',
      'essaimage',
      'essaim',
      'essaimer',
      'cellules royales',
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
    contexte: 'saison',
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
    contexte: 'ruches',
    titre: 'Traiter contre le varroa',
    motsCles: [
      'resistance varroa',
      'varroa resistant',
      'produit ne marche plus',
      'traitement inefficace',
      'alterner amitraze',
      'rotation produits',
      'traitement printanier',
      'traitement d ete',
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
      "**Le varroa est l'ennemi n°1 de l'abeille.** Sans traitement, une colonie meurt généralement en 1 à 3 ans. La stratégie classique :\n\n- **Traitement principal après la dernière récolte** (fin d'été / début d'automne), pour protéger les abeilles d'hiver. Produits avec AMM : lanières (amitraze, fluvalinate), ou acide formique selon conditions.\n- **Traitement de complément en hiver** hors couvain (souvent à l'**acide oxalique** par dégouttement ou sublimation), quand il n'y a quasi plus de couvain operculé — c'est là qu'il est le plus efficace.\n\n**N'utilise que des produits autorisés (AMM), respecte les doses, et note chaque traitement dans ton registre.** APIGO te permet d'enregistrer ces traitements et de garder une traçabilité. En cas de doute, demande conseil à ton groupement sanitaire ou vétérinaire.",
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
    contexte: 'saison',
    titre: "Préparer l'hivernage",
    motsCles: [
      'formation grappe',
      'thermoregulation',
      'temperature grappe',
      'chaleur collective',
      'pourquoi la grappe',
      'pesee automne',
      'peser ruche automne',
      'poids hiverner',
      'ruche legere',
      'moins de 12 kg',
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
    contexte: 'saison',
    titre: 'La visite de printemps',
    motsCles: [
      'visite printemps',
      'sortie hiver',
      'premiere visite',
      'reprise',
      'visite sanitaire printemps',
      'force colonie',
      'force de la colonie',
      'evaluer force',
      'nombre de cadres',
      'combien de cadres',
      'population colonie',
    ],
    contenu:
      "La **visite de printemps** est la plus importante de l'année : elle fait le bilan de sortie d'hiver. À vérifier, par une journée douce (idéalement >14-15 °C, peu de vent) :\n\n- **Présence de la reine et de ponte** (œufs, couvain de tous âges) — sinon la colonie est peut-être orpheline.\n- **Niveau des réserves** : compléter si la colonie est légère.\n- **Force de la colonie** : nombre de cadres couverts d'abeilles.\n- **État sanitaire** : aspect du couvain, présence de varroa, propreté.\n\nC'est le moment de nettoyer les plateaux, remplacer les vieux cadres et planifier la saison. APIGO calcule un **score de santé** par ruche à partir de ces observations.",
    voirAussi: ['Comment lire un cadre de couvain ?', 'Calendrier apicole de la saison'],
  },
  {
    id: 'poser-hausses',
    theme: 'pratique',
    contexte: 'saison',
    titre: 'Quand poser les hausses',
    motsCles: [
      'plus de place',
      'manque de place',
      'elle est pleine',
      'ruche pleine',
      'pose hausse printemps',
      'quand poser premiere hausse',
      'premiere hausse',
      // Ni « hausse » ni « hausses » nus, et pas « quand hausse » non plus.
      //
      // Ces trois-là accaparaient TOUTE question portant sur une hausse : « quand
      // est-ce que j'enlève les hausses », et même « retirer les hausses quand »,
      // atterrissaient sur cette fiche — qui explique quand les POSER. Un
      // apiculteur qui demande en août quand retirer s'entendait répondre le
      // conseil de mars : une saison de décalage, et l'action inverse.
      //
      // Un mot-clé qui décrit l'OBJET commun à deux fiches ne discrimine rien.
      // Ne restent ici que les formulations propres à la pose.
      'poser hausse',
      'poser les hausses',
      'quand poser les hausses',
      // Les verbes qu'on emploie VRAIMENT à la place de « poser » : on « met »
      // une hausse, on la « rajoute ». Retirer le mot-clé fourre-tout imposait
      // de les écrire — « quand je mets les hausses » ne trouvait plus rien.
      'mettre les hausses',
      'je mets les hausses',
      'mettre une hausse',
      'rajouter une hausse',
      'ajouter une hausse',
      'grille a reine',
      'miellee',
    ],
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
      'quand diviser',
      'colonie assez forte',
      'ruchette fecondation',
      'conduite nucleus',
      '5 cadres division',
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
      'seuil varroa',
      'seuil traitement',
      'quand traiter varroa',
      'vp jour',
      'varroas par jour',
      'niveau critique varroa',
      'lange graisse',
      'varroas sur lange',
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
      // « à partir de combien de varroa il faut traiter » : c'est le SEUIL qu'on
      // demande (compter), pas le protocole de traitement.
      'a partir de combien',
      'combien avant de traiter',
      'a partir de quand traiter',
    ],
    contenu:
      "Compter les varroas permet de **décider quand traiter** plutôt que de traiter à l'aveugle. Trois méthodes courantes :\n\n1. **Chute naturelle sur lange graissé** : on glisse un lange (plateau graissé) sous la ruche, on le laisse **3 à 7 jours**, puis on compte les varroas tombés et on divise par le nombre de jours. On obtient une **chute naturelle par jour (VP/j)**.\n2. **Méthode au sucre glace** : ~300 abeilles (½ verre) prélevées sur des cadres de couvain, secouées avec une cuillère de sucre glace dans un pot à grille, puis tamisées au-dessus d'eau. On compte les varroas détachés et on rapporte au nombre d'abeilles (**varroas pour 100 abeilles**). Non létal pour l'échantillon.\n3. **Désoperculation de couvain de mâles** : on ouvre des cellules de mâles (le varroa les préfère) et on compte les acariens.\n\n**Repères indicatifs** : une chute naturelle de plus de **~5 varroas/jour en été** ou un taux supérieur à **3 varroas pour 100 abeilles** signale une pression forte appelant une intervention rapide. Ces seuils varient selon la saison et les sources — l'essentiel est de **mesurer régulièrement** (avant et après traitement) pour suivre l'efficacité. APIGO te permet d'enregistrer le varroa observé à chaque visite.",
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
      "Les **loques** sont des maladies bactériennes du couvain.\n\n- **Loque américaine** (*Paenibacillus larvae*) : la plus grave. Couvain operculé affaissé, perforé, brun et filant (« test de l'allumette »), odeur de colle. **C'est un danger sanitaire de 1ʳᵉ catégorie : sa suspicion impose une déclaration à la DDPP.** Très contagieuse, les spores survivent des décennies.\n- **Loque européenne** : larves mortes avant operculation, jaunâtres, tordues. Moins grave mais affaiblit la colonie.\n\nJe ne remplace pas un diagnostic : en cas de doute sur du couvain anormal, **contacte ton vétérinaire ou agent sanitaire apicole (TSA)** et déclarez si nécessaire. APIGO t’aide à tenir le registre et les visites sanitaires.",
    voirAussi: ['Quelles maladies sont à déclarer ?', "Tenir son registre d'élevage"],
  },
  {
    id: 'frelon-asiatique',
    theme: 'sante',
    contexte: 'saison',
    titre: 'Le frelon asiatique',
    motsCles: [
      'museliere',
      'harpe electrique',
      'reducteur d entree',
      'filet anti frelon',
      'proteger des frelons',
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
      'colonies disparaissent',
      'disparition colonies',
      'colonies meurent',
      'abeilles meurent',
      'perte colonies',
    ],
    contenu:
      "Les principaux problèmes sanitaires de l'abeille :\n\n- **Varroase** (acarien varroa) — omniprésente, à surveiller et traiter.\n- **Loques américaine et européenne** (bactéries du couvain) — la loque américaine est à déclaration obligatoire.\n- **Nosémose** (champignon *Nosema*, troubles digestifs) — favorisée par l'humidité et le stress hivernal ; signes : diarrhées sur la planche d'envol, dépopulation.\n- **Couvain sacciforme, paralysie** (virus) — souvent liés au varroa.\n- **Prédateurs** : frelon asiatique, fausse teigne (sur cadres mal stockés).\n\nLe Copilote oriente mais ne pose pas de diagnostic : devant une mortalité anormale ou un couvain suspect, contacte un vétérinaire ou un agent sanitaire apicole.",
    voirAussi: ['Les loques', 'Quelles maladies sont à déclarer ?'],
  },

  // ─── Réglementation ────────────────────────────────────────────────────
  {
    id: 'declaration-ruches',
    theme: 'reglementation',
    titre: 'Déclarer ses ruches (obligation annuelle)',
    motsCles: [
      'quand declarer',
      'periode declaration',
      'septembre decembre',
      'date limite declaration',
      'declaration annuelle obligatoire',
      'declaration ruches',
      'declarer ruches',
      'napi',
      'nui',
      'numero apiculteur',
      'obligation declarer',
      'recensement',
    ],
    contenu:
      "**Tout détenteur de ruches doit les déclarer chaque année**, même une seule, même pour le loisir. C'est une obligation légale en France.\n\n- La **déclaration annuelle** se fait en principe **entre le 1ᵉʳ septembre et le 31 décembre**, sur le téléservice national, et recense le nombre de colonies et leurs emplacements.\n- À la première déclaration, t’obtenez un **numéro d'apiculteur (NAPI)**, à reporter sur tes ruchers (panneau visible).\n- Cette déclaration conditionne l'accès à certaines aides et au suivi sanitaire.\n\nAPIGO prépare le récapitulatif de ton déclaration à partir de tes ruchers et colonies enregistrés.",
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
      "Le **registre d'élevage** est obligatoire pour tout détenteur d'animaux, abeilles comprises. Il doit retracer notamment :\n\n- Les **traitements** administrés (produit, date, dose, n° de lot, ordonnance le cas échéant), conservés plusieurs années.\n- Les **interventions** et événements sanitaires.\n- Les entrées/sorties de colonies.\n\nIl peut être contrôlé. APIGO le tient automatiquement à partir de tes interventions et traitements saisis, et permet de l'éditer en PDF — c'est tout l'intérêt d'enregistrer au fil de l'eau.",
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
      "Certaines maladies de l'abeille sont des **dangers sanitaires réglementés** : leur suspicion ou constat impose une **déclaration aux services vétérinaires (DDPP)**.\n\nC'est notamment le cas de la **loque américaine** et de l'**infestation par le petit coléoptère de la ruche (*Aethina tumida*)** ou *Tropilaelaps* (non présents en France métropolitaine, mais à signaler immédiatement s'ils étaient observés).\n\nEn pratique : devant un couvain très suspect, ne déplace pas les colonies, et contacte ton **vétérinaire** ou **agent sanitaire apicole**. Mieux vaut une fausse alerte qu'une propagation. APIGO trace tes visites sanitaires et mortalités pour faciliter ce suivi.",
    voirAussi: ['Les loques', "Tenir son registre d'élevage"],
  },
  {
    id: 'vente-miel',
    theme: 'reglementation',
    titre: 'Vendre son miel',
    motsCles: [
      'ddm',
      'date de durabilite minimale',
      'numero de lot',
      'origine france',
      'adresse producteur',
      'poids net',
      'etiquette obligatoire',
      'prix au kg',
      'circuit de vente',
      'ou vendre',
      'grossiste',
      'vente directe',
      'vendre miel',
      'vente miel',
      'etiquetage',
      'etiquette miel',
      'commercialiser',
      'dluo',
      'tva miel',
    ],
    contenu:
      "Pour vendre son miel, quelques règles d'étiquetage s'appliquent : **dénomination « miel »**, **origine** (France / mélange…), **nom et adresse** du producteur, **poids net**, **n° de lot** (traçabilité) et **DDM** (date de durabilité minimale, « à consommer de préférence avant »). Le miel n'impose pas de DLC car il se conserve très longtemps.\n\nLa **traçabilité des lots** (de la récolte au pot vendu) relève du règlement CE 178/2002 — c'est ce que gère le module Production/Lots d'APIGO. Selon ton statut et ton chiffre d'affaires, des règles fiscales et de TVA s'appliquent : renseignez-t’auprès de ton centre de gestion ou des douanes.",
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
      'ensemencement',
      'cristallisation guidee',
      'miel cremeux',
      'texture miel',
      'miel granule',
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
    contexte: 'saison',
    titre: 'Le calendrier apicole',
    motsCles: [
      'fevrier apiculture',
      'mars apiculture',
      'que faire ce mois ci',
      'en ce moment',
      'calendrier apicole',
      'calendrier',
      'que faire ce mois',
      'travaux saison',
      'annee apicole',
      'planning',
    ],
    contenu:
      "Grandes lignes de l'année apicole (à adapter à ta région et à l'altitude) :\n\n- **Hiver (déc.-févr.)** : repos, surveillance à distance, traitement varroa hors couvain, préparation du matériel. On n'ouvre pas par grand froid.\n- **Printemps (mars-mai)** : visite de printemps, nettoyage, stimulation éventuelle, **surveillance de l'essaimage**, pose des hausses, premières miellées (colza, fruitiers, acacia).\n- **Été (juin-août)** : récoltes, gestion des hausses, miellées d'été (tilleul, châtaignier, tournesol, montagne), pression du frelon qui monte.\n- **Automne (sept.-nov.)** : dernière récolte, **traitement varroa**, complément de réserves, réduction des entrées, **déclaration annuelle des ruches**.\n\nAPIGO génère des alertes (visites, météo favorable) pour rythmer ces travaux.",
    voirAussi: ['La visite de printemps', "Préparer l'hivernage"],
  },
  {
    id: 'plantes-melliferes',
    theme: 'saison',
    contexte: 'saison',
    titre: 'Les plantes mellifères',
    motsCles: [
      'tilleul juin',
      'lavande juillet',
      'miellee par mois',
      'quand fleurit',
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

  // ─── Biologie (compléments) ────────────────────────────────────────────────
  {
    id: 'races-abeilles',
    theme: 'biologie',
    titre: "Les races d'abeilles",
    motsCles: [
      'race',
      'races',
      'morphologie',
      'ecotype',
      'selection',
      'temperament',
      'race abeille',
      'races abeilles',
      'buckfast',
      'carnica',
      'abeille noire',
      'apis mellifera',
      'italienne',
      'ligustica',
      'quelle abeille',
    ],
    contenu:
      "Plusieurs sous-espèces et lignées d'*Apis mellifera* sont élevées en France, chacune avec son tempérament :\n\n- **L'abeille noire** (*A. m. mellifera*) : locale, rustique, économe de ses réserves, bien adaptée aux climats difficiles ; parfois plus défensive et sujette à l'essaimage.\n- **La Buckfast** : lignée sélectionnée (par Frère Adam), réputée douce, productive et peu essaimeuse ; très répandue en production.\n- **La Carnica** (*A. m. carnica*) : douce, bonne hivernante, démarrage de ponte explosif au printemps.\n- **L'Italienne** (*A. m. ligustica*) : prolifique et douce, mais grosse consommatrice de réserves, moins adaptée aux hivers rudes.\n\nLe choix dépend de ton climat, de tes objectifs (production, douceur) et de ce qui est disponible localement. Beaucoup d'apiculteurs privilégient une **abeille adaptée à leur région**. Attention : croiser sans méthode peut donner des colonies agressives à la génération suivante.",
    voirAussi: ['Le rôle de la reine', 'Élever ses propres reines'],
  },
  {
    id: 'fecondation-reine',
    theme: 'biologie',
    titre: 'La fécondation de la reine',
    motsCles: [
      'fecondation',
      'spermatheque',
      'reine reprend ponte',
      'reine ne pond pas',
      'combien de jours avant ponte',
      'relance ponte',
      'fecondation reine',
      'accouplement',
      'vol nuptial',
      'reine vierge',
      'reine fecondee',
      'congregation males',
      'reine pondre quand',
      'comment reine feconde',
      'feconder une reine',
      'feconder la reine',
      'comment feconder',
    ],
    contenu:
      "Une jeune reine naît **vierge**. Quelques jours après sa naissance (souvent **5 à 10 jours**), par beau temps, elle effectue un ou plusieurs **vols nuptiaux** : elle s'accouple **en vol**, en altitude, dans des zones de rassemblement de mâles (congrégations), avec **10 à 20 faux-bourdons** issus d'autres colonies.\n\nElle stocke alors le sperme à vie dans sa **spermathèque** : elle ne s'accouplera plus jamais. De retour à la ruche, elle commence à pondre sous **2 à 3 jours** si la fécondation a réussi.\n\nC'est une période **fragile** : par mauvais temps prolongé, la reine peut rester vierge et devenir **pondeuse de mâles** (œufs non fécondés). En élevage, on protège donc les jeunes reines et on leur laisse le temps de se faire féconder avant de juger une colonie orpheline.",
    voirAussi: ['Le rôle de la reine', 'Élever ses propres reines'],
  },
  {
    id: 'communication-abeilles',
    theme: 'biologie',
    titre: 'La communication des abeilles',
    motsCles: [
      'danse',
      'waggle dance',
      'recrutement',
      'direction nectar',
      'signal chimique',
      'nasonov',
      'communication',
      'danse abeilles',
      'danse fretillante',
      'comment communiquent',
      'langage abeille',
      'pheromones',
      'frétillante',
      'recrutement butineuses',
    ],
    contenu:
      "Les abeilles communiquent surtout par **phéromones** (signaux chimiques) et par **danses**.\n\n- **La danse frétillante** (décrite par Karl von Frisch) : une butineuse de retour indique à ses sœurs la **direction** (angle par rapport au soleil) et la **distance** d'une source de nectar abondante, en frétillant sur les rayons.\n- **Les phéromones** : la reine diffuse une phéromone de cohésion ; les ouvrières émettent des phéromones d'alarme (à l'odeur de banane, près du dard) qui mobilisent les gardiennes, ou la phéromone de Nasonov pour guider les abeilles vers l'entrée.\n\nCette communication explique la cohésion remarquable d'une colonie, qui se comporte comme un **superorganisme**.",
    voirAussi: ['Le rôle de la reine', "Qu'est-ce que l'essaimage ?"],
  },

  // ─── Pratiques (compléments) ───────────────────────────────────────────────
  {
    id: 'enrucher-essaim',
    theme: 'pratique',
    titre: 'Récupérer et enrucher un essaim',
    motsCles: [
      'enrucher',
      'recuperer essaim',
      'cueillir essaim',
      'capter essaim',
      'essaim sur branche',
      'essaim nu',
      'attraper essaim',
      'essaim dans jardin',
    ],
    contenu:
      "Un **essaim** posé (grappe d'abeilles sur une branche) est généralement **peu agressif** : les abeilles, gorgées de miel, n'ont pas de couvain à défendre.\n\nMéthode classique :\n\n1. Placer une **ruchette** (ou un carton) sous l'essaim, avec quelques cadres bâtis ou de la cire gaufrée.\n2. **Secouer franchement** la branche au-dessus pour faire tomber la grappe dedans, ou la faire monter en la brossant doucement.\n3. L'essentiel est de **capturer la reine** : si elle est dans la boîte, les autres l'y rejoignent en quelques minutes (on voit des abeilles « battre le rappel », abdomen relevé).\n4. Laisser la boîte sur place jusqu'au **soir** que toutes les butineuses rentrent, puis fermer et déplacer.\n5. Nourrir légèrement pour aider la colonie à bâtir.\n\nUn essaim de provenance inconnue peut être porteur de maladies : installez-le à l'écart et surveillez le couvain à sa formation. Pense aussi à **déclarer** la colonie.",
    voirAussi: ["Qu'est-ce que l'essaimage ?", 'Débuter en apiculture'],
  },
  {
    id: 'extraction-miel',
    theme: 'pratique',
    titre: 'Extraire et mettre le miel en pot',
    motsCles: [
      'filtration',
      'miel trouble',
      'impuretes',
      'ecume maturateur',
      'extraction',
      'extracteur',
      'desoperculer',
      'desoperculation',
      'maturateur',
      'mise en pot',
      'filtrer miel',
      'centrifuger',
      'comment extraire',
      'miellerie',
    ],
    contenu:
      "Une fois les hausses récoltées (cadres mûrs, operculés), l'extraction se fait au chaud, dans un **local propre, fermé aux abeilles** :\n\n1. **Désoperculer** : retirer la fine couche de cire qui ferme les alvéoles, au couteau ou à la herse à désoperculer, au-dessus d'un bac.\n2. **Extraire** : placer les cadres dans un **extracteur** (centrifugeuse) ; le miel est projeté contre la paroi et coule au fond. Monter en vitesse progressivement pour ne pas casser les cadres.\n3. **Filtrer** le miel à travers un tamis pour retirer cire et impuretés.\n4. **Maturer** : laisser reposer en **maturateur** quelques jours ; les bulles d'air et fines particules remontent en écume qu'on retire.\n5. **Mettre en pot** quand le miel est clair, puis étiqueter (lot, DDM).\n\nNe jamais chauffer le miel au-delà de **~40 °C** pour préserver arômes et enzymes. Nettoyez le matériel à l'eau (le miel est hydrosoluble).",
    voirAussi: ['Quand récolter le miel', 'Pourquoi le miel cristallise'],
  },
  {
    id: 'remerage',
    theme: 'pratique',
    titre: 'Le remérage (changer de reine)',
    motsCles: [
      'cage nicot',
      'candi cage',
      'combien de temps reine en cage',
      'liberer la reine',
      'introduction reine',
      'remerage',
      'remerer',
      'changer reine',
      'changer de reine',
      'remplacer reine',
      'introduire reine',
      'introduire une reine',
      'cage introduction',
      'reine en cage',
    ],
    contenu:
      "**Remérer**, c'est remplacer la reine d'une colonie — parce qu'elle vieillit, pond mal, ou que la colonie est trop agressive ou orpheline.\n\nPrincipe : on **retire l'ancienne reine**, puis on introduit la nouvelle, presque toujours **en cage** pour éviter qu'elle soit tuée. La cage (type Nicot, ou cage à bonbon) laisse les ouvrières s'habituer à son odeur pendant **2 à 4 jours** avant qu'elles ne la libèrent en grignotant le candi.\n\nPoints clés :\n\n- Vérifier d'abord qu'il **n'y a plus de reine ni de cellules royales** (sinon la nouvelle sera refusée).\n- Introduire de préférence en période de **miellée** ou avec un léger nourrissement : une colonie qui rentre du nectar accepte mieux.\n- Contrôler la **ponte** une dizaine de jours plus tard, sans chercher la reine trop tôt.\n\nUne reine jeune et de bonne lignée relance la ponte, réduit l'essaimage et améliore le tempérament.",
    voirAussi: ['Le rôle de la reine', 'Reconnaître une colonie orpheline'],
  },
  {
    id: 'reunir-colonies',
    theme: 'pratique',
    titre: 'Réunir deux colonies',
    motsCles: [
      'reunir colonies',
      'reunir deux ruches',
      'reunion',
      'methode journal',
      'fusionner ruches',
      'colonie faible',
      'reunir orpheline',
    ],
    contenu:
      "**Réunir** consiste à fusionner deux colonies en une seule, plus forte — utile pour sauver une colonie **orpheline**, **bourdonneuse** ou trop **faible** avant l'hiver.\n\nLa **méthode du papier journal** est la plus sûre :\n\n1. Ne garder **qu'une seule reine** (retirer celle de la colonie la moins bonne, ou celle de l'orpheline est déjà absente).\n2. Poser une **feuille de papier journal** (légèrement fendue de quelques trous) sur le corps de la colonie avec reine.\n3. Poser le corps de l'autre colonie par-dessus.\n4. Les abeilles grignotent le papier en **1 à 2 jours** : le mélange des odeurs est progressif, ce qui **évite la bagarre**.\n\nQuelques jours après, on réorganise les cadres pour ne garder que les meilleurs. Mieux vaut **une colonie forte que deux faibles** à l'entrée de l'hiver.",
    voirAussi: ['Reconnaître une colonie orpheline', "Préparer l'hivernage"],
  },
  {
    id: 'elevage-reines',
    theme: 'pratique',
    titre: 'Élever ses propres reines',
    motsCles: [
      'elevage reines',
      'elever reines',
      'elever des reines',
      'greffage',
      'greffer',
      'starter',
      'finisseur',
      'cupules',
      'picking',
      'produire reines',
      'cellules royales elevage',
    ],
    contenu:
      "Élever ses reines permet de **sélectionner** ses meilleures colonies (douceur, production, tenue sanitaire) et de renouveler son cheptel à moindre coût.\n\nLa méthode la plus répandue est le **greffage** :\n\n1. Choisir une **colonie-mère** aux bonnes qualités.\n2. **Greffer** (transférer) de très jeunes larves (< 24 h) dans des **cupules** artificielles.\n3. Les confier à un **starter** (colonie orpheline et populeuse qui démarre les cellules), puis à un **finisseur** (colonie avec reine, au-dessus d'une grille) qui les nourrit jusqu'à l'operculation.\n4. Placer les **cellules royales operculées** en ruchettes de fécondation (nuclei) avant éclosion.\n5. Laisser les jeunes reines se faire **féconder**, puis évaluer leur ponte.\n\nIl existe des méthodes plus simples sans greffage (Miller, Cloake, élevage sur cadre découpé) pour débuter. C'est une discipline exigeante mais passionnante, au cœur du module **Élevage** d'APIGO.",
    voirAussi: ['La fécondation de la reine', "L'essaim artificiel (division)"],
  },
  {
    id: 'transhumance',
    theme: 'pratique',
    titre: 'La transhumance',
    motsCles: [
      'transhumance',
      'transhumer',
      // « quand transhumer sur le châtaignier » : le verbe tranche vers la
      // transhumance (sinon égalité avec la fiche « miellée de châtaignier »).
      'quand transhumer',
      'transhumer sur',
      'quand deplacer',
      'deplacer ruches',
      'deplacement ruches',
      'transporter ruches',
      'bouger ruches',
      'changer emplacement',
      'miellee deplacement',
    ],
    contenu:
      "La **transhumance** consiste à déplacer ses ruches pour suivre les **miellées** (colza, acacia, lavande, châtaignier, montagne…) ou pour la pollinisation.\n\nBonnes pratiques :\n\n- Déplacer de **nuit ou tôt le matin**, ruches **fermées**, quand toutes les butineuses sont rentrées et qu'il fait frais (limiter le stress et la surchauffe).\n- Assurer la **ventilation** (grille d'aération) — une colonie enfermée au chaud peut étouffer.\n- Bien **arrimer** les corps et hausses.\n- Respecter la règle des **3 km** : en dessous, les butineuses risquent de revenir à l'ancien emplacement (sauf déplacement de moins de ~3 m par jour, ou dépaysement prolongé).\n- Penser à la **déclaration** des emplacements et au repos des colonies après le transport.\n\nLe module **Transhumance** et l'**analyse mellifère** d'APIGO aident à choisir et évaluer les emplacements.",
    voirAussi: ['Les plantes mellifères', 'Distances et implantation des ruchers'],
  },

  // ─── Matériel ──────────────────────────────────────────────────────────────
  {
    id: 'types-ruches',
    theme: 'pratique',
    titre: 'Les types de ruches (Dadant, Langstroth, Warré)',
    motsCles: [
      'type ruche',
      'types ruches',
      'dadant',
      'langstroth',
      'warre',
      'ruche horizontale',
      'modele ruche',
      'quelle ruche choisir',
      'kenyane',
      'ruche tronc',
    ],
    contenu:
      "Le choix du **modèle de ruche** détermine le matériel pour toute la vie de l'exploitation — mieux vaut s'aligner sur ce qui est répandu autour de soi (échanges de cadres, achat d'essaims).\n\n- **Dadant** : la plus courante en France. Corps de 10 cadres + hausses moins hautes. Polyvalente, bien adaptée à la production de miel. Référence pour débuter.\n- **Langstroth** : très répandue dans le monde, corps et hausses de même dimension (cadres interchangeables), appréciée des professionnels et pour la transhumance.\n- **Warré** : ruche « écologique » à conduite verticale, sans cadres (ou barrettes), agrandie par le bas. Conduite plus naturelle mais récolte et visites différentes.\n- **Ruches horizontales** (Kényane, ruche-tronc) : conduites alternatives, plus confidentielles.\n\nEn pratique, la **Dadant 10 cadres** est le choix le plus simple pour débuter en France.",
    voirAussi: ["S'équiper pour débuter", 'Débuter en apiculture'],
  },
  {
    id: 'equipement-debutant',
    theme: 'pratique',
    titre: "S'équiper pour débuter",
    motsCles: [
      'combustible enfumoir',
      'allumer enfumoir',
      'comment enfumer',
      'fumee froide',
      'calmer abeilles',
      's equiper',
      'equiper',
      'equipement',
      'enfumoir',
      'leve cadre',
      'combinaison',
      'vareuse',
      'gants apiculture',
      'premier equipement',
      'outils apiculteur',
    ],
    contenu:
      "Pour démarrer sereinement, quelques **équipements de base** suffisent :\n\n- **Protection** : une **vareuse** ou combinaison avec voile, et des **gants** (en cuir pour débuter, plus fins ensuite). Le voile est non négociable.\n- **L'enfumoir** : indispensable. Une fumée froide et légère calme les abeilles et permet d'ouvrir la ruche sereinement (combustible : copeaux, aiguilles de pin, granulés).\n- **Le lève-cadre** : l'outil le plus utilisé — décoller les cadres collés à la propolis, gratter, racler.\n- **Une brosse** à abeilles, un seau, et de quoi prendre des notes.\n- Côté ruche : un **corps**, son **plancher**, ses **cadres** cirés, un **couvre-cadres** et un **toit**, plus une ou deux **hausses** avec grille à reine.\n\nMieux vaut **peu de matériel de qualité** et un **bon vêtement de protection** : la confiance vient en partie de là. Une formation en **rucher-école** complète idéalement cet équipement.",
    voirAussi: ['Les types de ruches (Dadant, Langstroth, Warré)', 'Débuter en apiculture'],
  },
  {
    id: 'desinfection-materiel',
    theme: 'pratique',
    titre: 'Nettoyer et désinfecter le matériel',
    motsCles: [
      'desinfecter',
      'desinfection',
      'nettoyer ruche',
      'flamber cadres',
      'flammer',
      'soude',
      'hygiene materiel',
      'renouveler cadres',
      'vieux cadres',
      'cire noire',
    ],
    contenu:
      "L'hygiène du matériel **prévient les maladies** et casse les cycles de contamination.\n\n- **Renouveler les cadres** : remplacer **2 à 3 vieux cadres par an** et par ruche. Une cire noircie accumule résidus et spores — c'est un réservoir de pathogènes.\n- **Flamber** corps et planchers vides au chalumeau (la flamme passe sur le bois jusqu'à le brunir légèrement) : efficace contre de nombreux germes, dont les spores de loque.\n- **Gratter** propolis et cire, puis nettoyer ; pour une désinfection chimique, des solutions à base de **cristaux de soude** (carbonate) sont utilisées sur le matériel bois.\n- **Stocker** les cadres bâtis à l'abri de la **fausse teigne** (au froid, ou avec une protection adaptée).\n\nEn cas de **loque américaine confirmée**, le matériel contaminé relève de mesures strictes (souvent destruction) sous contrôle vétérinaire : ne réutilise rien sans avis sanitaire.",
    voirAussi: ['Les maladies de la ruche', "Tenir son registre d'élevage"],
  },

  // ─── Santé (compléments) ───────────────────────────────────────────────────
  {
    id: 'nosemose',
    theme: 'sante',
    titre: 'La nosémose',
    motsCles: [
      'nosemose',
      'nosema',
      'diarrhee abeilles',
      'dysenterie',
      'troubles digestifs',
      'tache sur planche',
      'abeilles malades hiver',
    ],
    contenu:
      "La **nosémose** est une maladie de l'intestin de l'abeille adulte, causée par un champignon microsporidie (*Nosema apis*, et surtout *Nosema ceranae*).\n\nSignes possibles : **dépopulation** progressive, abeilles affaiblies, traînées de **diarrhée** sur la planche d'envol et les cadres (surtout *N. apis*, lié aux hivers humides). *N. ceranae* est souvent plus discret mais épuise la colonie toute l'année.\n\nFacteurs favorisants : **humidité**, stress, manque de réserves de qualité, hivernage difficile. Il n'existe pas de traitement vétérinaire autorisé simple en France : la lutte est avant tout **préventive** — colonies fortes, ruches saines et **bien ventilées**, bonnes réserves, renouvellement des cadres, et **désinfection** du matériel.\n\nUn diagnostic de certitude passe par une **analyse en laboratoire** (comptage de spores). Devant une dépopulation anormale, rapproche-toi d'un vétérinaire ou agent sanitaire.",
    voirAussi: ['Les maladies de la ruche', "Préparer l'hivernage"],
  },
  {
    id: 'fausse-teigne',
    theme: 'sante',
    titre: 'La fausse teigne',
    motsCles: [
      'fausse teigne',
      'teigne',
      'galleria',
      'papillon cire',
      'cadres ronges',
      'cadres detruits',
      'proteger cadres',
      'vers dans cadres',
    ],
    contenu:
      "La **fausse teigne** (papillons *Galleria mellonella* et *Achroia grisella*) pond dans la cire ; ses chenilles **creusent des galeries** dans les rayons, les couvrant de fils soyeux et de déjections.\n\nC'est surtout un **ravageur du matériel stocké** (cadres bâtis hors ruche) et des **colonies faibles** qui ne peuvent plus défendre leurs cadres. Une colonie forte la tient naturellement en respect.\n\nProtéger les cadres stockés :\n\n- Les conserver **au froid** (la teigne ne se développe pas en dessous de ~10 °C) ou en **congélation** 48 h pour tuer œufs et larves.\n- Stocker dans des **hausses empilées aérées et lumineuses**, plutôt qu'au chaud et au noir.\n- Éviter les vieux cadres pleins de cire/pollen, plus attractifs.\n\nLa fausse teigne n'est pas une maladie de l'abeille : c'est d'abord un **signal** qu'une colonie est trop faible ou que le matériel est mal stocké.",
    voirAussi: ['Nettoyer et désinfecter le matériel', 'Les maladies de la ruche'],
  },
  {
    id: 'petit-coleoptere',
    theme: 'sante',
    titre: 'Le petit coléoptère de la ruche',
    motsCles: [
      'petit coleoptere',
      'aethina',
      'aethina tumida',
      'coleoptere ruche',
      'scarabee ruche',
      'petit scarabee',
    ],
    contenu:
      "Le **petit coléoptère de la ruche** (*Aethina tumida*) est un ravageur exotique : ses larves se nourrissent de couvain, de miel et de pollen, et peuvent **détruire une colonie** et faire fermenter le miel.\n\nIl est présent en Italie (Calabre) depuis 2014 mais **n'est pas établi en France métropolitaine**. C'est un **danger sanitaire réglementé** : toute suspicion (petit scarabée brun-noir de 5-7 mm, larves dans les rayons) doit être **signalée immédiatement à la DDPP**.\n\nLa vigilance porte surtout sur les **introductions** (essaims, reines, matériel importés de zones touchées). En cas de doute, ne déplace pas les colonies et contacte ton agent sanitaire.",
    voirAussi: ['Quelles maladies sont à déclarer ?', 'Les maladies de la ruche'],
  },
  {
    id: 'intoxications',
    theme: 'sante',
    titre: 'Intoxications et pesticides',
    motsCles: [
      'intoxication',
      'pesticide',
      'pesticides',
      'mortalite brutale',
      'tapis abeilles mortes',
      'neonicotinoide',
      'empoisonnement',
      'traitement champ',
      'abeilles mortes devant ruche',
    ],
    contenu:
      "Une **intoxication** se reconnaît souvent à une **mortalité brutale et massive** : un **tapis d'abeilles mortes** devant les ruches en quelques heures/jours, abeilles parfois tremblantes, langue tirée, alors que les colonies étaient fortes.\n\nLes causes sont généralement des **traitements phytosanitaires** appliqués sur des cultures en fleurs ou par temps inadapté (insecticides, parfois en mélange avec des fongicides qui aggravent la toxicité).\n\nQue faire :\n\n- **Constater et conserver** des échantillons d'abeilles mortes (au congélateur), photographier, noter la date et l'environnement (parcelles voisines).\n- **Signaler** : il existe un dispositif national de **surveillance des troubles des abeilles** ; préviens ton **vétérinaire / agent sanitaire** et la **DDPP**, qui peuvent déclencher une enquête et des prélèvements.\n- Ne rien déplacer avant constat si une procédure est envisagée.\n\nCes signalements alimentent la pharmacovigilance et peuvent ouvrir droit à indemnisation.",
    voirAussi: ['Les maladies de la ruche', 'Quelles maladies sont à déclarer ?'],
  },
  {
    id: 'mortalites-hiver',
    theme: 'sante',
    titre: 'Comprendre les mortalités hivernales',
    motsCles: [
      'mortalite hivernale',
      'mortalite hiver',
      'colonie morte hiver',
      'perte hiver',
      'ruche vide sortie hiver',
      'effondrement colonie',
      'colonie morte',
      'pourquoi ma ruche est morte',
      // « taux de perte acceptable en sortie d'hiver » : formulation de pro qui
      // tombait en désambiguïsation contre la fiche « hivernage ».
      'sortie hiver',
      'sortie d hiver',
      'taux de perte',
      'perte acceptable',
      'pertes hivernales',
      'taux de mortalite',
    ],
    contenu:
      "Retrouver une colonie **morte en sortie d'hiver** est fréquent ; l'autopsie aide à comprendre pour corriger l'année suivante :\n\n- **Varroa mal maîtrisé** (cause n°1) : peu d'abeilles mortes dans la ruche, colonie qui a « fondu » à l'automne, parfois ailes déformées. → renforcer le suivi et le traitement.\n- **Famine** : abeilles **tête dans les alvéoles**, ruche sans réserves, parfois grappe loin du miel par grand froid. → vérifier les réserves et compléter l'automne.\n- **Reine défaillante / colonie trop faible** : trop peu d'abeilles d'hiver pour maintenir la grappe.\n- **Humidité / mauvaise ventilation** : moisissures, eau dans la ruche.\n- **Intoxication, nosémose, frelon** en amont, qui ont affaibli la colonie.\n\nNoter ces constats dans le **registre** et le module **Mortalités** d'APIGO permet d'identifier des tendances et d'ajuster sa conduite.",
    voirAussi: ['Traiter contre le varroa', "Préparer l'hivernage"],
  },

  // ─── Réglementation (compléments) ──────────────────────────────────────────
  {
    id: 'statut-fiscal',
    theme: 'reglementation',
    titre: "Statut et fiscalité de l'apiculteur",
    motsCles: [
      'siret',
      'code ape',
      'assujettissement tva',
      'franchise tva',
      'seuil tva',
      'micro ba',
      'statut apiculteur',
      'quel statut',
      'statut pour vendre',
      'msa',
      'cotisant solidaire',
      'fiscalite',
      'micro bna',
      'impots apiculture',
      'declaration revenus',
      'statut juridique',
      'vendre legalement',
      'siret apiculteur',
    ],
    contenu:
      "Le **statut** dépend surtout de la **taille du cheptel** et de l'activité commerciale.\n\n- **Loisir / petit cheptel** : la simple détention impose la **déclaration annuelle de ruches**, mais pas de statut professionnel. La vente de quelques pots reste possible dans un cadre limité.\n- **Vers le cadre agricole** : à partir d'un certain nombre de colonies, on relève de la **MSA** — d'abord comme **cotisant solidaire** (activité réduite), puis comme **exploitant agricole** au-delà du seuil d'« activité minimale d'assujettissement ».\n- **Fiscalité** : les revenus relèvent en principe des **Bénéfices Agricoles** (régime micro-BA ou réel selon le chiffre d'affaires). Un **numéro SIRET** est nécessaire pour facturer.\n\nLes **seuils** (nombre de ruches, chiffre d'affaires) et les règles évoluent : pour ta situation précise, rapproche-toi de la **MSA**, d'un **centre de gestion agréé** ou des **impôts**. APIGO tient ton comptabilité et tes ventes, mais ne remplace pas un conseil fiscal.",
    voirAussi: ['Vendre son miel', 'Déclarer ses ruches'],
  },
  {
    id: 'distances-implantation',
    theme: 'reglementation',
    titre: 'Distances et implantation des ruchers',
    motsCles: [
      'distance rucher',
      'distance ruches',
      'implantation',
      'ou installer ruches',
      'voisinage',
      'arrete prefectoral',
      'reglementation emplacement',
      'haie ruches',
      'distance voisin',
    ],
    contenu:
      "L'implantation des ruchers est encadrée pour la **sécurité du voisinage**. Les **distances minimales** par rapport aux propriétés voisines et aux voies publiques sont fixées par **arrêté préfectoral** : **elles varient d'un département à l'autre** — c'est la première chose à vérifier auprès de ton préfecture ou mairie.\n\nRègle générale : ces distances **ne s'appliquent pas** si le rucher est isolé du voisinage par un **obstacle** (mur, palissade ou **haie dense d'au moins 2 m de haut**) sur une certaine longueur, qui oblige les abeilles à prendre de la hauteur.\n\nBonnes pratiques d'emplacement, au-delà du légal :\n\n- Entrées orientées **sud/sud-est**, à l'abri du **vent dominant**.\n- **Point d'eau** à proximité.\n- Loin des **passages** (chemins, écoles), ruches légèrement **surélevées**.\n- Bonne **ressource mellifère** alentour (cf. analyse mellifère).\n\nVérifiez toujours l'**arrêté de ton département** avant d'installer.",
    voirAussi: ['Déclarer ses ruches', 'Débuter en apiculture'],
  },
  {
    id: 'apiculture-bio',
    theme: 'reglementation',
    titre: "L'apiculture biologique",
    motsCles: [
      'apiculture bio',
      'miel bio',
      'certification bio',
      'label bio',
      'cahier des charges bio',
      'conversion bio',
      'ruche bio',
      'passer en bio',
    ],
    contenu:
      "Produire du **miel biologique** suppose de respecter un **cahier des charges européen** et de se faire **certifier par un organisme agréé** (la mention « bio » est contrôlée).\n\nGrandes lignes du cahier des charges :\n\n- **Emplacements** : dans un rayon de butinage (≈ 3 km), les ressources doivent être majoritairement **sauvages ou cultivées en bio**, loin de sources de contamination importantes.\n- **Ruches** en matériaux naturels (bois), cires d'origine bio.\n- **Conduite sanitaire** : prophylaxie et produits autorisés en bio (ex. **acides organiques** comme l'oxalique/formique contre le varroa) ; les traitements de synthèse déclassent la production.\n- **Nourrissement** au miel/sucre bio, encadré et hors période de récolte.\n- **Période de conversion** avant de pouvoir étiqueter « bio ».\n\nC'est un engagement exigeant mais valorisant. Renseignez-t’auprès d'un **organisme certificateur** pour les règles à jour et la marche à suivre.",
    voirAussi: ['Traiter contre le varroa', 'Vendre son miel'],
  },

  // ─── Produits (compléments) ────────────────────────────────────────────────
  {
    id: 'recolte-pollen',
    theme: 'produits',
    titre: 'Récolter le pollen',
    motsCles: [
      'conserver pollen',
      'secher pollen',
      'pollen sec',
      'duree pollen',
      'vendre pollen',
      'recolter pollen',
      'recolte pollen',
      'trappe pollen',
      'pelotes pollen',
      'pollen frais',
      'pollen congele',
    ],
    contenu:
      "Le **pollen** est récolté à l'aide d'une **trappe à pollen** placée à l'entrée de la ruche : en passant à travers une grille, les butineuses perdent une partie de leurs **pelotes**, qui tombent dans un tiroir.\n\nBonnes pratiques :\n\n- Récolter le tiroir **chaque jour** (le pollen frais s'altère vite, attire l'humidité et les moisissures).\n- **Trier** (retirer débris et abeilles) puis **conserver** : soit **congeler** (préserve au mieux les qualités), soit **sécher** à basse température pour une conservation à sec.\n- Ne pas laisser la trappe en place en **permanence** : on prélève sur des **périodes limitées** pour ne pas pénaliser le couvain, qui a besoin de pollen (protéines).\n\nLe pollen frais est apprécié pour sa richesse nutritionnelle, mais sa conservation est délicate — d'où l'importance de la chaîne du froid.",
    voirAussi: ['Les produits de la ruche', 'Récolter la propolis'],
  },
  {
    id: 'recolte-propolis',
    theme: 'produits',
    titre: 'Récolter la propolis',
    motsCles: [
      'propolis',
      'recolter propolis',
      'recolte propolis',
      'grille propolis',
      'grille a propolis',
      'teinture propolis',
      'gratter propolis',
    ],
    contenu:
      "La **propolis** est une résine que les abeilles récoltent sur les bourgeons et utilisent pour **calfeutrer et assainir** la ruche.\n\nDeux façons de la récolter :\n\n- **Grille à propolis** : une grille souple posée sous le couvre-cadres ; les abeilles comblent ses interstices de propolis. On la retire, on la **met au congélateur** quelques heures, puis on la tord : la propolis, devenue cassante, se détache en paillettes propres.\n- **Grattage** : récupérer la propolis sur les cadres, têtes de cadres et couvre-cadres au lève-cadre (plus mélangée de cire).\n\nLa propolis se conserve bien au sec et au frais. Elle est valorisée en **teinture** (macération dans l'alcool) ou en extraits. Sa récolte ne doit pas désorganiser la colonie : on prélève raisonnablement.",
    voirAussi: ['Les produits de la ruche', 'Récupérer et travailler la cire'],
  },
  {
    id: 'travailler-cire',
    theme: 'produits',
    titre: 'Récupérer et travailler la cire',
    motsCles: [
      'cire gaufree',
      'fondation',
      'cirier',
      'acheter cire',
      'cire contaminee',
      'cadres a batir',
      'cire',
      'travailler cire',
      'recuperer cire',
      'gaufrer',
      'gaufrage',
      'cerificateur',
      'refondre cire',
      'opercules cire',
      'bougies cire',
    ],
    contenu:
      "La **cire** est produite par les jeunes ouvrières. L'apiculteur la récupère surtout des **opercules** (à l'extraction) et des **vieux cadres** réformés.\n\nÉtapes :\n\n1. **Faire fondre** la cire au **cérificateur solaire**, à la vapeur ou au bain-marie (jamais en contact direct avec une flamme : la cire est inflammable).\n2. **Filtrer** pour retirer les impuretés (cocons, propolis), puis laisser figer en pains.\n3. **Valoriser** : la cire propre peut être **gaufrée** (transformée en feuilles de cire gaufrée pour les cadres), échangée chez un cirier, ou utilisée pour des **bougies**, cosmétiques, encaustiques.\n\nLa cire **mémorise les résidus** (traitements, polluants). Pour le gaufrage, privilégiez une cire **d'opercules** (la plus propre) et un cirier sérieux : une cire contaminée se retrouverait dans tout ton cheptel.",
    voirAussi: ['Les produits de la ruche', 'Nettoyer et désinfecter le matériel'],
  },

  // ─── Saison (compléments) ──────────────────────────────────────────────────
  {
    id: 'debuter-apiculture',
    theme: 'saison',
    titre: 'Débuter en apiculture',
    motsCles: [
      'debuter',
      'debutant',
      'commencer apiculture',
      'premiere ruche',
      'se lancer',
      'par ou commencer',
      'demarrer apiculture',
      'rucher ecole',
      'devenir apiculteur',
      'apprendre apiculture',
    ],
    contenu:
      "Bien débuter en apiculture, étape par étape :\n\n1. **Se former d'abord** : rejoindre un **rucher-école** ou un apiculteur de proximité. Manipuler avec un mentor vaut tous les livres pour gérer le stress et lire une colonie.\n2. **Choisir son matériel** : un modèle de ruche répandu localement (souvent **Dadant**), une bonne **protection** et l'outillage de base.\n3. **Démarrer avec 2 colonies** plutôt qu'une : pouvoir comparer, et prélever un cadre de couvain de l'une pour secourir l'autre.\n4. **S'approvisionner au printemps** en **essaims sains** auprès d'un apiculteur sérieux (éviter les colonies d'origine douteuse).\n5. **Respecter la réglementation** : déclaration annuelle des ruches, distances d'implantation, registre.\n6. **Apprendre le rythme des saisons** : visite de printemps, surveillance de l'essaimage, pose des hausses, récolte, traitement varroa, hivernage.\n\nCommence **modestement**, observe beaucoup, note tout — APIGO est justement là pour tenir ce suivi et te rappeler les bons gestes au bon moment.",
    voirAussi: ["S'équiper pour débuter", 'Déclarer ses ruches'],
  },
  {
    id: 'curriculum-apiculture',
    theme: 'saison',
    titre: 'Apprendre l’apiculture : le parcours',
    // Expressions multi-mots (+4) pour gagner face à « debuter-apiculture » sur les
    // formulations « apprends-moi… » / « tout apprendre ».
    motsCles: [
      'apprends moi l apiculture',
      'apprendre l apiculture',
      'apprends moi l apiculture de zero',
      'enseigne moi l apiculture',
      'apprends moi a etre apiculteur',
      'tout apprendre apiculture',
      'formation apiculture',
      'parcours apprentissage',
      'me former en apiculture',
      'apprends moi tout',
    ],
    contenu:
      "**Bienvenue !** Apprendre l'apiculture, ça se fait par étapes. Voici un parcours logique — clique sur une étape pour l'approfondir :\n\n1. **Comprendre l'abeille** — la colonie, les trois castes, le cycle de vie.\n2. **S'équiper** — ruche, cadres, enfumoir, tenue : le matériel de base.\n3. **Obtenir sa première colonie** — essaim ou nucléus, au printemps, auprès d'un apiculteur sérieux.\n4. **Conduire le rucher au fil des saisons** — le calendrier apicole mois par mois.\n5. **Protéger ses colonies** — surveiller et traiter le varroa, repérer les maladies.\n6. **Récolter** — quand et comment extraire son miel.\n7. **Être en règle** — déclaration des ruches, registre d'élevage.\n\nLe meilleur accélérateur reste un **rucher-école** ou un mentor près de chez toi. Par quoi veux-tu commencer ?",
    voirAussi: [
      'Les abeilles : l’essentiel',
      "S'équiper pour débuter",
      'Débuter en apiculture',
      'Le calendrier apicole',
      'Traiter contre le varroa',
      'Quand récolter le miel',
      'Déclarer ses ruches',
    ],
  },

  // ─── Produits & comparatifs (traitements, nourrissement) ───────────────────
  {
    id: 'comparatif-varroacides',
    theme: 'produits',
    titre: 'Quel varroacide choisir ?',
    motsCles: [
      'comparatif varroacides',
      'quel varroacide',
      'quel varroacide choisir',
      'apivar ou oxalique',
      'apivar ou apistan',
      'amitraze ou oxalique',
      'difference apivar oxalique',
      'choisir un traitement varroa',
      'quel traitement varroa',
      'preconise varroa',
      'meilleur traitement varroa',
    ],
    contenu:
      "**Quel varroacide choisir ?** Ils n'agissent ni au même moment ni de la même façon. Deux règles d'or : n'utiliser que des produits avec **AMM** (autorisation de mise sur le marché) et **alterner les familles** d'une année sur l'autre pour éviter les résistances.\n\n| Produit (molécule) | Quand | Couvain | Remarques |\n|---|---|---|---|\n| **Apivar / Apitraz** (amitraze) | fin d'été, après récolte (6–10 sem.) | avec couvain OK | lanières, la référence en France ; bien les **retirer** en fin de traitement |\n| **Apistan** (fluvalinate) | idem, lanières | avec couvain OK | **résistances fréquentes** → éviter en usage répété |\n| **Acide oxalique** (dégouttement / sublimation) | **hors couvain** (souvent décembre) | sans couvain | très efficace en 1 passage bien placé ; complément idéal |\n| **Acide formique** (MAQS…) | fin d'été, températures modérées | agit **dans** le couvain | action « flash » ; sensible à la chaleur |\n| **Thymol** (Apiguard…) | fin d'été, > 15 °C | avec couvain | doux, dépend de la température |\n\nEn pratique, beaucoup d'apiculteurs font **lanières amitraze après récolte** + **acide oxalique hors couvain en hiver**. Compte toujours ta pression varroa avant/après pour vérifier l'efficacité.",
    voirAussi: ['Traiter contre le varroa', 'Compter les varroas'],
  },
  {
    id: 'apivar',
    theme: 'produits',
    titre: 'Apivar (amitraze)',
    motsCles: [
      'apivar',
      'apitraz',
      'amitraze',
      'lanieres amitraze',
      'comment utiliser apivar',
      'combien de lanieres apivar',
    ],
    contenu:
      "**Apivar** est un varroacide à base d'**amitraze**, en **lanières** à suspendre entre les cadres, au contact de la grappe. C'est le traitement de référence en France, posé **après la récolte** (fin d'été) pour **6 à 10 semaines**, même en présence de couvain. Compte environ **2 lanières par corps** de ruche, repositionne-les à mi-parcours si la grappe s'est déplacée, et surtout **retire-les à la fin** (des lanières oubliées entretiennent les résistances). Alterne d'une année sur l'autre avec une autre famille, typiquement l'acide oxalique en hiver.",
    voirAussi: ['Quel varroacide choisir ?', 'Traiter contre le varroa'],
  },
  {
    id: 'acide-oxalique',
    theme: 'produits',
    titre: 'L’acide oxalique',
    motsCles: [
      'acide oxalique',
      'oxalique',
      'degouttement',
      'sublimation',
      'oxalique hors couvain',
      'oxybee',
      'api bioxal',
      'oxalique quand',
    ],
    contenu:
      "**L'acide oxalique** est un varroacide très efficace **hors couvain**, quand la grappe hivernale n'a plus de couvain operculé (souvent **décembre**), là où le varroa est à découvert. Deux méthodes : le **dégouttement** (solution sucrée coulée entre les cadres, 1 passage) et la **sublimation** (vaporisation à froid — équipement dédié et **protection respiratoire obligatoire**). Un seul passage bien placé fait fortement chuter le varroa ; c'est le complément idéal d'un traitement lanières de fin d'été. Utilise un produit avec **AMM** et respecte scrupuleusement les doses.",
    voirAussi: ['Quel varroacide choisir ?', 'Traiter contre le varroa'],
  },
  {
    id: 'comparatif-nourrissement',
    theme: 'produits',
    titre: 'Sirop, candi ou pâte protéinée ?',
    motsCles: [
      'comparatif nourrissement',
      'sirop ou candi',
      'candi ou sirop',
      'sirop leger ou lourd',
      'difference sirop candi',
      'quel nourrissement',
      'quoi donner a mes abeilles',
      'pate proteique',
    ],
    contenu:
      "**Que donner, et quand ?**\n\n| Aliment | Quand | Pour quoi |\n|---|---|---|\n| **Sirop léger (50/50)** | printemps | **stimuler la ponte** avant la miellée |\n| **Sirop lourd (60/40+)** | fin d'été / automne | **constituer les réserves** d'hiver (à finir avant les froids) |\n| **Candi** (pâte sucrée) | fin d'hiver / dépannage | **secours** quand il fait trop froid pour du sirop |\n| **Pâte protéinée** (substitut de pollen) | fin d'hiver, disette de pollen | **soutenir le couvain** au démarrage |\n\nRègle simple : du **sirop** tant qu'il fait assez doux pour que les abeilles le stockent ; du **candi** en secours par temps froid. Ne **jamais** nourrir au sirop pendant une miellée destinée à la récolte (ça se retrouverait dans le miel).",
    voirAussi: ['Le nourrissement'],
  },
  {
    id: 'ruche-kenyane',
    theme: 'pratique',
    titre: 'La ruche kényane (KTBH)',
    motsCles: [
      'ruche kenyane',
      'kenyane',
      'ktbh',
      'ruche horizontale',
      'top bar',
      'ruche a barrettes',
      'barrettes',
    ],
    contenu:
      "La **ruche kényane** (**KTBH**, _Kenyan Top Bar Hive_) est une ruche **horizontale** : une seule caisse allongée, en tronc de pyramide inversée, où les abeilles bâtissent librement sous de simples **barrettes** (top bars), sans cadres ni cire gaufrée. Avantages : peu coûteuse et simple à construire, visites douces (on ne soulève qu'une barrette à la fois), pas de hausses à porter. Limites : rayons **fragiles** (bâtis à neuf), **récolte par pressage** (pas d'extracteur), **production de miel plus faible** et conduite différente des ruches à cadres. Confidentielle en France, où le format **Dadant** domine (échanges de cadres et achats d'essaims bien plus faciles).",
    voirAussi: ['Les types de ruches (Dadant, Langstroth, Warré)'],
  },
  {
    id: 'ruche-dadant',
    theme: 'pratique',
    titre: 'La ruche Dadant',
    motsCles: ['ruche dadant', 'dadant', 'dadant 10 cadres', 'corps dadant', 'cadre dadant'],
    contenu:
      "La **Dadant** est **la** ruche la plus répandue en France. Le principe : un **grand corps** (10 cadres, parfois 12) réservé au couvain et aux réserves de la colonie, surmonté de **hausses moins hautes** (demi-cadres) pour le miel, séparées par une **grille à reine**. Cadres de corps 42×27 cm. Avantages : polyvalente, très bien adaptée à la production de miel, matériel et essaims **faciles à trouver et à échanger** localement. C'est le choix par défaut pour **débuter** en France.",
    voirAussi: ['Les types de ruches (Dadant, Langstroth, Warré)', 'La ruche Langstroth'],
  },
  {
    id: 'ruche-langstroth',
    theme: 'pratique',
    titre: 'La ruche Langstroth',
    motsCles: ['ruche langstroth', 'langstroth', 'corps et hausses identiques'],
    contenu:
      'La **Langstroth** est la ruche **la plus répandue dans le monde** (professionnels, pays anglo-saxons). Sa particularité : **corps et hausses de même dimension**, donc des **cadres interchangeables** entre les étages — pratique pour la gestion et la **transhumance**. Corps un peu moins haut que la Dadant, ce qui donne des colonies qui montent vite. Appréciée en apiculture pastorale et pour la production intensive. En France, elle reste minoritaire face à la Dadant.',
    voirAussi: ['Les types de ruches (Dadant, Langstroth, Warré)', 'La ruche Dadant'],
  },
  {
    id: 'ruche-warre',
    theme: 'pratique',
    titre: 'La ruche Warré',
    motsCles: ['ruche warre', 'warre', 'ruche ecologique', 'conduite verticale', 'ruche populaire'],
    contenu:
      "La **Warré** est une ruche **verticale** à conduite dite « écologique », pensée par l'abbé Warré. On l'agrandit **par le bas** (on ajoute les nouveaux éléments sous la colonie, dans le sens de la construction naturelle), avec de simples **barrettes** plutôt que des cadres complets. Objectif : une conduite **plus proche du naturel**, peu interventionniste. En contrepartie, les **visites et la récolte** sont différentes (rayons bâtis à neuf, pas d'extraction classique) et la **production est plus modeste**. Séduit les amateurs recherchant une approche douce.",
    voirAussi: ['Les types de ruches (Dadant, Langstroth, Warré)', 'La ruche kényane (KTBH)'],
  },
  {
    id: 'acide-formique',
    theme: 'produits',
    titre: 'L’acide formique (MAQS…)',
    motsCles: ['acide formique', 'formique', 'maqs', 'formique couvain', 'formic pro'],
    contenu:
      "L'**acide formique** est le seul varroacide courant qui agit **à l'intérieur du couvain operculé** (là où le varroa se reproduit) — un vrai atout. On l'emploie en **fin d'été**, à des **températures modérées** (ni trop chaud ni trop froid), sous forme de bandelettes gel (**MAQS**, Formic Pro…). Action rapide, « flash », mais **sensible à la météo** : par forte chaleur, risque de pertes de couvain ou de reine. Bien lire la notice AMM et respecter les fenêtres de température. Utile en rotation avec l'amitraze et l'acide oxalique.",
    voirAussi: ['Quel varroacide choisir ?', 'Traiter contre le varroa'],
  },
  {
    id: 'apiguard',
    theme: 'produits',
    titre: 'Apiguard (thymol)',
    motsCles: ['apiguard', 'thymol', 'gel thymol', 'thymovar'],
    contenu:
      "**Apiguard** (et Thymovar) est un varroacide à base de **thymol**, une substance issue du thym. On le pose en **gel** ou en plaquettes sur le haut des cadres, en **fin d'été**, quand les températures dépassent **~15 °C** (le thymol s'évapore avec la chaleur). Traitement **doux** et bien toléré, mais dont l'efficacité **dépend fortement de la température** et qui peut faire bouder la colonie s'il fait très chaud. Bonne option en rotation, à réserver aux régions/saisons assez chaudes.",
    voirAussi: ['Quel varroacide choisir ?', 'Traiter contre le varroa'],
  },
  {
    id: 'apistan',
    theme: 'produits',
    titre: 'Apistan (fluvalinate)',
    motsCles: ['apistan', 'fluvalinate', 'lanieres fluvalinate', 'pyrethrinoide'],
    contenu:
      "**Apistan** est un varroacide en **lanières** à base de **fluvalinate** (famille des pyréthrinoïdes), posé après la récolte comme l'amitraze. **Attention** : le varroa a développé de **fortes résistances** au fluvalinate dans beaucoup de régions — son efficacité peut être très réduite. À n'utiliser qu'en **alternance** (jamais deux années de suite la même famille) et idéalement après avoir vérifié qu'il fonctionne encore chez toi. Bien retirer les lanières en fin de traitement.",
    voirAussi: ['Quel varroacide choisir ?', 'Traiter contre le varroa'],
  },
  {
    id: 'sirop-nourrissement',
    theme: 'produits',
    titre: 'Le sirop (léger et lourd)',
    motsCles: [
      'sirop',
      'sirop 50 50',
      'sirop leger',
      'sirop lourd',
      'sirop de nourrissement',
      'faire du sirop',
    ],
    contenu:
      "Le **sirop** (eau + sucre) est le nourrissement liquide de base :\n\n- **Sirop léger (50/50)** — au **printemps**, pour **stimuler la ponte** avant la miellée (imite une rentrée de nectar).\n- **Sirop lourd (60/40 ou plus)** — en **fin d'été / automne**, pour **compléter les réserves d'hiver** ; à donner assez tôt pour que les abeilles aient le temps de le sécher et de l'operculer avant les froids.\n\nOn le distribue au **nourrisseur** (couvre-cadres, cadre-partition ou nourrisseur-cadre). **Jamais de sirop pendant une miellée à récolter** : il se retrouverait dans le miel. Par grand froid, préférer le **candi**.",
    voirAussi: ['Sirop, candi ou pâte protéinée ?', 'Le nourrissement'],
  },
  {
    id: 'candi',
    theme: 'produits',
    titre: 'Le candi',
    motsCles: ['candi', 'pate de sucre', 'nourrissement hiver', 'candi hiver', 'pain de candi'],
    contenu:
      "Le **candi** est une **pâte de sucre** solide, posée directement sur le haut des cadres. C'est le nourrissement de **secours par temps froid** (fin d'hiver, dépannage) : quand il fait trop froid pour que les abeilles prennent du sirop, elles grignotent le candi au contact de la grappe. Il **complète** des réserves justes en sortie d'hiver mais ne remplace pas un bon nourrissement d'automne au sirop lourd. Évite d'en donner trop tôt à l'automne : le candi ne sert pas à constituer les grosses réserves.",
    voirAussi: ['Sirop, candi ou pâte protéinée ?', 'Le nourrissement'],
  },
  {
    id: 'pate-proteique',
    theme: 'produits',
    titre: 'La pâte protéinée (substitut de pollen)',
    motsCles: [
      'pate proteique',
      'substitut de pollen',
      'proteine abeilles',
      'candi proteine',
      'nourrissement proteine',
    ],
    contenu:
      "La **pâte protéinée** est un **substitut de pollen** (protéines + parfois pollen). Le pollen apporte les protéines qui nourrissent le **couvain** ; en cas de **disette de pollen** (fin d'hiver, démarrage précoce, zones pauvres), une pâte protéinée **soutient l'élevage du couvain** et le développement de la colonie. À réserver aux vrais manques : donnée à tort, elle peut faire **surdévelopper** une colonie avant que la nature ne suive. Le sucre (sirop/candi) apporte l'énergie ; la pâte protéinée, la matière du couvain.",
    voirAussi: ['Sirop, candi ou pâte protéinée ?', 'Le nourrissement'],
  },
  {
    id: 'enfumoir',
    theme: 'pratique',
    titre: 'L’enfumoir',
    motsCles: [
      'enfumoir',
      'fumer les abeilles',
      'combustible enfumoir',
      'allumer enfumoir',
      'fumee',
    ],
    contenu:
      "L'**enfumoir** produit une **fumée froide** qui calme la colonie le temps d'une visite : la fumée masque les phéromones d'alarme et pousse les abeilles à se gorger de miel (elles piquent moins). **Bons gestes** : quelques bouffées à l'entrée, attendre 30 s, puis ouvrir ; réenfumer doucement si les abeilles remontent. Utilise un **combustible naturel et sec** (copeaux, aiguilles de pin, foin) pour une fumée **froide** — jamais brûlante. Ne pas en abuser : trop de fumée stresse et fait courir les abeilles.",
    voirAussi: ["S'équiper pour débuter", 'La visite de printemps'],
  },
  {
    id: 'leve-cadre',
    theme: 'pratique',
    titre: 'Le lève-cadre',
    motsCles: ['leve cadre', 'outil apiculteur', 'decoller les cadres', 'grattoir'],
    contenu:
      "Le **lève-cadre** est l'outil de base de l'apiculteur : une lame métallique pour **décoller les cadres** (collés par la propolis), **gratter** les surplus de cire et de propolis, et faire levier délicatement. On le tient toujours en main pendant la visite. Modèle classique « américain » (une extrémité plate, une recourbée). Un bon geste : décoller les cadres de rive d'abord pour se ménager de la place, puis manipuler sans écraser d'abeilles.",
    voirAussi: ["S'équiper pour débuter"],
  },

  // ─── Questions fréquentes (compléments) ────────────────────────────────────
  {
    id: 'pillage',
    theme: 'pratique',
    titre: 'Le pillage entre colonies',
    motsCles: [
      'pillage',
      'piller',
      'pillent',
      'colonies se pillent',
      'vol de miel',
      'bataille entree',
      'abeilles se battent',
      // « mes abeilles se battent à l'entrée » : formulation naturelle du pillage,
      // qui tombait sinon en désambiguïsation (égalité de score).
      'battent entree',
      'se battent devant',
      'se battent a l entree',
      'combat entree',
      'bagarre entree',
      'attaque entre ruches',
    ],
    contenu:
      "Le **pillage** survient quand des abeilles d'une colonie forte viennent voler les réserves d'une colonie plus faible — fréquent en **disette** (fin d'été), après une récolte, ou si du miel est laissé à découvert.\n\nSignes : agitation et **combats devant l'entrée**, abeilles qui tournoient et cherchent les interstices, mortes au sol, colonie faible vidée en quelques jours.\n\nPour limiter le pillage :\n\n- **Réduire les entrées** des colonies faibles (portière, mousse) pour qu'elles se défendent.\n- **Ne pas nourrir en plein jour** ni laisser traîner cadres, hausses ou sirop à l'air libre.\n- Travailler **vite** et ne pas ouvrir longuement par temps de disette.\n- Égaliser les forces et réunir les colonies trop faibles.\n\nUne fois déclenché, un pillage est difficile à stopper : mieux vaut **prévenir**.",
    voirAussi: ['Réunir deux colonies', 'Le nourrissement'],
  },
  {
    id: 'reine-qualite',
    theme: 'biologie',
    titre: 'Reconnaître une bonne reine',
    motsCles: [
      'bonne reine',
      'reine de qualite',
      'reine performante',
      'savoir si reine bonne',
      'reine pond bien',
      'evaluer reine',
      'qualite de ponte',
    ],
    contenu:
      "On juge une reine surtout à **son couvain**, pas à son allure :\n\n- **Couvain compact et régulier**, en plaque, avec peu de cellules vides = ponte de qualité.\n- **Couvain en mosaïque** (trous, irrégulier) = reine vieillissante, mal fécondée, consanguine ou problème sanitaire.\n- **Tous les stades présents** (œufs, larves, couvain operculé) en saison = ponte continue.\n- Une bonne reine soutient une **population forte**, un tempérament **doux**, et une colonie peu encline à l'essaimage.\n\nLes œufs **bien centrés au fond des cellules, un par cellule** indiquent une vraie reine (par opposition aux pondeuses). En pratique, on **renouvelle** les reines tous les 1 à 2 ans pour maintenir des colonies vigoureuses.",
    voirAussi: ['Lire un cadre de couvain', 'Le remérage (changer de reine)'],
  },
  {
    id: 'marquage-reine',
    theme: 'pratique',
    titre: 'Marquer la reine',
    motsCles: [
      'marquer reine',
      'marquage reine',
      'marquage',
      'couleur reine',
      'code couleur',
      'pastille reine',
      'reperer reine',
      'annee reine',
    ],
    contenu:
      "**Marquer la reine** (une pastille de couleur sur le thorax) permet de la **repérer vite** et de connaître son **année de naissance**.\n\nLe **code couleur international** suit le dernier chiffre de l'année :\n\n- **Blanc** : années en 1 ou 6\n- **Jaune** : 2 ou 7\n- **Rouge** : 3 ou 8\n- **Vert** : 4 ou 9\n- **Bleu** : 5 ou 0\n\nOn capture délicatement la reine (pince à reine ou à la main, sans la serrer), on dépose une touche de **marqueur spécial** (type Posca) sur le thorax, et on la laisse sécher quelques secondes avant de la relâcher sur son cadre. Certains apiculteurs en profitent pour **clipper** légèrement une aile (limite l'essaimage), mais c'est débattu.",
    voirAussi: ['Le rôle de la reine', 'Le remérage (changer de reine)'],
  },
  {
    id: 'combien-miel',
    theme: 'produits',
    titre: 'Combien de miel par ruche',
    motsCles: [
      'combien de miel',
      'rendement',
      'production par ruche',
      'kilos de miel',
      'recolte moyenne',
      'combien produit une ruche',
      'quantite de miel',
    ],
    contenu:
      "La production est **très variable** : elle dépend de la région, des miellées, de la météo, de la force des colonies et de la conduite.\n\nÀ titre **indicatif**, une ruche en bonne santé produit souvent de l'ordre de **15 à 40 kg** de miel par an dans de bonnes conditions — parfois beaucoup moins une mauvaise année, parfois plus sur une grosse miellée. Les **moyennes nationales** déclarées tournent fréquemment autour de **15 à 25 kg/ruche**, avec d'énormes écarts.\n\nNe te fixe pas sur un chiffre : une colonie **forte, bien nourrie, peu parasitée et bien placée** près de bonnes ressources est le meilleur gage de récolte. APIGO suit tes récoltes ruche par ruche pour comparer tes performances d'une année sur l'autre.",
    voirAussi: ['Quand récolter le miel', 'Les plantes mellifères'],
  },
  {
    id: 'abeilles-agressives',
    theme: 'pratique',
    titre: 'Des abeilles agressives',
    motsCles: [
      'agressive',
      'agressives',
      'agressivite',
      'abeilles mechantes',
      // « piquent » retiré : toute abeille pique — le mot ne désigne pas une
      // colonie AGRESSIVE. Il vit désormais dans la fiche « piqûre d'abeille ».
      'colonie agressive',
      'colonie nerveuse',
      'pourquoi agressives',
      'abeilles nerveuses',
      'ruche qui charge',
      'abeilles qui attaquent',
    ],
    contenu:
      "Une colonie peut devenir **défensive** pour plusieurs raisons, souvent passagères :\n\n- **Météo** : temps lourd, orageux, froid, vent — on évite d'ouvrir.\n- **Miellée terminée / disette** : les abeilles sont plus sur la défensive (risque de pillage).\n- **Colonie orpheline** ou en cours de remérage.\n- **Manipulations** brusques, sans fumée, ou trop fréquentes ; odeurs (parfum, sueur, venin d'une piqûre récente).\n- **Génétique** : certaines lignées sont plus piquantes — un **remérage** avec une reine douce calme durablement la colonie.\n\nBonnes pratiques : intervenir par **beau temps en milieu de journée**, **enfumer** doucement, être **calme et lent**, bien protégé. Si l'agressivité est chronique malgré de bonnes conditions, envisagez de **changer la reine**.",
    voirAussi: ['Le remérage (changer de reine)', 'Le pillage entre colonies'],
  },
  {
    id: 'acheter-essaim',
    theme: 'pratique',
    titre: 'Acheter un essaim ou une ruche peuplée',
    motsCles: [
      'acheter essaim',
      'acheter ruche',
      'acheter colonie',
      'prix essaim',
      'ou acheter',
      'essaim sur cadres',
      'paquet d abeilles',
      'se procurer abeilles',
    ],
    contenu:
      "Pour démarrer ou s'agrandir, plusieurs options :\n\n- **Essaim sur cadres (nucléus)** : 4-6 cadres avec reine en ponte, couvain et réserves — le plus simple pour débuter, prêt à se développer. Achat au **printemps**.\n- **Essaim nu (paquet d'abeilles)** : abeilles + reine sans cadres, à enrucher — moins cher mais démarrage plus lent.\n- **Ruche complète peuplée** : colonie déjà installée.\n\nConseils : achète à un **apiculteur sérieux et proche** (abeilles adaptées à ta région), exige une **reine de l'année** marquée, et vérifie l'**état sanitaire** (couvain sain, pas de signe de loque). Méfie-toi des essaims d'origine inconnue. Pense à **déclarer** tes nouvelles colonies.",
    voirAussi: ['Débuter en apiculture', 'Récupérer et enrucher un essaim'],
  },
  {
    id: 'vivre-apiculture',
    theme: 'reglementation',
    titre: "Vivre de l'apiculture",
    motsCles: [
      'vivre de l apiculture',
      'professionnel',
      'combien de ruches pour vivre',
      'apiculteur professionnel',
      'en faire son metier',
      'devenir apiculteur pro',
      'metier apiculteur',
    ],
    contenu:
      "Devenir **apiculteur professionnel** demande un cheptel important et une vraie organisation. À titre indicatif, on considère souvent qu'il faut de l'ordre de **plusieurs centaines de ruches** (fréquemment cité : **~400 et plus**) pour en vivre à temps plein, selon la région, les productions et la commercialisation.\n\nLes revenus viennent du **miel** mais aussi de la **vente d'essaims et de reines**, des **autres produits** (pollen, propolis, cire, gelée royale), de la **pollinisation** et parfois de la transformation.\n\nC'est un métier exigeant (transhumance, charge physique, aléas climatiques et sanitaires). Beaucoup commencent **en pluriactivité**. Côté statut, on passe par la **MSA** (cotisant solidaire puis exploitant) — voir la fiche dédiée. Renseignez-t’auprès d'un **syndicat apicole** ou d'une **formation professionnelle** (BPREA apiculture).",
    voirAussi: ["Statut et fiscalité de l'apiculteur", 'Les produits de la ruche'],
  },
  {
    id: 'miel-conservation',
    theme: 'produits',
    titre: 'Conserver le miel',
    motsCles: [
      'conserver miel',
      'conservation miel',
      'perime',
      'perimer',
      'perissable',
      'le miel perime',
      'date limite miel',
      'miel se conserve',
      'garder miel',
      'miel se perime',
      'duree de vie miel',
    ],
    contenu:
      "**Le miel ne périme pas** : c'est l'un des rares aliments qui se conserve quasi indéfiniment, grâce à sa faible teneur en eau et à ses propriétés naturelles. On y appose une **DDM** (« à consommer de préférence avant »), pas une DLC : passé cette date, le miel reste consommable, son goût et ses arômes évoluent simplement.\n\nPour bien le garder :\n\n- À l'**abri de la lumière**, à température ambiante et **stable** (idéalement 14-18 °C), dans un **récipient hermétique** (le miel capte l'humidité de l'air).\n- Il **cristallise** naturellement avec le temps — ce n'est pas un défaut.\n- Évitez de le surchauffer pour le reliquéfier : **bain-marie doux (< 40 °C)**.\n\nUn miel mal récolté (trop humide, > 18-20 %) peut en revanche **fermenter** : d'où l'importance de récolter un miel **mûr et operculé**.",
    voirAussi: ['Pourquoi le miel cristallise', 'Quand récolter le miel'],
  },
  {
    id: 'eau-rucher',
    theme: 'pratique',
    titre: "L'eau au rucher",
    motsCles: [
      'eau',
      'abreuvoir',
      'point d eau',
      'abreuver',
      'boire',
      'hydratation',
      'abreuvoir abeilles',
    ],
    contenu:
      "Les abeilles ont besoin d'**eau** toute l'année : pour **diluer le miel**, nourrir le couvain et **réguler la température** de la ruche (évaporation) en été.\n\nUn **point d'eau proche** du rucher évite qu'elles aillent boire chez les voisins (piscines, abreuvoirs d'animaux) — source fréquente de conflits.\n\nUn bon abreuvoir : une **surface où se poser sans se noyer** — billes d'argile, cailloux, planche flottante, mousse ou bouchons de liège sur l'eau. Placez-le **au soleil**, à l'abri du vent, et garnissez-le tôt en saison pour que les butineuses le « mémorisent ». Renouvelez l'eau régulièrement.",
    voirAussi: ['Distances et implantation des ruchers', "Préparer l'hivernage"],
  },
  {
    id: 'pollinisation',
    theme: 'biologie',
    titre: 'La pollinisation',
    motsCles: [
      'pollinisation',
      'polliniser',
      'service de pollinisation',
      'fecondation des fleurs',
      'vergers',
      'cultures',
      'role ecologique',
    ],
    contenu:
      "En butinant, l'abeille transporte le **pollen** de fleur en fleur et assure leur **fécondation** : c'est la **pollinisation**, essentielle à la reproduction de très nombreuses plantes et à la production de fruits, légumes et graines.\n\nC'est un **service écologique et agricole** majeur : on estime qu'une grande part des cultures dépend, en tout ou partie, des insectes pollinisateurs. Des apiculteurs proposent d'ailleurs un **service de pollinisation** (location de ruches placées dans les vergers, cultures de semences, etc.), avec à la clé de meilleurs rendements pour l'agriculteur et parfois une miellée pour les colonies.\n\nProtéger les abeilles (sauvages et domestiques) — en limitant les pesticides et en préservant les ressources florales — bénéficie donc à tout l'écosystème.",
    voirAussi: ['Les plantes mellifères', 'Les produits de la ruche'],
  },

  // ─── Profondeur domaine (compléments) ──────────────────────────────────────
  {
    id: 'essaim-primaire-secondaire',
    theme: 'biologie',
    titre: 'Essaim primaire et essaims secondaires',
    motsCles: [
      'essaim primaire',
      'essaim secondaire',
      'essaims secondaires',
      'jeton',
      'reine vierge essaim',
      'plusieurs essaims',
      'cast',
    ],
    contenu:
      "Quand une colonie essaime, le **premier essaim** (dit **primaire**) part avec la **vieille reine** et environ la moitié des abeilles : c'est le plus gros.\n\nSi la colonie est très populeuse, des **essaims secondaires** (ou « jetons », « casts ») peuvent suivre quelques jours plus tard, cette fois avec une ou plusieurs **reines vierges** issues des cellules royales. Ils sont **plus petits** et plus difficiles à établir, car la reine doit encore se faire féconder.\n\nC'est pourquoi une colonie en fièvre d'essaimage peut « se vider » en plusieurs vagues. Surveiller les cellules royales et agir (place, division) évite ces départs en cascade.",
    voirAussi: ["Qu'est-ce que l'essaimage ?", "L'essaim artificiel (division)"],
  },
  {
    id: 'operculation',
    theme: 'biologie',
    titre: "L'operculation (couvain et miel)",
    motsCles: [
      'truc blanc alveoles',
      'blanc dans les alveoles',
      'c est quoi le blanc',
      'blanc dans les cellules',
      'cellules fermees blanches',
      'pourquoi cellules fermees',
      'opercule',
      'opercules',
      'operculation',
      'operculer',
      'cellules fermees',
      'couvain operculé',
      'miel operculé',
    ],
    contenu:
      "**Operculer**, c'est fermer une cellule avec une fine pellicule de cire. On distingue :\n\n- **Le couvain operculé** : les abeilles ferment la cellule quand la larve va se transformer en nymphe. Un opercule **bombé et brun mat** sur du couvain de mâle ; **affaissé ou perforé**, il alerte sur un problème sanitaire.\n- **Le miel operculé** : les abeilles ferment les alvéoles quand le miel est **mûr** (assez déshydraté). C'est **le** repère de récolte : on récolte des cadres operculés aux **¾ au moins**.\n\nL'aspect des opercules est donc une mine d'informations, sur la santé du couvain comme sur la maturité du miel.",
    voirAussi: ['Lire un cadre de couvain', 'Quand récolter le miel'],
  },
  {
    id: 'grille-a-reine',
    theme: 'pratique',
    titre: 'La grille à reine',
    motsCles: [
      'grille a reine',
      'grille reine',
      'grille a reines',
      'empecher reine de pondre',
      'reine dans la hausse',
      'separer hausse',
    ],
    contenu:
      "La **grille à reine** est une grille (métal ou plastique) dont les espaces laissent passer les **ouvrières** mais pas la **reine** (plus large). Placée **entre le corps et les hausses**, elle empêche la reine de monter pondre dans le miel : les hausses restent dédiées à la récolte.\n\nElle est pratique mais débattue : certains apiculteurs s'en passent. Si tu l'utilises, veille à ce que la colonie soit assez forte pour bien occuper les hausses (sinon elle freine la montée des abeilles), et repère bien le **sens** de pose.",
    voirAussi: ['Quand poser les hausses ?', 'Le rôle de la reine'],
  },
  {
    id: 'nourrisseur',
    theme: 'pratique',
    titre: 'Les types de nourrisseurs',
    motsCles: [
      'nourrisseur',
      'nourrisseurs',
      'nourrisseur couvre cadre',
      'nourrisseur cadre',
      'comment donner le sirop',
      'distribuer sirop',
    ],
    contenu:
      "Le **nourrisseur** sert à distribuer sirop ou candi sans provoquer de pillage. Principaux types :\n\n- **Couvre-cadre nourrisseur** : un bac posé sur les cadres, sous le toit — grande capacité, idéal pour le sirop d'automne.\n- **Nourrisseur cadre** : à la place d'un cadre, dans le corps — pratique mais réduit le volume.\n- **Nourrisseur d'entrée (Boardman)** : un bocal à l'entrée — petites quantités, à éviter en période de pillage car visible des pilleuses.\n- **Candi** : posé directement sur les têtes de cadres en hiver.\n\nDonnez de préférence **le soir**, sans en répandre, pour ne pas exciter le rucher.",
    voirAussi: ['Le nourrissement', 'Le pillage entre colonies'],
  },
  {
    id: 'partition',
    theme: 'pratique',
    titre: 'La partition',
    motsCles: [
      'partition',
      'partitionner',
      'reduire le volume',
      'isoler colonie',
      'partition isolante',
      'resserrer la colonie',
    ],
    contenu:
      "Une **partition** est une cloison (parfois isolante) placée dans le corps pour **réduire le volume** à occuper. On « resserre » ainsi une **colonie faible** ou un **essaim** sur les cadres qu'ils peuvent couvrir et chauffer, ce qui favorise leur développement.\n\nC'est utile à la sortie de l'hiver, pour les petites colonies, ou pour aider un essaim à démarrer. On **agrandit** ensuite progressivement en ajoutant des cadres au fur et à mesure que la population grandit. Les partitions isolantes améliorent aussi le confort thermique en hiver.",
    voirAussi: ["L'essaim artificiel (division)", "Préparer l'hivernage"],
  },
  {
    id: 'corps-hausses',
    theme: 'pratique',
    titre: 'Corps de ruche et hausses',
    motsCles: [
      'corps de ruche',
      'corps',
      'chambre a couvain',
      'difference corps hausse',
      'nid a couvain',
      'a quoi sert la hausse',
    ],
    contenu:
      "Une ruche s'organise en deux étages aux rôles distincts :\n\n- **Le corps** (chambre à couvain) : le « nid », où vivent la reine et le couvain, et où la colonie stocke ses réserves pour vivre et hiverner. **On n'y prélève pas le miel** (il appartient aux abeilles).\n- **Les hausses** : ajoutées au-dessus pendant les miellées, elles reçoivent le **miel de récolte**. On peut en empiler plusieurs.\n\nUne **grille à reine** entre les deux empêche la reine de pondre dans les hausses. Cette séparation est la base de la conduite pour produire du miel.",
    voirAussi: ['La grille à reine', 'Quand poser les hausses ?'],
  },
  {
    id: 'meteo-butinage',
    theme: 'saison',
    titre: 'Météo et activité des abeilles',
    motsCles: [
      'abeilles sortent pas',
      'pourquoi abeilles ne sortent pas',
      'abeilles ne volent pas',
      'peu d abeilles dehors',
      'restent dedans',
      'pas de butinage',
      'temperature butinage',
      'quand sortent les abeilles',
      'activite selon le temps',
      'froid pluie abeilles',
      'abeilles ne sortent pas',
      'a partir de quelle temperature',
    ],
    contenu:
      "L'activité des abeilles dépend fortement de la météo :\n\n- Elles commencent à **sortir** vers **10-12 °C**, et **butinent activement** plutôt à partir de **14-15 °C**, par temps calme et ensoleillé.\n- **Pluie, vent fort et froid** les confinent à la ruche.\n- En **forte chaleur**, beaucoup ventilent à l'entrée et font la « barbe ».\n\nPour **ouvrir une ruche**, on privilégie une **journée douce (> 15 °C), sans vent ni pluie**, en milieu de journée quand les butineuses sont aux champs — la colonie est alors plus calme. APIGO calcule justement un **score de visite** à partir des prévisions.",
    voirAussi: ['La visite de printemps', 'Le calendrier apicole'],
  },
  {
    id: 'vol-orientation',
    theme: 'biologie',
    titre: "Le vol d'orientation",
    motsCles: [
      'orientation',
      'retour ruche',
      'memoriser emplacement',
      'retrouver leur ruche',
      'derive',
      'se tromper de ruche',
      'mauvaise ruche',
      'confusion ruche',
      'vol d orientation',
      'vol de proprete',
      'jeunes abeilles devant la ruche',
      'abeilles tournent devant',
      'barbe abeilles',
      'pourquoi des abeilles devant',
    ],
    contenu:
      "Par beau temps, surtout en début d'après-midi, on voit parfois un **nuage d'abeilles tournoyer face à la ruche** : ce sont souvent de **jeunes abeilles** qui effectuent leur **vol d'orientation** (elles mémorisent l'emplacement avant de devenir butineuses), et qui en profitent pour un **vol de propreté** (déjections hors de la ruche).\n\nC'est **normal et bon signe** (colonie dynamique) — à ne pas confondre avec un **essaimage** (départ massif et bruyant qui s'éloigne) ou un **pillage** (combats à l'entrée). La « barbe » d'abeilles à l'entrée par forte chaleur est, elle aussi, normale (ventilation).",
    voirAussi: ["Qu'est-ce que l'essaimage ?", 'Le pillage entre colonies'],
  },
  {
    id: 'piege-essaim',
    theme: 'pratique',
    titre: 'Les pièges à essaims',
    motsCles: [
      'piege a essaim',
      'ruche piege',
      'appat essaim',
      'capturer essaim sauvage',
      'attirer un essaim',
      'amorce essaim',
    ],
    contenu:
      "Un **piège à essaims** est une caisse (ruchette) placée en hauteur pour **attirer un essaim de passage** au printemps. Les ingrédients d'un bon piège :\n\n- Un **volume** d'environ 30-40 L, propre et sec.\n- Quelques **vieux cadres bâtis** (odeur de cire attire), éventuellement un **leurre** (cire, propolis, plante à phéromone type mélisse).\n- Une **petite entrée**, à **2-4 m de haut**, à l'abri, orientée sud/sud-est.\n\nVisitez-les régulièrement en saison d'essaimage. Tout essaim capturé d'origine inconnue doit être **installé à l'écart et surveillé** (sanitaire), puis **déclaré**.",
    voirAussi: ['Récupérer et enrucher un essaim', "Qu'est-ce que l'essaimage ?"],
  },
  {
    id: 'types-miel',
    theme: 'produits',
    titre: 'Les différents miels',
    motsCles: [
      'miel acacia',
      'miel colza',
      'miel chataignier',
      'miel lavande',
      'miel tournesol',
      'conservation par variete',
      'duree de vie miel monofloral',
      'types de miel',
      'miel monofloral',
      'miel toutes fleurs',
      'miel de printemps',
      'miel polyfloral',
      'sortes de miel',
      'appellation miel',
    ],
    contenu:
      "On classe les miels selon leur **origine florale** :\n\n- **Monofloral** : issu majoritairement d'une fleur (acacia, châtaignier, lavande, tilleul, colza, tournesol…). Pour revendiquer une appellation, le miel doit provenir **principalement** de cette source, ce qui suppose de récolter au bon moment et parfois d'analyser.\n- **Polyfloral / « toutes fleurs »** : mélange de plusieurs floraisons (miel de printemps, de montagne, d'été).\n- **Miellats** (forêt, sapin) : issus non du nectar mais du miellat déposé sur les arbres.\n\nChaque miel a sa couleur, son goût et sa vitesse de cristallisation. La traçabilité (date, emplacement, lot) permet de caractériser ses récoltes — c'est l'objet du module Production d'APIGO.",
    voirAussi: ['Les plantes mellifères', 'Vendre son miel'],
  },
  {
    id: 'piqure-abeille',
    theme: 'sante',
    titre: "La piqûre d'abeille",
    motsCles: [
      'piqure',
      'piquer',
      'pique',
      'piquee',
      // « est-ce que les abeilles piquent souvent ? » : le débutant s'inquiète
      // des piqûres, pas d'une colonie agressive. « piquent » désignait à tort la
      // fiche « abeilles agressives » (toute abeille pique) — rapatrié ici.
      'piquent',
      'piquent souvent',
      'piquent beaucoup',
      'piquer souvent',
      'se faire piquer',
      'dard',
      'enlever le dard',
      'allergie piqure',
      'venin abeille',
    ],
    contenu:
      "Quand une abeille pique, son **dard** harponné reste planté avec la glande à venin, qui continue d'injecter : **retire-le vite** en le **raclant** (ongle, lève-cadre), sans le pincer (ce qui presserait le venin). Une piqûre laisse une douleur et un gonflement locaux qui s'estompent en 1-2 jours ; le **froid** soulage.\n\nLa piqûre libère aussi une **phéromone d'alarme** (odeur de banane) qui excite les autres : enfume la zone et éloigne-toi calmement.\n\nEn cas de **réaction généralisée** (urticaire étendu, gonflement du visage/gorge, gêne respiratoire, malaise), il peut s'agir d'une **réaction allergique grave** : appelle le **15 / 112** sans attendre. Les personnes allergiques connues doivent avoir leur traitement d'urgence à portée. Le Copilote informe mais ne remplace pas un avis médical.",
    voirAussi: ['Des abeilles agressives', "S'équiper pour débuter"],
  },
  {
    id: 'exces-males',
    theme: 'biologie',
    titre: 'Beaucoup de mâles dans la ruche : que comprendre',
    motsCles: [
      'plein de males',
      'beaucoup de males',
      'trop de males',
      'males en exces',
      'faux bourdons nombreux',
      'faux bourdons partout',
      'plein de faux bourdons',
      'beaucoup de faux bourdons',
      'trop de faux bourdons',
      'souci avec les males',
      'pourquoi autant de males',
    ],
    contenu:
      "Si tu vois **beaucoup de faux-bourdons** (les mâles) dans ta ruche, lis d'abord la saison avec moi — c'est elle qui donne le sens :\n\n- **Au printemps** : une colonie prospère élève naturellement beaucoup de mâles pour féconder les jeunes reines. C'est sain, mais ça va souvent de pair avec une **préparation à l'essaimage** — surveille l'apparition de cellules royales.\n- **En automne** : normalement, les mâles sont chassés. S'il en reste **beaucoup en septembre-octobre**, c'est un signe à prendre au sérieux : la colonie peut être **orpheline ou bourdonneuse** (des ouvrières pondent à la place de la reine absente, et ne donnent que des œufs non fécondés, donc des mâles).\n\n**Comment trancher** : cherche des **œufs et du jeune couvain d'ouvrières** (couvain plat et régulier). S'il n'y en a plus et que tu vois du **couvain de mâles bombé et dispersé**, c'est probablement une orpheline avancée — difficile à sauver seule, souvent on la réunit à une colonie avec reine.\n\nEn cas de doute sur l'état de la colonie, n'hésite pas à demander l'œil d'un apiculteur de proximité.",
  },
  {
    id: 'virus-ailes-deformees',
    theme: 'sante',
    titre: 'Le virus des ailes déformées (DWV)',
    motsCles: [
      'virus ailes deformees',
      'dwv',
      'ailes deformees',
      'ailes repliees',
      'ailes chiffonnees',
      'abeille qui ne vole pas',
      'virus abeille',
    ],
    contenu:
      "Le **virus des ailes déformées** (DWV) est l'un des plus courants chez l'abeille. Il se transmet surtout **par le varroa**, qui le diffuse en se nourrissant des abeilles.\n\n**Ce que tu observes** : des abeilles aux **ailes repliées, chiffonnées ou raccourcies**, incapables de voler, sur les cadres ou devant la ruche ; parfois une colonie qui se dépeuple sans cause évidente en saison chaude.\n\n**Le point clé** : le DWV est avant tout le **signal d'une pression varroa mal maîtrisée**. La priorité n'est pas de \"soigner le virus\" (il n'y a pas de traitement spécifique), mais de **renforcer le suivi et le traitement du varroa**.\n\n**Ce que je te conseille** :\n- Vérifier et améliorer ton **protocole varroa** (efficacité du produit, bon timing).\n- Mesurer la chute de varroas avant/après traitement pour confirmer qu'il fonctionne.\n- Si ça persiste malgré un traitement correct, rapproche-toi de ton **groupement sanitaire ou d'un vétérinaire**.",
  },
  {
    id: 'ascosphere',
    theme: 'sante',
    titre: "L'ascosphérose (mycose du couvain / couvain plâtré)",
    motsCles: [
      'ascosphere',
      'ascospherose',
      'mycose couvain',
      'couvain platre',
      'chalkbrood',
      'larves blanches momifiees',
      'couvain blanc',
      'champignon couvain',
    ],
    contenu:
      "L'**ascosphérose** (champignon *Ascosphaera apis*, aussi appelée \"couvain plâtré\") touche les larves, surtout par temps **humide et frais**.\n\n**Signes** : des larves mortes devenues **blanches/grises, dures et momifiées** (comme de petites craies), parfois retrouvées sur le plancher ou à l'entrée ; une légère odeur de moisi possible. C'est surtout visible **au printemps** (sortie d'hiver froide et humide) ou quand la ruche est mal ventilée.\n\n**La bonne nouvelle** : ce n'est **pas une maladie à déclaration obligatoire** et elle régresse souvent d'elle-même en été. Mais sa présence dit quelque chose : **ventilation et hygiène à revoir**.\n\n**Prévention** (il n'y a pas de traitement spécifique) :\n- Améliorer la **ventilation** de la ruche, éviter l'humidité stagnante.\n- Maintenir une **colonie forte** (les ouvrières nettoient le couvain mort).\n- **Renouveler les vieux cadres** et désinfecter le matériel.\n\nEn cas de doute sur l'aspect du couvain, garde en tête qu'un couvain affaissé/perforé d'odeur suspecte évoque plutôt une **loque** — là, on contacte un vétérinaire ou agent sanitaire.",
  },
  {
    id: 'frelon-europeen',
    theme: 'sante',
    titre: "Le frelon européen (et différence avec l'asiatique)",
    motsCles: [
      'frelon europeen',
      'vespa crabro',
      'frelon local',
      'frelon brun',
      'difference frelon',
      'gros frelon jaune',
    ],
    contenu:
      "Le **frelon européen** (*Vespa crabro*) est notre frelon \"de toujours\", bien différent du frelon asiatique invasif.\n\n**Comment le reconnaître** : il est **plus gros**, à la livrée **brun-roux et jaune**. Il chasse plutôt **isolément**, sans ce vol stationnaire massif devant l'entrée que pratique l'asiatique. Il prélève quelques abeilles surtout en fin de saison, mais **ne provoque pas le même effet de panique** ni l'effondrement des colonies.\n\n**Faut-il agir ?** En général, une **colonie forte** s'en accommode très bien. Tu peux poser un **réducteur d'entrée** si la pression est gênante. Contrairement au frelon asiatique, **détruire son nid n'est pas une obligation** et apporte peu : mieux vaut renforcer tes colonies.\n\nÀ retenir : le frelon européen n'est **pas un danger sanitaire à déclarer**. Si tu hésites entre les deux espèces, l'asiatique a un **vol stationnaire devant la ruche** et un corps plus sombre à anneau orangé — c'est lui qui demande de la vigilance.",
  },
  {
    id: 'miel-hmf-qualite',
    theme: 'produits',
    titre: "L'HMF et la qualité du miel",
    motsCles: [
      'hmf',
      'hydroxymethylfurfural',
      'miel chauffe',
      'degradation miel',
      'qualite miel',
      'miel trop chauffe',
    ],
    contenu:
      "L'**HMF** (hydroxyméthylfurfural) est une molécule qui se forme dans le miel avec **le temps et la chaleur**. Plus il y en a, plus le miel a vieilli ou a été chauffé — c'est un **marqueur de fraîcheur**.\n\n**Repère réglementaire** : la norme européenne fixe un maximum de **40 mg/kg** pour un miel frais ( chiffre à vérifier selon les textes en vigueur). Un HMF élevé trahit soit un **chauffage excessif** à l'extraction, soit un miel **ancien ou mal conservé**.\n\n**En pratique, pour le garder bas** :\n- **Ne pas surchauffer** le miel (reste sous ~40 °C).\n- Travailler **vite** et conserver **au frais** (idéalement 14-18 °C), à l'abri de la lumière.\n- Éviter les longs stockages au chaud.\n\nLa plupart des apiculteurs ne dosent pas l'HMF eux-mêmes — c'est surtout un enjeu pour la **certification** ou l'export, via un laboratoire agréé. Mais ces bons gestes suffisent à préserver la qualité de ton miel.",
  },
  {
    id: 'miel-teneur-eau',
    theme: 'produits',
    titre: 'Teneur en eau du miel et réfractomètre',
    motsCles: [
      'teneur en eau',
      'humidite miel',
      'refractometre',
      'miel humide',
      'pourcentage d eau',
      'mesurer l eau du miel',
      'miel qui fermente',
    ],
    contenu:
      "La **teneur en eau** décide de la stabilité de ton miel : trop d'eau, il **fermente** ; pas assez, il devient dur à extraire.\n\n**Les repères** : la norme tolère jusqu'à **20 % d'eau**, mais on vise plutôt **moins de 18 %** pour une bonne conservation (et en dessous de ~16-17 %, le miel est très épais). Ces valeurs sont des repères — vérifie selon ton contexte et la réglementation en vigueur.\n\n**Le réfractomètre** est l'outil pour la mesurer : quelques gouttes sur la vitre, lecture à la lumière, et il t'indique directement le **% d'eau**. Rapide et précieux pour vérifier la maturité avant de récolter.\n\n**Mes conseils** :\n- Récolter des cadres **operculés aux 3/4 au moins** (le miel est alors mûr).\n- Vérifier au réfractomètre en cas de doute.\n- **Stocker hermétiquement** : le miel reprend l'humidité de l'air.\n\nUn miel trop humide risque de **fermenter** (bulles, goût acide) — d'où l'importance de cette petite mesure toute simple.",
  },
  {
    id: 'miel-defectueux',
    theme: 'produits',
    titre: 'Reconnaître un miel défectueux',
    motsCles: [
      'miel defectueux',
      'miel mauvais',
      'miel fermente',
      'miel mousse',
      'miel acide',
      'miel trouble',
      'defaut miel',
      'miel rate',
    ],
    contenu:
      "Un bon miel est **propre, sans odeur désagréable, au goût franc**. Voici les défauts à repérer :\n\n**Fermentation** (le plus courant) : **bulles, mousse, goût acide/vinaigré**, parfois une couche liquide qui se sépare. Cause : un miel **trop humide** (> 20 % d'eau) ou mal stocké. Prévention : récolter un miel **mûr et operculé**, vérifier au réfractomètre, stocker au frais et hermétique.\n\n**Cristallisation grossière** : gros cristaux qui \"grincent\". Souvent due à une température instable ou un mauvais ensemencement. Solution : garder une température stable, ou pratiquer l'ensemencement pour un miel crémeux.\n\n**Trouble / impuretés** : souvent de la cire mal filtrée ; une bonne **filtration** et un passage au **maturateur** règlent le souci.\n\n**Goût ou odeur altérés** : chauffage excessif, miel très vieux, ou contamination par des odeurs fortes au stockage.\n\n**Pour contrôler avant de vendre** : observe l'aspect, mesure l'eau, goûte, et vérifie ta traçabilité (lot, date). Un miel cristallisé peut se reliquéfier doucement au **bain-marie sous 40 °C**.",
  },
  {
    id: 'hydromel-production',
    theme: 'produits',
    titre: "Produire de l'hydromel",
    motsCles: [
      'hydromel',
      'mead',
      'boisson au miel',
      'alcool de miel',
      'fermenter le miel en boisson',
      'faire de l hydromel',
    ],
    contenu:
      "L'**hydromel** est une boisson alcoolisée traditionnelle, à base de **miel fermenté avec de l'eau et de la levure** — une jolie façon de valoriser un miel déclassé (cristallisé, petit défaut).\n\n**Le principe** : on dilue le miel dans l'eau, on ajoute une **levure** (de vin ou spéciale hydromel), et on laisse **fermenter** plusieurs semaines à mois ; on obtient une boisson titrant souvent autour de **10-15° d'alcool** (variable). Elle gagne souvent à vieillir un peu.\n\n**Côté légal, c'est le point sensible** : produire et surtout **vendre une boisson alcoolisée** relève d'un **cadre réglementaire et fiscal strict** (déclaration d'activité, droits sur l'alcool, étiquetage). Les règles peuvent même **modifier ton statut d'apiculteur**. **Renseigne-toi impérativement en amont** auprès des **douanes / services compétents** avant d'investir ou de vendre.\n\nPour un usage personnel, c'est un beau projet d'expérimentation ; pour la vente, vérifie d'abord le cadre légal avec un professionnel.",
  },
  {
    id: 'retrait-hausses',
    theme: 'saison',
    titre: 'Retirer les hausses après la récolte',
    motsCles: [
      'retirer hausses',
      'enlever hausses',
      'enlever le miel',
      'recolter les hausses',
      'quand enlever hausses',
      // Le verbe CONJUGUÉ, tel qu'on le dicte. Sans lui, « quand est-ce que
      // j'enlève les hausses » partait sur la fiche de POSE — même objet,
      // moment inverse, et un conseil à contretemps d'une saison entière.
      'j enleve les hausses',
      'enleve les hausses',
      'enlever les hausses',
      'retire les hausses',
      'fin de miellee',
    ],
    contenu:
      "Retirer les hausses, c'est vite et proprement — pour éviter le **pillage**. C'est la **fin de la miellée** qui donne le top départ (souvent fin juillet-août selon ta région).\n\n**Quand** : dès que les abeilles ne montent plus remplir la hausse, et que les cadres sont **operculés** (signe que le miel est mûr). S'il y a plusieurs hausses, retire d'abord la plus haute (la moins peuplée).\n\n**Comment évacuer les abeilles** (au choix) :\n- **Brosse à abeilles** : on balaie doucement, cadre par cadre.\n- **Chasse-abeilles** posé sous la hausse : les abeilles descendent toutes seules en quelques heures (méthode douce).\n- Quelques **pulsions d'enfumoir** pour les faire descendre.\n\n**Anti-pillage** : travaille plutôt en **fin de journée**, ne laisse jamais une hausse pleine à l'air libre, couvre-la d'un drap, et ferme bien le corps avec le couvre-cadres. Transporte vite vers ta miellerie.\n\n**Et juste après** : c'est LE moment de **lancer le traitement varroa**, avant l'hivernage. Si une colonie est faible, tu peux lui laisser une hausse comme réserve d'hiver.",
  },
  {
    id: 'miellee-acacia',
    theme: 'saison',
    titre: "La miellée d'acacia (mai)",
    motsCles: [
      'miellee acacia',
      'acacia',
      'robinier',
      'quand fleurit l acacia',
      'miel d acacia',
      'miellee de mai',
    ],
    contenu:
      "L'**acacia** (en fait le robinier) donne l'une des plus belles miellées de l'année : **abondante et rapide**. C'est la signature de la fin du printemps.\n\n**Période** : surtout **mai** (un peu avant en année précoce, un peu après en altitude).\n\n**Signes** : les robiniers se couvrent de **grappes de fleurs blanches parfumées**, et le miel monte **très vite** en hausse — quelques jours à deux semaines.\n\n**Conduite** :\n- **Poser les hausses juste avant** la floraison, avec une **grille à reine** pour garder le miel propre.\n- **Surveiller de près** : ajoute une 2e hausse dès que la première est remplie aux 3/4.\n- Sur une colonie faible, ne force pas la hausse.\n\n**Récolte** : quand les cadres sont **bien operculés**, souvent fin mai-début juin.\n\n**Le miel d'acacia** : très **clair, fluide, doux**, et il **reste liquide longtemps** (riche en fructose). Très recherché. Repère tes robiniers dès avril pour anticiper la miellée !",
  },
  {
    id: 'miellee-chataignier',
    theme: 'saison',
    titre: 'La miellée de châtaignier (juin-juillet)',
    motsCles: [
      'miellee chataignier',
      'chataignier',
      'quand fleurit le chataignier',
      'miel de chataignier',
      'miellee de juin',
      'miellee de juillet',
    ],
    contenu:
      "Le **châtaignier** offre une miellée **puissante et durable**, souvent la principale de l'été dans les régions de châtaigneraies (Cévennes, Massif Central, Pyrénées…).\n\n**Période** : **juin-juillet** (parfois fin mai en année précoce).\n\n**Signes** : floraison de **chatons jaunâtres** à l'odeur caractéristique, pollen foncé (brun/bronze) ramené par les abeilles. La miellée dure **plusieurs semaines**, plus régulière que l'acacia.\n\n**Conduite** : pose les hausses **dès fin mai**, puis gère plus tranquillement (la montée est progressive). Idéale pour des colonies de force moyenne.\n\n**Récolte** : fin juin à juillet, sur cadres bien operculés.\n\n**Le miel de châtaignier** : **foncé, corsé, riche en minéraux**, au goût prononcé et un peu amer ; il **cristallise lentement**. C'est un miel de caractère, très apprécié des amateurs.",
  },
  {
    id: 'assurance-apicole',
    theme: 'reglementation',
    titre: "L'assurance responsabilité civile en apiculture",
    motsCles: [
      'assurance apiculture',
      'responsabilite civile',
      'assurance ruches',
      'voisin pique',
      'assurance apiculteur',
      'couverture rucher',
    ],
    contenu:
      "L'**assurance responsabilité civile** n'est **pas légalement obligatoire** pour la plupart des apiculteurs, mais elle est **vivement recommandée** dès que tu as des voisins proches ou que tu vends ton miel (les syndicats et certifications l'attendent souvent).\n\nElle couvre les **dommages causés par tes abeilles** à des tiers (piqûres ayant entraîné un accident, dégâts à une propriété). Le coût est généralement **modéré** — quelques dizaines d'euros par an selon le nombre de ruches.\n\n**Où la trouver** :\n- Auprès des **assureurs grand public** (souvent en option \"jardin / ruches\").\n- Via les **syndicats apicoles**, qui négocient des contrats de groupe avantageux.\n\nÀ déclarer à l'assureur : nombre de ruches, emplacement, proximité du voisinage. En cas de sinistre, préviens-le **rapidement**, photos et témoignages à l'appui. Les conditions varient d'un contrat à l'autre — vérifie bien les garanties.",
  },
  {
    id: 'aides-subventions',
    theme: 'reglementation',
    titre: "Aides et subventions pour l'apiculture",
    motsCles: [
      'aide apiculture',
      'subvention apiculture',
      'aide installation',
      'aides pour m installer',
      'aide pour s installer',
      'quelles aides',
      'aide equipement',
      'financement apiculture',
      'aide conversion bio',
    ],
    contenu:
      "Plusieurs **aides** existent selon ton profil et ta région — et elles **varient beaucoup**, donc le mieux est de te renseigner localement.\n\nQuelques pistes courantes :\n- **Aides à la conversion ou installation en bio** : pour passer ou démarrer en apiculture biologique.\n- **Aides jeunes agriculteurs** : primes d'installation si tu montes un projet viable (via la Chambre d'agriculture / MSA).\n- **Aides à l'équipement** (matériel, bâtiments) : souvent régionales ou départementales, et plafonnées.\n\n**Pré-requis fréquents** : un statut agricole, un projet jugé viable (nombre de ruches, chiffre d'affaires) et parfois une **formation reconnue**.\n\nChaque dossier est particulier et les dispositifs changent souvent. Pour du concret, contacte ta **Chambre d'agriculture**, ta **DDT(M)**, ou un **syndicat apicole** qui connaît les fonds accessibles près de chez toi. Mieux vaut s'y prendre **tôt** : les aides sont limitées dans le temps.",
  },
  {
    id: 'reines-importation',
    theme: 'reglementation',
    titre: 'Acheter ou importer des reines',
    motsCles: [
      'importer reines',
      'reine etrangere',
      'acheter reines',
      'reine d italie',
      'certificat sanitaire reine',
      'import reine',
    ],
    contenu:
      "Acheter des reines, c'est courant ; les **importer de l'étranger** est **encadré sanitairement**, car le risque est d'introduire des maladies ou parasites exotiques.\n\n**Mes recommandations** :\n- Achète à un **éleveur sérieux et reconnu** (jamais une provenance douteuse). Pour un import, un **document sanitaire** attestant la santé des colonies mères est attendu.\n- En cas d'import, des **démarches déclaratives** peuvent s'appliquer — renseigne-toi auprès des services vétérinaires (DDPP) avant l'arrivée.\n- À réception, **isole et surveille** les nouvelles reines/colonies quelques semaines avant de les mêler à ton cheptel.\n\nEn pratique, beaucoup d'apiculteurs préfèrent des **reines locales** (mieux adaptées à la région) ou **élèvent les leurs** — moins de risques et de paperasse. L'import se justifie surtout pour une **lignée particulière**. Les règles d'import évoluent : vérifie le cadre en vigueur avant de commander.",
  },
  {
    id: 'inspections-ddpp',
    theme: 'reglementation',
    titre: 'Contrôles sanitaires et inspections (DDPP)',
    motsCles: [
      'inspection ddpp',
      'controle sanitaire',
      'visite officielle',
      'controle ruches',
      'agent sanitaire controle',
      'non conformite ruches',
    ],
    contenu:
      "Les services vétérinaires (**DDPP**) peuvent **inspecter un rucher** pour vérifier le respect des règles sanitaires. C'est **rare** hors cas particulier, mais c'est un droit prévu par la loi.\n\n**Motifs possibles** : suspicion d'un **danger sanitaire** (loque, parasite réglementé…), un **signalement**, ou le **suivi d'un sinistre** (intoxication signalée).\n\n**Ce qu'on peut te demander** :\n- Ton **registre d'élevage** à jour (traitements, interventions, mortalités).\n- L'**état sanitaire** des colonies (aspect du couvain).\n- Ton **numéro d'apiculteur (NAPI)** et la **déclaration** de tes emplacements.\n- Pour la vente : **étiquetage et traçabilité** des lots.\n\n**Le bon réflexe** : tenir ton **registre au fil de l'eau** et jouer la transparence — un apiculteur sérieux a peu à craindre. À l'issue, un avis de conformité ou des **points à corriger** (avec un délai) peut être donné. APIGO tient justement ton registre et tes visites pour te faciliter ça.",
  },
  // ═════════════════════════════════════════════════════════════════════════
  // LES FONCTIONNALITÉS DE LA MISE À JOUR.
  //
  // La note de patch présente Maya comme le copilote de l'apiculteur. Elle ne
  // savait pourtant RIEN des nouveautés qu'elle annonce : ni balance, ni
  // passeport, ni éco-score, ni lot. Demander « c'est quoi l'éco-score ? » le
  // jour du lancement ne rendait rien.
  //
  // Ces fiches parlent du PRODUIT, pas d'apiculture générale — elles disent où
  // aller et ce que ça fait, dans les mots de l'apiculteur.
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'balance-connectee',
    theme: 'pratique',
    contexte: 'ruches',
    titre: 'Les balances connectées',
    motsCles: [
      'balance',
      'balances',
      'balance connectee',
      'peser la ruche',
      'peser mes ruches',
      'poids de la ruche',
      'suivi du poids',
      'suivre le poids',
      'pesee automatique',
      'capteur de poids',
      'ma balance',
      'brancher une balance',
      'connecter une balance',
      'alerte vol',
      'vol de ruche',
    ],
    contenu:
      "**Une balance sous la ruche pèse la colonie en continu**, et APIGO en tire ce que tu ne peux pas voir depuis chez toi.\n\n- **La miellée en direct** : le poids qui monte, c'est la récolte qui vient. Tu sais quand poser la hausse sans ouvrir.\n- **Une alerte en cas de chute brutale** — vol, chute de la ruche, essaimage. Sur tout le lot de mesures reçues, pas seulement la dernière.\n- **La récolte pré-remplie** : au moment de saisir, APIGO propose la quantité que la balance a mesurée. Tu corriges si besoin, tu valides.\n\nOn branche une balance depuis **Balances → Nouvelle balance**. L'unité de poids est apprise à la connexion : pas de réglage à faire. Les balances connectées sont disponibles à partir du plan Starter.",
  },
  {
    id: 'passeport-miel',
    theme: 'reglementation',
    titre: 'Le passeport du pot de miel',
    motsCles: [
      'passeport',
      'passeport miel',
      'qr sur le pot',
      'qr code pot',
      'histoire du pot',
      'raconter le miel',
      'etiquette qr',
      'scanner le pot',
      'client scanne',
      'tracabilite client',
    ],
    contenu:
      "**Un QR code sur le pot, et ton client lit l'histoire de son miel.** Il voit les fleurs butinées, la provenance, la période de récolte, la mise en pot, la DDM, la teneur en eau et l'éco-score du lot.\n\nLe QR se génère depuis la **fiche du lot**, dans Production → Traçabilité. Tout tient DANS le code : aucune donnée n'est stockée en ligne, la page s'ouvre sans compte, et **ça ne consomme aucun quota** — même si mille clients la scannent.\n\nÇa ne remplace pas l'étiquette réglementaire (dénomination, poids net, origine, DDM, coordonnées) : ça la complète.",
  },
  {
    id: 'eco-score-miel',
    theme: 'produits',
    titre: "L'éco-score d'un lot",
    motsCles: [
      'eco score',
      'ecoscore',
      'note environnementale',
      'score environnemental',
      'note du miel',
      'note du lot',
      'comment est calcule le score',
      'ameliorer mon score',
      'ameliorer la note',
      'note de mon miel',
      'meilleure note',
    ],
    contenu:
      "**Une note sur 100 et une lettre de A à E**, calculées à partir de ce que tu as déjà saisi sur le lot — rien à remplir en plus.\n\nCe qui compte : le **circuit court**, les **traitements doux**, un **environnement préservé**, l'absence de **nourrissement au sucre** avant la miellée, et la **distance de transhumance** parcourue par les colonies.\n\nLa note apparaît sur la fiche du lot et dans le passeport que scannent tes clients. Elle se met à jour toute seule quand tu complètes la fiche : plus tu renseignes, plus elle est juste.",
  },
  {
    id: 'tracabilite-lot',
    theme: 'reglementation',
    titre: 'Les lots et la mise en pot',
    motsCles: [
      'numero de lot',
      'mes lots',
      'mise en pot',
      'mettre en pot',
      // Conjugué, tel qu'on l'écrit vraiment — « je met » compris.
      'met en pot',
      'mets en pot',
      'conditionnement',
      'combien de pots',
      'date de durabilite',
      // « teneur en eau » n'est PAS repris ici : une fiche `miel-teneur-eau`
      // lui est déjà consacrée, et elle répond mieux. Un mot-clé recopié d'une
      // fiche à l'autre ne fait pas gagner la bonne — il fait perdre les deux.
      'hmf',
      'tracabilite du miel',
      'remonter a la ruche',
      // La question de traçabilité telle qu'on la pose : d'où vient ce pot ?
      'd ou vient un lot',
      'd ou vient ce miel',
      'origine du lot',
      'retrouver un lot',
    ],
    contenu:
      "**Un lot relie ce qu'il y a dans le pot aux ruches qui l'ont fait.** C'est ce qu'on te demandera en cas de contrôle, et c'est ce qui rassure un client.\n\nÀ la récolte, APIGO crée le lot. À la mise en pot, tu déclares le **nombre de pots**, leur **poids**, la **DDM**, et si tu les as mesurées la **teneur en eau** et le **HMF** — deux indicateurs de qualité du miel.\n\nDepuis la fiche du lot tu remontes aux récoltes, aux ruchers et aux ruches d'origine, et tu génères le QR du passeport. La traçabilité des lots est incluse à partir du plan Starter.",
  },
  {
    id: 'deplacer-en-masse',
    theme: 'pratique',
    contexte: 'ruches',
    titre: 'Déplacer plusieurs ruches en une fois',
    motsCles: [
      'deplacer mes ruches',
      'deplacer plusieurs ruches',
      'changer de rucher',
      'bouger les ruches',
      'transferer des ruches',
      'deplacement en masse',
      'deplacer un rucher',
      'changer emplacement',
    ],
    contenu:
      "**Tu sélectionnes, tu choisis la destination, tu valides.** Une ruche ou mille, c'est le même geste.\n\n- **Des ruches** changent de rucher : depuis la liste, coche celles à bouger et choisis le rucher d'arrivée. C'est de la gestion de cheptel, disponible dès que ta formule te donne plusieurs ruchers.\n- **Un rucher entier** change d'emplacement : c'est de la transhumance, à partir du plan Pro. L'emplacement reste rattaché au rucher qui l'occupe, avec le suivi des interventions qui s'y sont faites.\n\nDans les deux cas l'historique est conservé : on sait toujours d'où vient une colonie et quand elle a bougé.",
  },
];

/** Suggestions affichées quand le Copilote ne comprend pas la question */
export const SUGGESTIONS_FALLBACK = [
  'Quelles ruches dois-je visiter en priorité ?',
  'Comment traiter contre le varroa ?',
  "Qu'est-ce que l'essaimage ?",
  'Quand récolter le miel ?',
];
