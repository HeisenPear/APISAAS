// ═══════════════════════════════════════════════════════════════════════════
// LES QUATRE ÉCRANS D'APIGO — le catalogue de l'acte « En images ».
//
// Données PURES : aucune fonction, aucun import de serveur, aucun composant.
// C'est ce qui lui permet d'être lu par la scène épinglée, par un renvoi depuis
// la page d'accueil, et par un banc, sans que personne n'ait à recopier la liste.
//
// ⚠️ LE CHAMP QUI COMPTE EST `maya`, ET IL EST OBLIGATOIRE.
//
// Cet acte vit dans /maya, la page du copilote. La tentation — celle qui a
// produit neuf affirmations fausses sur la page d'accueil — est de laisser
// entendre que Maya fait tout ce que la page montre. Elle ne le fait pas :
//
//   · elle LIT les balances (`server/utils/copilote-local.ts`, intention
//     `balances` → `getBalances` puis `etatsBalances`) et les alertes de vol ou
//     d'essaimage ont des seuils nommés (`server/utils/balances/alertes.ts`) ;
//   · elle ÉCRIT les interventions (`app/config/maya-actions.ts`, action
//     `intervention`, la seule qui s'exécute en autonomie parce qu'elle sait se
//     défaire entièrement) ;
//   · elle ne touche NI aux factures — l'action `vente` est déclarée `ecrit:
//     false`, c'est un squelette — NI à la traçabilité, où elle n'a aucune
//     action ni aucune lecture.
//
// Rendre ce champ obligatoire, `false` compris, est le même garde-fou que la
// route obligatoire de `maya-actions.ts` : un écran ajouté sans que quelqu'un
// ait tranché la question ne peut pas se glisser du bon côté par défaut.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que Maya fait de cet écran — jamais implicite. */
export interface EcranApigo {
  /** Sur-titre de l'acte : ce que Maya en dit, ou le constat qu'elle s'en tient à l'écart. */
  surtitre: string;
  titre: string;
  texte: string;
  /** Trois points vérifiables, pas trois adjectifs. */
  points: readonly [string, string, string];
  /**
   * Maya intervient-elle sur cet écran ? `true` = elle parle à la première
   * personne et porte sa marque ; `false` = l'écran se présente seul, et la
   * page le DIT au lieu de laisser croire.
   */
  maya: boolean;
  /** Icône de repli quand Maya n'est pas de la partie (elle a sa marque). */
  icone: string;
  /** Où l'on va pour en savoir plus. Aucun écran ne doit être une impasse. */
  lien: { to: string; texte: string };
}

export const ECRANS_APIGO = {
  balances: {
    surtitre: 'Ça, je le lis.',
    titre: 'Le poids de vos ruches, en direct',
    texte:
      'La balance envoie son poids, je le lis avec le reste. Une miellée qui démarre, une chute brutale, un poids qui tombe vers zéro la nuit : chacun a son seuil, et chacun a un nom.',
    points: [
      'Courbe de poids en continu',
      'Vol et essaimage : des seuils nommés',
      'À la récolte, le poids lu vous est proposé',
    ],
    maya: true,
    icone: 'i-lucide-scale',
    lien: { to: '/fonctionnalites', texte: 'Les balances en détail' },
  },

  maya: {
    surtitre: 'Ça, je l’écris.',
    titre: 'Dictez la visite, elle est notée',
    texte:
      'Au rucher, une main sur le cadre et l’autre sur le téléphone : vous dictez, je remplis le formulaire et je vous montre ce que j’ai compris. Rien ne part sans votre accord — sauf ce qui sait se défaire entièrement.',
    points: [
      'Dictée au doigt · « Salut Maya » en option',
      'Aperçu avant écriture, toujours',
      'Annulable pendant 24 heures',
    ],
    maya: true,
    icone: 'i-lucide-message-circle-heart',
    lien: { to: '/fonctionnalites', texte: 'Toutes les fonctionnalités' },
  },

  facturation: {
    surtitre: 'Ça, je n’y touche pas.',
    titre: 'Des factures conformes, sans module en plus',
    texte:
      'Factur-X 2026 — le PDF et le XML dans le même fichier —, numérotation légale et mentions obligatoires. C’est de la comptabilité : elle se fait sans moi, et c’est très bien ainsi.',
    points: ['Factur-X dès Starter', 'Numérotation conforme', 'Aucun module en plus'],
    maya: false,
    icone: 'i-lucide-file-text',
    lien: { to: '/tarifs', texte: 'Voir les plans' },
  },

  tracabilite: {
    surtitre: 'Ça non plus.',
    titre: 'La traçabilité qui rassure vos clients',
    texte:
      'Chaque lot raconte son histoire : origine, fleurs butinées, teneur en eau, éco-score. Le client scanne le pot et découvre tout. Là encore, je ne fais que regarder.',
    points: ['Traçabilité CE 178/2002', 'Éco-score par lot', 'Passeport miel à scanner'],
    maya: false,
    icone: 'i-lucide-badge-check',
    lien: { to: '/fonctionnalites', texte: 'La traçabilité en détail' },
  },
} as const satisfies Record<string, EcranApigo>;

export type EcranId = keyof typeof ECRANS_APIGO;

/**
 * L'ORDRE DE L'ACTE, et il porte le propos : on commence par les deux écrans où
 * Maya travaille, on finit par les deux où elle s'efface. Un visiteur qui
 * traverse l'acte dans cet ordre comprend seul où elle s'arrête — sans qu'aucune
 * phrase n'ait à le lui dire.
 */
export const ORDRE_ECRANS = ['balances', 'maya', 'facturation', 'tracabilite'] as const;
