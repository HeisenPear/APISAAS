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
// ═══════════════════════════════════════════════════════════════════════════

export interface PatchNoteItem {
  /** Icône lucide (« i-lucide-… »). Palette 100 % chaude, jamais de vert. */
  icone: string;
  titre: string;
  texte: string;
}

export interface PatchNote {
  /** Identifiant de version. Le CHANGER re-montre l'annonce, une fois, à chacun. */
  id: string;
  /** Badge court de l'en-tête (ex. « Mise à jour »). */
  badge: string;
  titre: string;
  sousTitre: string;
  nouveautes: PatchNoteItem[];
  /** Libellé du bouton qui ferme et marque l'annonce comme vue. */
  cta: string;
  /** Mot de la fin, sous le bouton. Facultatif. */
  pied?: string;
}

export const PATCH_NOTE: PatchNote = {
  id: '2026-08-lancement-maya',
  badge: 'Mise à jour',
  titre: 'Du nouveau sur APIGO',
  sousTitre: 'La plus grosse mise à jour depuis le lancement. Voici l’essentiel.',
  nouveautes: [
    {
      icone: 'i-lucide-message-circle-heart',
      titre: 'Maya, votre copilote apicole',
      texte:
        'Posez-lui une question, elle répond ou vous dit franchement ce qui lui manque. Elle connaît les traitements par leur marque, les grandes enseignes, et enregistre vos interventions à votre place.',
    },
    {
      icone: 'i-lucide-truck',
      titre: 'Déplacer 1 ou 1 000 ruches d’un geste',
      texte:
        'Transhumance : sélectionnez, choisissez la destination, validez. Les ruchers changent d’emplacement et les ruches de rucher — en une seule fois, historique compris.',
    },
    {
      icone: 'i-lucide-map-pin',
      titre: 'Vos emplacements reliés à vos ruchers',
      texte:
        'Un emplacement de transhumance est désormais rattaché au rucher qui l’occupe, avec le suivi des interventions qui s’y sont faites.',
    },
    {
      icone: 'i-lucide-gauge',
      titre: 'Tout est déjà là quand vous ouvrez',
      texte:
        'Les pages ne se rechargent plus à chaque passage d’onglet, et rafraîchir ne vous déconnecte plus : vous retombez sur la page où vous étiez.',
    },
    {
      icone: 'i-lucide-layout-dashboard',
      titre: 'Un tableau de bord à votre main',
      texte:
        'Placez vos blocs où vous voulez, comme sur un téléphone. Nouveaux widgets, dont des raccourcis vers les pages que vous ouvrez tous les jours.',
    },
    {
      icone: 'i-lucide-list-checks',
      titre: 'Plus jamais bloqué dans un formulaire',
      texte:
        'Quand il manque quelque chose avant de pouvoir créer — une colonie, un client, un stock — APIGO vous dit quoi, pourquoi, et vous y emmène.',
    },
  ],
  cta: 'Découvrir',
  pied: 'Maya se présentera la première fois que vous la solliciterez.',
};
