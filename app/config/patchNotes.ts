// ═══════════════════════════════════════════════════════════════════════════
// NOTE DE PATCH ÉPHÉMÈRE — annonce des nouveautés à la première connexion qui
// suit une mise à jour, puis PLUS JAMAIS (une seule fois par apiculteur).
//
// Pour annoncer une nouvelle version : changer `id` (toute valeur différente de
// la précédente re-déclenche l'annonce pour TOUS les comptes déjà à jour) et
// réécrire le contenu ci-dessous. Rien d'autre à toucher — le composant et la
// persistance suivent automatiquement.
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
}

export const PATCH_NOTE: PatchNote = {
  id: '2026-07-grande-maj',
  badge: 'Mise à jour',
  titre: 'Du nouveau sur APIGO',
  sousTitre: 'La plus grosse mise à jour depuis le lancement. Voici l’essentiel.',
  nouveautes: [
    {
      icone: 'i-lucide-message-circle-heart',
      titre: 'Maya, votre copilote apicole',
      texte:
        'Elle comprend mieux vos questions, vous propose le bon geste au bon moment et enregistre vos interventions à votre place.',
    },
    {
      icone: 'i-lucide-scale',
      titre: 'Balances connectées',
      texte:
        'Suivez le poids de vos ruches en direct. Votre récolte se pré-remplit avec ce que la balance a mesuré.',
    },
    {
      icone: 'i-lucide-rocket',
      titre: 'Une prise en main repensée',
      texte: 'Un démarrage guidé, pas à pas, pour être opérationnel en quelques minutes.',
    },
    {
      icone: 'i-lucide-bell-ring',
      titre: 'Des alertes plus justes',
      texte:
        'Météo, essaimage, sanitaire : vous êtes prévenu au bon moment, par e-mail et notification.',
    },
    {
      icone: 'i-lucide-layout-dashboard',
      titre: 'Un tableau de bord plus clair',
      texte: 'Vos priorités du jour en tête, l’essentiel d’un coup d’œil.',
    },
  ],
  cta: 'Découvrir',
};
