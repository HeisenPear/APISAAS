import type { PlanFeatures } from '~/config/plans';

/**
 * LE CONTENU DES GUIDES — écrit UNE FOIS, lu par la page ET par la visite guidée.
 *
 * ⚠️ CE FICHIER EXISTE PARCE QUE CINQUANTE-SEPT EXPLICATIONS DORMAIENT DANS DES
 * GABARITS. Chaque `Guide*.vue` portait son propre `<ol>` de phases rédigées —
 * six pour la production, sept pour l'élevage, cinq pour le pilotage… — pendant
 * que les visites guidées de `tutorials.ts` en comptaient vingt-trois en tout,
 * écrites séparément. Deux textes pour la même chose, condamnés à diverger, et
 * une visite guidée bien plus pauvre que la documentation d'à côté.
 *
 * Le contenu vit donc ici, en DONNÉES : la page de guide le rend, et les tours
 * en dérivent leurs étapes. Une phrase écrite une fois, lue aux deux endroits.
 *
 * ⚠️ AUCUNE FONCTION, AUCUN IMPORT DE SERVEUR — c'est ce qui permet à ce fichier
 * de traverser la frontière client/serveur, comme `plans.ts` ou `navigation.ts`.
 */

export interface PhaseGuide {
  /** Stable : il sert d'identifiant d'étape dans les tours. */
  id: string;
  titre: string;
  corps: string;
  /**
   * Le MODULE que cette phase décrit. Absent = pédagogie pure (une notion, pas
   * un écran) : la phase reste dans la page de guide et ne devient pas une
   * étape de visite guidée — on ne surligne pas un concept.
   */
  route?: string;
  /**
   * L'ancre à surligner, DÉRIVÉE de la route.
   *
   * ⚠️ ELLE N'EST POSÉE NULLE PART À LA MAIN. `UiSidebarLink` la calcule pour
   * chaque entrée de `NAV_SECTIONS` : tout module devient adressable le jour où
   * il est ajouté, et un module retiré emporte son ancre — ce que le banc des
   * ancres mortes dit alors immédiatement.
   */
  ancre?: string;
  /**
   * Fonctionnalité de plan que la phase décrit. La visite guidée SAUTE l'étape
   * quand la formule ne l'inclut pas : montrer un module verrouillé au milieu
   * d'une visite, c'est vendre au lieu d'expliquer.
   */
  feature?: keyof PlanFeatures;
}

/** Les thèmes, tels que `app/pages/guide.vue` les déclare. */
export type ThemeGuide =
  | 'premiers-pas'
  | 'pilotage'
  | 'ruchers-ruches'
  | 'interventions'
  | 'production'
  | 'finances'
  | 'transhumance'
  | 'elevage'
  | 'conformite'
  | 'equipe';

export const PHASES_PAR_THEME: Record<ThemeGuide, PhaseGuide[]> = {
  conformite: [
    {
      id: 'declaration-napi',
      titre: 'Déclaration NAPI',
      corps:
        'Conformité → Déclaration NAPI. APIGO prépare automatiquement votre déclaration annuelle de cheptel à partir de vos ruches et emplacements enregistrés — ruches de production, ruchettes, nuclei — et génère le CERFA pré-rempli.',
      route: '/declarations/napi',
      ancre: 'nav-item-declarations-napi',
    },
    {
      id: 'ordonnances-veterinaires',
      titre: 'Ordonnances & vétérinaires',
      corps:
        "Stockez vos ordonnances (médicament, posologie, ruches concernées), avec le délai d'attente avant récolte calculé automatiquement, et gardez vos vétérinaires référents à portée de main.",
      route: '/conformite/ordonnances',
      ancre: 'nav-item-conformite-ordonnances',
    },
    {
      id: 'registre-des-mortalites',
      titre: 'Registre des mortalités',
      corps:
        'Déclarez chaque perte de colonies : date, cause suspectée (varroa, famine, pesticides, maladie…), rucher, et si une déclaration TRACES ou assurance a été faite. APIGO calcule votre taux de perte annuel, les causes principales et la tendance saisonnière.',
      route: '/conformite/mortalites',
      ancre: 'nav-item-conformite-mortalites',
    },
    {
      id: 'registre-d-elevage',
      titre: "Registre d'élevage",
      corps:
        "Exports → Registre d'élevage. Générez le PDF réglementaire avec toutes vos interventions sanitaires (traitements, mortalités, visites) sur la période de votre choix.",
      route: '/exports',
      ancre: 'nav-item-exports',
    },
    {
      id: 'visites-sanitaires',
      titre: 'Visites sanitaires',
      corps:
        "Planifiez et enregistrez vos visites sanitaires annuelles (observations, recommandations, rapport). Les rappels sont automatiques pour ne jamais dépasser l'échéance.",
      route: '/conformite/visites-sanitaires',
      ancre: 'nav-item-conformite-visites-sanitaires',
    },
    {
      id: 'suivre-votre-cotisation-gds',
      titre: 'Suivre votre cotisation GDS',
      corps:
        "Renseignez votre département GDS/GDSA et l'année de cotisation à jour dans Paramètres — un indicateur simple pour ne pas oublier le renouvellement annuel.",
    },
  ],
  elevage: [
    {
      id: 'creer-une-lignee',
      titre: 'Créer une lignée',
      corps:
        "Élevage → Lignées → Nouvelle lignée. Renseignez l'origine, la race (noire, buckfast, carnica…) et les caractéristiques génétiques recherchées. Une lignée regroupe toutes les reines qui en descendent.",
      route: '/elevage/lignees',
      ancre: 'nav-item-elevage-lignees',
    },
    {
      id: 'greffer-en-lot',
      titre: 'Greffer en lot',
      corps:
        "Élevage → Greffage → Nouvelle session. Choisissez la ruche donneuse (souvent la reine mère), les ruches receveuses (récepteurs) et le nombre de cupules — tout le lot en une seule saisie, avec le taux d'acceptation calculé automatiquement.",
      route: '/elevage/greffage',
      ancre: 'nav-item-elevage-greffage',
    },
    {
      id: 'suivre-chaque-receptrice',
      titre: 'Suivre chaque réceptrice',
      corps:
        "Pour chaque ruchette receveuse d'une session, notez si la cellule a été acceptée et quelle reine en est née — la filiation mère/fille se construit automatiquement, sans ressaisie.",
      route: '/elevage/greffage',
      ancre: 'nav-item-elevage-greffage',
    },
    {
      id: 'suivre-la-genealogie',
      titre: 'Suivre la généalogie',
      corps:
        "Chaque fiche reine affiche son arbre généalogique visuel — ascendants et descendantes — pour tracer l'origine de vos meilleures lignées sur plusieurs générations.",
      route: '/elevage/lignees',
      ancre: 'nav-item-elevage-lignees',
    },
    {
      id: 'enregistrer-des-tests-de-performance',
      titre: 'Enregistrer des tests de performance',
      corps:
        "Une fois par saison et par reine, notez douceur, productivité, tenue de cadre, hygiénisme (test PIN), résistance varroa, tendance à l'essaimage, hivernage et qualité de ponte — chaque test affine un peu plus l'index de sélection.",
      route: '/elevage/reines',
      ancre: 'nav-item-elevage-reines',
    },
    {
      id: 'selection-genetique-avancee-expert',
      titre: 'Sélection génétique avancée · Expert',
      corps:
        'Un index composite sur 9 critères classe vos reines, avec un benchmark anonymisé face aux autres apiculteurs de la communauté — vous savez exactement quelles lignées vaut la peine de reproduire, et lesquelles remplacer.',
      route: '/elevage/reines',
      ancre: 'nav-item-elevage-reines',
      feature: 'selectionAvancee',
    },
    {
      id: 'vendre-vos-reines',
      titre: 'Vendre vos reines',
      corps:
        "Une vente de reine reste liée à sa fiche généalogique — votre client garde la traçabilité complète du pedigree qu'il achète, un vrai argument commercial pour un éleveur sérieux.",
      route: '/clients',
      ancre: 'nav-item-clients',
    },
  ],
  equipe: [
    {
      id: 'inviter-un-collaborateur',
      titre: 'Inviter un collaborateur',
      corps:
        'Paramètres → Équipe → « Inviter un membre ». Saisissez son email et choisissez un rôle : il reçoit une invitation par email.',
      route: '/parametres/equipe',
      ancre: 'equipe-invite',
      feature: 'multiUsers',
    },
    {
      id: 'il-rejoint-l-exploitation',
      titre: "Il rejoint l'exploitation",
      corps:
        "Depuis Paramètres → Équipe, votre collaborateur accepte l'invitation — même s'il est en plan Découverte. Il bascule alors dans votre espace et retrouve vos ruchers, ruches et données, avec un bandeau qui le rappelle en permanence.",
    },
    {
      id: 'choisir-le-bon-role',
      titre: 'Choisir le bon rôle',
      corps:
        "Administrateur et Apiculteur ont un accès complet (rucher + commerce). Avec le plan Expert, 3 rôles à accès limité s'ajoutent : Technicien (rucher, interventions et stocks — aucun accès à la facturation ou aux finances), Comptable (facturation et finances — le rucher reste en lecture seule) et Lecture seule (consultation uniquement, aucune modification possible). De quoi donner accès sans donner tous les droits.",
      route: '/parametres/equipe',
      ancre: 'equipe-membres',
      feature: 'multiUsers',
    },
    {
      id: 'faire-evoluer-un-role',
      titre: 'Faire évoluer un rôle',
      corps:
        "Changez le rôle d'un membre à tout moment depuis la liste de l'équipe — utile quand un technicien saisonnier devient permanent, ou qu'un salarié gagne en responsabilités. L'effet est immédiat, sans réinviter la personne.",
    },
    {
      id: 'gerer-les-sieges',
      titre: 'Gérer les sièges',
      corps:
        "Pro inclut 3 collaborateurs, Expert jusqu'à 10. Le compteur de sièges s'affiche sur la page Équipe ; retirez un membre à tout moment pour libérer un siège — ses données restent, seul son accès est révoqué.",
      route: '/parametres/equipe',
      ancre: 'equipe-membres',
      feature: 'multiUsers',
    },
  ],
  finances: [
    {
      id: 'creez-un-client',
      titre: 'Créez un client',
      corps:
        "Clients → Nouveau client. Renseignez les coordonnées, et le SIREN si professionnel (obligatoire pour la facturation électronique 2026). L'adresse de livraison peut différer de l'adresse de facturation.",
      route: '/clients',
      ancre: 'nav-item-clients',
    },
    {
      id: 'emettez-une-facture',
      titre: 'Émettez une facture',
      corps:
        'Finances → Ventes → Nouvelle vente. Ajoutez les lignes depuis votre stock ou en saisie libre, la TVA est calculée (ou la mention franchise en base si vous en bénéficiez), et vous téléchargez un PDF conforme (numérotation automatique + Factur-X 2026).',
      route: '/finances',
      ancre: 'nav-item-finances',
    },
    {
      id: 'groupez-vos-bons-de-livraison',
      titre: 'Groupez vos bons de livraison',
      corps:
        "Finances → Bons de livraison. Livrez au fil de l'eau, puis regroupez plusieurs BL d'un même client en une seule facture — pratique pour un revendeur livré chaque semaine et facturé une fois par mois. L'historique reste consultable sur sa fiche.",
      route: '/finances/bons-livraison',
      ancre: 'nav-item-finances-bons-livraison',
    },
    {
      id: 'suivez-les-paiements-pro',
      titre: 'Suivez les paiements · Pro',
      corps:
        'Finances → Paiements & relances. Importez votre relevé bancaire (CSV/OFX) : les factures réglées se pointent toutes seules par rapprochement automatique, et vous relancez les impayés en un clic depuis la liste.',
      route: '/finances/reglements',
      ancre: 'nav-item-finances-reglements',
      feature: 'suiviReglements',
    },
    {
      id: 'pilotez-votre-tresorerie-pro',
      titre: 'Pilotez votre trésorerie · Pro',
      corps:
        "Finances → Prévisionnel. Projetez votre solde sur 12 mois à partir de vos ventes et achats réels, de la saisonnalité de votre historique, plus les dépenses et investissements que vous planifiez à la main. Anticipez les creux de saison avant qu'ils n'arrivent.",
      route: '/finances/tresorerie',
      ancre: 'nav-item-finances-tresorerie',
      feature: 'previsionnelTresorerie',
    },
    {
      id: 'exportez-pour-le-comptable',
      titre: 'Exportez pour le comptable',
      corps:
        "Finances → Rapports. CSV de vos transactions et bilan annuel PDF : tout ce qu'il faut transmettre à votre comptable, sans le faire à sa place.",
      route: '/exports',
      ancre: 'nav-item-exports',
    },
  ],
  interventions: [
    {
      id: 'creer-une-intervention',
      titre: 'Créer une intervention',
      corps:
        'Interventions → Nouvelle. Sélectionnez la ruche, le type (visite, traitement varroa, nourrissement, division, essaimage, récolte, événement sanitaire…) et la date. Treize types couvrent la quasi-totalité de votre activité.',
      route: '/interventions',
      ancre: 'nav-item-interventions',
    },
    {
      id: 'remplir-le-formulaire-adapte',
      titre: 'Remplir le formulaire adapté',
      corps:
        "Selon le type, des champs spécifiques s'affichent : état de la reine, score population, produit et numéro de lot utilisé, poids pesé, comptage varroa (méthode plancher ou VPH)… Chaque intervention alimente ensuite le registre d'élevage automatiquement.",
    },
    {
      id: 'interventions-groupees',
      titre: 'Interventions groupées',
      corps:
        'Appliquez la même action sur plusieurs ruches en une seule saisie via Interventions → Groupée — idéal pour un traitement varroa de rucher entier ou une visite de routine sur 15 ruches en quelques clics.',
      route: '/interventions',
      ancre: 'nav-item-interventions',
    },
    {
      id: 'utiliser-des-modeles',
      titre: 'Utiliser des modèles',
      corps:
        "Sauvegardez une configuration d'intervention fréquente (type + champs pré-remplis) comme modèle réutilisable — pratique pour un traitement récurrent que vous appliquez chaque saison de la même façon.",
    },
    {
      id: 'planifier-a-l-avance',
      titre: "Planifier à l'avance",
      corps:
        'Créez des interventions futures pour le calendrier — un traitement à poser dans 3 semaines, une visite de contrôle programmée. APIGO vous enverra un rappel la veille, et Ma tournée les intègre automatiquement le jour venu.',
      route: '/calendrier',
      ancre: 'nav-item-calendrier',
    },
    {
      id: 'consulter-l-historique',
      titre: "Consulter l'historique",
      corps:
        "Toutes vos interventions apparaissent triées par date, filtrables par type, rucher ou période. C'est votre registre de terrain complet — exportable pour vos obligations de traçabilité.",
      route: '/interventions',
      ancre: 'nav-item-interventions',
    },
  ],
  pilotage: [
    {
      id: 'tableau-de-bord',
      titre: 'Tableau de bord',
      corps:
        "Ruches actives, alertes critiques et activité récente en temps réel dès la connexion. Le score de santé global du cheptel (0-100) résume l'état de vos colonies à partir de vos derniers contrôles.",
      route: '/dashboard',
      ancre: 'nav-item-dashboard',
    },
    {
      id: 'alertes',
      titre: 'Alertes',
      corps:
        'Toutes vos alertes centralisées (traitements dus, hausses pleines, échéances réglementaires, stock bas…) avec un niveau de priorité. Réglez vos préférences par catégorie dans Paramètres → Notifications pour ne recevoir que ce qui compte.',
      route: '/alertes',
      ancre: 'nav-item-alertes',
    },
    {
      id: 'ma-tournee-pro',
      titre: 'Ma tournée · Pro',
      corps:
        "APIGO optimise l'ordre de vos visites du jour selon vos ruchers et les interventions à faire, pour minimiser les trajets. Cochez chaque visite au fur et à mesure : la tournée se met à jour en direct.",
      route: '/tournee',
      ancre: 'nav-item-tournee',
      feature: 'tourneeOptimisee',
    },
    {
      id: 'calendrier',
      titre: 'Calendrier',
      corps:
        'Toutes vos interventions planifiées et vos rendez-vous professionnels au même endroit. Synchronisez-le avec votre agenda personnel via un lien iCal (Paramètres → Calendrier) pour le retrouver sur votre téléphone.',
      route: '/calendrier',
      ancre: 'nav-item-calendrier',
    },
    {
      id: 'meteo',
      titre: 'Météo',
      corps:
        'Prévisions locales pour chacun de vos ruchers (Open-Meteo), avec des alertes automatiques avant les épisodes de gel, forte chaleur ou vent violent qui peuvent justifier une intervention préventive.',
      route: '/meteo',
      ancre: 'nav-item-meteo',
    },
  ],
  'premiers-pas': [
    {
      id: 'creez-votre-premier-rucher',
      titre: 'Créez votre premier rucher',
      corps:
        "Ruchers → Nouveau rucher. Renseignez le nom, la commune et la position GPS (bouton « Me géolocaliser » ou clic sur la carte). L'environnement (forêt, culture, mixte) affine la météo locale et les suggestions de floraisons.",
      route: '/ruchers',
      ancre: 'nav-item-ruchers',
    },
    {
      id: 'ajoutez-vos-ruches',
      titre: 'Ajoutez vos ruches',
      corps:
        "Depuis la fiche du rucher, ajoutez vos ruches une à une ou par lot (pratique pour un grand cheptel). Choisissez le type (Dadant, Langstroth, Warré…) et une couleur pour les repérer d'un coup d'œil sur le terrain.",
      route: '/ruches',
      ancre: 'nav-item-ruches',
    },
    {
      id: 'enregistrez-votre-premiere-intervention',
      titre: 'Enregistrez votre première intervention',
      corps:
        'Interventions → Nouvelle. Choisissez la ruche, le type (visite, traitement, nourrissement, récolte… plus de 14 disponibles) et notez vos observations. Sur le terrain, le mode simplifié accélère la saisie au smartphone.',
      route: '/interventions',
      ancre: 'nav-item-interventions',
    },
    {
      id: 'suivez-recoltes-et-ventes',
      titre: 'Suivez récoltes et ventes',
      corps:
        "Une récolte enregistrée alimente automatiquement votre stock de miel ; une vente débite ce même stock et met à jour votre chiffre d'affaires. Une seule saisie, tout le reste se met à jour tout seul.",
      route: '/production',
      ancre: 'nav-item-production',
    },
    {
      id: 'consultez-le-tableau-de-bord',
      titre: 'Consultez le tableau de bord',
      corps:
        'Le dashboard résume votre activité : ruches actives, alertes en cours, score de santé du cheptel, production de la saison et météo de vos ruchers — tout en un écran, mis à jour en temps réel.',
      route: '/dashboard',
      ancre: 'nav-item-dashboard',
    },
  ],
  production: [
    {
      id: 'enregistrer-une-recolte',
      titre: 'Enregistrer une récolte',
      corps:
        'Production → Nouvelle récolte. Saisissez le poids, le type de miel (mono-floral ou toutes fleurs) et les ruches concernées. Une pesée via balance connectée peut être importée directement.',
      route: '/production',
      ancre: 'nav-item-production',
    },
    {
      id: 'mise-en-pot-lots',
      titre: 'Mise en pot & lots',
      corps:
        "Une récolte se transforme en stock de miel prêt à la vente : numéro de lot, date d'extraction, conditionnement (pot 250g/500g/1kg, vrac) et analyses éventuelles. Le numéro de lot suit le produit jusqu'à la facture client.",
      route: '/production',
      ancre: 'nav-item-production',
    },
    {
      id: 'tracabilite-des-lots',
      titre: 'Traçabilité des lots',
      corps:
        'Chaque lot est conforme CE 178/2002 — cahier de miellerie numérique prêt pour un contrôle : origine (ruches et rucher), dates, quantités, et destination (clients ayant reçu ce lot).',
      route: '/production',
      ancre: 'nav-item-production',
    },
    {
      id: 'suivre-les-hausses',
      titre: 'Suivre les hausses',
      corps:
        'Chaque hausse a sa fiche détaillée : pose, retrait, durée sur la ruche et historique complet — module Hausses. Sachez toujours combien de hausses sont posées, disponibles ou hors service.',
      route: '/hausses',
      ancre: 'nav-item-hausses',
    },
    {
      id: 'livrer-vos-clients',
      titre: 'Livrer vos clients',
      corps:
        "Groupez plusieurs bons de livraison d'un même client en une seule facture depuis Finances → Bons de livraison — l'historique complet reste visible sur sa fiche, avec la traçabilité des lots livrés.",
      route: '/finances/bons-livraison',
      ancre: 'nav-item-finances-bons-livraison',
    },
    {
      id: 'consulter-les-statistiques',
      titre: 'Consulter les statistiques',
      corps:
        "Le tableau de bord affiche votre production par rucher, par type de miel et par période, avec l'évolution N/N-1 et la corrélation avec la météo de la saison — pour repérer vos meilleurs emplacements.",
      route: '/dashboard',
      ancre: 'nav-item-dashboard',
    },
  ],
  'ruchers-ruches': [
    {
      id: 'creer-un-rucher',
      titre: 'Créer un rucher',
      corps:
        "Ruchers → Nouveau rucher. Renseignez l'environnement (forêt, culture, mixte) pour la météo locale et les suggestions de floraisons — indiquez aussi si le terrain vous appartient ou fait l'objet d'un accord avec un propriétaire.",
      route: '/ruchers',
      ancre: 'nav-item-ruchers',
    },
    {
      id: 'ajouter-des-ruches',
      titre: 'Ajouter des ruches',
      corps:
        "Depuis la fiche rucher, ajoutez vos ruches une à une ou par lot (pratique pour numéroter 10-20 ruches d'un coup). Choisissez le type (Dadant, Langstroth, Warré, Kenyane…) et le statut (active, hivernage, en réserve).",
      route: '/ruches',
      ancre: 'nav-item-ruches',
    },
    {
      id: 'consulter-la-fiche-ruche',
      titre: 'Consulter la fiche ruche',
      corps:
        'Timeline complète, hausses posées, statut de la reine (couleur, année, qualité de ponte), historique de renouvellement des cadres (cire) et score prédictif de santé à 30 jours (Pro) — tout au même endroit.',
      route: '/ruches',
      ancre: 'nav-item-ruches',
    },
    {
      id: 'scanner-le-qr-code-sur-le-terrain',
      titre: 'Scanner le QR code sur le terrain',
      corps:
        'Chaque ruche a son QR code, imprimable depuis sa fiche. Un scan ouvre directement les actions rapides — intervention, pesée, note — sans chercher dans les menus, gants aux mains.',
    },
    {
      id: 'basculer-en-vue-carte',
      titre: 'Basculer en vue carte',
      corps:
        'Visualisez tous vos ruchers sur OpenStreetMap : distances entre eux, zones de butinage qui se chevauchent, et accès rapide à chaque fiche depuis le marqueur. Utile pour planifier une tournée ou une transhumance.',
      route: '/transhumance/carte',
      ancre: 'nav-item-transhumance-carte',
    },
    {
      id: 'surveiller-le-frelon-asiatique',
      titre: 'Surveiller le frelon asiatique',
      corps:
        "Module Surveillance frelon : signalez un nid ou une observation près d'un rucher (photo, localisation, espèce), et consultez les signalements de la communauté autour de vous, validés par votes.",
      route: '/frelon',
      ancre: 'nav-item-frelon',
    },
  ],
  transhumance: [
    {
      id: 'creer-un-emplacement',
      titre: 'Créer un emplacement',
      corps:
        "Transhumance → Emplacements → Nouvel emplacement. Ajoutez les coordonnées GPS, la capacité max de ruches, les floraisons locales et si besoin les coordonnées du propriétaire du terrain et l'accord signé.",
      route: '/transhumance/emplacements',
      ancre: 'nav-item-transhumance-emplacements',
    },
    {
      id: 'planifier-un-deplacement',
      titre: 'Planifier un déplacement',
      corps:
        "Transhumance → Nouveau plan. Sélectionnez le rucher source, l'emplacement cible, les dates de départ et de retour prévues, et le nombre de ruches concernées.",
      route: '/transhumance',
      ancre: 'nav-item-transhumance',
    },
    {
      id: 'suivre-le-plan',
      titre: 'Suivre le plan',
      corps:
        "Changez le statut du plan (planifié → en cours → réalisé) et notez la production obtenue, la durée du trajet et le coût carburant — de quoi comparer la rentabilité réelle de chaque emplacement d'une année sur l'autre.",
      route: '/transhumance',
      ancre: 'nav-item-transhumance',
    },
    {
      id: 'explorer-la-carte-mellifere',
      titre: 'Explorer la carte mellifère',
      corps:
        "Transhumance → Carte mellifère. Calques d'occupation du sol (RPG, BD Forêt) et suggestions de floraisons pour repérer les meilleurs emplacements avant de déplacer un rucher — un clic sur la carte donne l'altitude, la commune et l'analyse du point.",
      route: '/floraisons',
      ancre: 'nav-item-floraisons',
    },
    {
      id: 'declarer-votre-cheptel',
      titre: 'Déclarer votre cheptel',
      corps:
        "Chaque emplacement utilisé dans l'année alimente votre déclaration NAPI annuelle (Conformité → Déclaration NAPI) — plus besoin de reconstituer la liste de vos sites à la main en fin d'année.",
      route: '/declarations/napi',
      ancre: 'nav-item-declarations-napi',
    },
  ],
};

/** Les phases d'un thème, ou une liste vide si le thème est inconnu. */
export function phasesDuTheme(theme: string): PhaseGuide[] {
  return PHASES_PAR_THEME[theme as ThemeGuide] ?? [];
}
