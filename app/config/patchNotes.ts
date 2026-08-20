// ═══════════════════════════════════════════════════════════════════════════
// NOTE DE PATCH ÉPHÉMÈRE — annonce des nouveautés à la première connexion qui
// suit une mise à jour, puis PLUS JAMAIS (une seule fois par apiculteur).
//
// Pour annoncer une nouvelle version : changer `id` (toute valeur différente de
// la précédente re-déclenche l'annonce pour TOUS les comptes déjà à jour) et
// réécrire le contenu ci-dessous. Rien d'autre à toucher — le composant et la
// persistance suivent automatiquement.
//
// RÈGLE D'ÉCRITURE : on n'annonce que ce qui EXISTE, et on le dit du point de
// vue de l'apiculteur (ce qu'il gagne), jamais du point de vue du code. Chaque
// ligne ci-dessous correspond à une fonctionnalité réellement livrée dans cette
// version — pas une intention, pas un « bientôt ».
//
// `texte` est la promesse, lisible seule. `details` est ce qu'on découvre en
// dépliant la ligne : du concret, pas une paraphrase du titre. Une entrée sans
// `details` ne se déplie pas — c'est permis, mieux vaut rien qu'un remplissage.
// ═══════════════════════════════════════════════════════════════════════════

export interface PatchNoteItem {
  /** Icône lucide (« i-lucide-… »). Palette 100 % chaude, jamais de vert. */
  icone: string;
  titre: string;
  texte: string;
  /** Détail affiché au dépliage. Absent = ligne non dépliable. */
  details?: string[];
}

/**
 * Le bloc discret de fin de liste. Ce qui a été durci, réparé ou rendu
 * accessible : ça ne se « vend » pas, mais le taire serait se priver d'une
 * raison de faire confiance. Présenté replié, en retrait du reste.
 */
export interface PatchNoteSecurite {
  titre: string;
  texte: string;
  details: string[];
}

export interface PatchNote {
  /** Identifiant de version. Le CHANGER re-montre l'annonce, une fois, à chacun. */
  id: string;
  /** Badge court de l'en-tête (ex. « Mise à jour »). */
  badge: string;
  titre: string;
  sousTitre: string;
  nouveautes: PatchNoteItem[];
  securite?: PatchNoteSecurite;
  /** Libellé du bouton qui ferme et marque l'annonce comme vue. */
  cta: string;
  /** Mot de la fin, sous le bouton. Facultatif. */
  pied?: string;
}

export const PATCH_NOTE: PatchNote = {
  id: '2026-08-lancement-maya',
  badge: 'Mise à jour',
  titre: 'Du nouveau sur APIGO',
  sousTitre: 'La plus grosse mise à jour depuis le lancement. Touchez une ligne pour le détail.',
  nouveautes: [
    {
      icone: 'i-lucide-message-circle-heart',
      titre: 'Maya, votre copilote apicole',
      texte:
        'Posez-lui une question, elle répond ou vous dit franchement ce qui lui manque. Elle enregistre vos interventions à votre place.',
      details: [
        'Elle connaît 71 fonctionnalités du logiciel et sait vous y emmener.',
        'Les traitements par leur marque — Apivar, Apiguard, MAQS — et les grandes enseignes apicoles.',
        'Dictez votre visite : elle en fait une intervention, même si vous donnez les informations dans le désordre.',
        'Elle agit en masse : « note une visite sur toutes mes ruches du Chêne », et vous propose d’annuler d’un geste.',
        'Elle ne fait jamais ce que votre rôle ne permet pas, et ne touche à rien sans vous montrer d’abord.',
      ],
    },
    {
      icone: 'i-lucide-truck',
      titre: 'Déplacer 1 ou 1 000 ruches d’un geste',
      texte:
        'Transhumance : sélectionnez, choisissez la destination, validez. En une seule fois, historique compris.',
      details: [
        'Les ruchers changent d’emplacement et les ruches de rucher, dans la même opération.',
        'Chaque déplacement est tracé — vous retrouvez qui est allé où, et quand.',
        'Un emplacement de transhumance est rattaché au rucher qui l’occupe, avec les interventions qui s’y sont faites.',
      ],
    },
    {
      icone: 'i-lucide-scale',
      titre: 'Vos balances vous préviennent',
      texte:
        'Branchez une balance connectée : APIGO lit les pesées et vous alerte quand quelque chose se passe.',
      details: [
        'Démarrage de miellée, essaimage probable, chute brutale qui ressemble à un vol.',
        'Les alertes partent en notification, pas seulement dans l’application.',
        'Import par fichier CSV si votre balance ne parle pas à internet.',
      ],
    },
    {
      icone: 'i-lucide-qr-code',
      titre: 'L’histoire de chaque pot, par QR code',
      texte:
        'Un QR code sur votre étiquette ouvre une page publique qui raconte d’où vient ce miel.',
      details: [
        'Rucher, floraison, date de récolte, taux d’humidité, éco-score.',
        'La page se lit sans compte et sans connexion à votre espace : elle ne consomme aucun quota.',
        'Un autre QR, côté rucher : visez une ruche avec l’appareil photo, sa fiche s’ouvre seule.',
      ],
    },
    {
      icone: 'i-lucide-layout-dashboard',
      titre: 'Un tableau de bord à votre main',
      texte: 'Placez vos blocs où vous voulez, comme sur l’écran d’accueil d’un téléphone.',
      details: [
        '28 widgets : cheptel, production, finances, élevage, transhumance, stocks.',
        'Placement libre en 2D — au doigt sur mobile, à la souris sur ordinateur, avec aperçu pendant le déplacement.',
        'Des raccourcis vers les pages que vous ouvrez tous les jours.',
      ],
    },
    {
      icone: 'i-lucide-file-text',
      titre: 'La banque et la facturation, en moins de gestes',
      texte:
        'Importez un relevé bancaire en PDF : APIGO en tire les écritures et les rapproche de vos factures.',
      details: [
        'Les trois mises en page de relevé les plus courantes sont reconnues.',
        'Facturation électronique 2026 : vos factures sortent au format Factur-X.',
        'Bons de livraison, remises, achats multi-lignes, écritures récurrentes.',
      ],
    },
    {
      icone: 'i-lucide-send',
      titre: 'Relancer vos clients au bon moment',
      texte: 'Des campagnes de fin de récolte, envoyées seulement aux clients concernés.',
      details: [
        'Segmentation par ce qu’ils ont déjà acheté.',
        'Lien de désinscription qui désinscrit vraiment — et un client désinscrit ne reçoit plus rien.',
      ],
    },
    {
      icone: 'i-lucide-smartphone',
      titre: 'Le mobile repensé pour le rucher',
      texte:
        'Un menu sombre, un bouton central qui donne accès à Maya et à la création en un geste.',
      details: [
        'Les petits blocs du tableau de bord se placent deux par deux au lieu de s’empiler.',
        'Vue grille des ruches pour repérer une colonie d’un coup d’œil.',
        'La carte mellifère devient lisible sur un écran de téléphone.',
        'Installation en application depuis le navigateur, et consultation hors connexion.',
      ],
    },
    {
      icone: 'i-lucide-list-checks',
      titre: 'Plus jamais bloqué dans un formulaire',
      texte:
        'Quand il manque quelque chose avant de pouvoir créer, APIGO vous dit quoi, pourquoi, et vous y emmène.',
      details: [
        'Une colonie, un client, un stock : le prérequis est nommé et le bouton vous y conduit.',
        'Quand une limite de votre formule est atteinte, la formule qui la lève est nommée — jamais un mur sans issue.',
      ],
    },
    {
      icone: 'i-lucide-download',
      titre: 'Vos données vous appartiennent',
      texte:
        'Téléchargez tout ce que le logiciel sait de vous, en un fichier, depuis les réglages.',
      details: [
        'Réglages → Données → Mes données. Gratuit, quelle que soit votre formule.',
        'Ruchers, ruches, interventions, récoltes, sanitaire, finances, balances : 49 tables.',
        'Les rares éléments volontairement exclus sont listés dans le fichier lui-même, avec leur raison.',
      ],
    },
  ],
  securite: {
    titre: 'Sous le capot',
    texte: 'Ce qui ne se voit pas, et qui a aussi été fait.',
    details: [
      'Les droits de chaque rôle ont été revérifiés sur l’ensemble des routes de l’application, une par une.',
      'Un abonnement en échec de paiement ne conserve plus sa formule complète indéfiniment.',
      'Neuf pages de votre espace privé étaient servies en fichier statique : elles ne le sont plus.',
      'Les boutons sans libellé sont désormais annoncés correctement aux lecteurs d’écran, et « réduire les animations » est enfin respecté partout.',
      'Une panne serveur affiche une erreur avec un bouton « réessayer », au lieu de faire croire que vous n’avez rien.',
      '1 408 vérifications automatiques tournent à chaque modification du logiciel.',
    ],
  },
  cta: 'Faire connaissance avec Maya',
  pied: 'Vous pourrez la mettre en pause à tout moment depuis les réglages.',
};
