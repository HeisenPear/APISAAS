// Forum COMMUNAUTAIRE — métadonnées partagées client + serveur.
//
// ⚠️ DONNÉES PURES, RIEN D'AUTRE. Aucune fonction métier, aucun import de
// serveur : c'est ce qui permet à ce fichier d'être lu des deux côtés de la
// frontière, comme `app/config/frelon.ts` et `app/config/maya-actions.ts`. La
// règle de modération, elle, vit dans `app/utils/forumModeration.ts` — mêler
// les deux ferait de ce fichier un module que le navigateur ne peut plus
// charger seul.

/**
 * L'état d'un message aux yeux de la communauté.
 *
 * ⚠️ `masque` N'EST PAS `supprime`, ET LA DISTINCTION EST TOUT LE SUJET. Un
 * masquage est AUTOMATIQUE, réversible, et déclenché par des signalements ; une
 * suppression est le geste de l'auteur ou de l'administrateur. Les confondre
 * ferait disparaître définitivement un message que trois personnes ont
 * simplement trouvé déplaisant — et rendrait l'arbitrage impossible, puisqu'il
 * n'y aurait plus rien à arbitrer.
 */
export type StatutMessageForum = 'visible' | 'masque' | 'supprime';

/** Pourquoi un lecteur signale un message. */
export type MotifAbus = 'hors_sujet' | 'insultes' | 'publicite' | 'danger_sanitaire' | 'autre';

export interface OptionForum<T extends string> {
  value: T;
  label: string;
  description?: string;
  couleur: string;
}

/**
 * Les motifs proposés au lecteur qui signale.
 *
 * ⚠️ ILS SONT PEU NOMBREUX ET CONCRETS, DÉLIBÉRÉMENT. Une liste longue fait
 * choisir « autre » par défaut, et « autre » n'apprend rien à celui qui
 * arbitrera. `danger_sanitaire` est propre à ce produit : un conseil qui
 * propage une maladie ou un traitement interdit ne relève pas de la politesse,
 * il coûte des colonies.
 */
export const MOTIFS_ABUS: readonly OptionForum<MotifAbus>[] = [
  {
    value: 'danger_sanitaire',
    label: 'Conseil dangereux pour les colonies',
    description: 'Traitement interdit, pratique qui propage une maladie',
    couleur: '#b91c1c',
  },
  {
    value: 'insultes',
    label: 'Propos insultants',
    couleur: '#c2410c',
  },
  {
    value: 'publicite',
    label: 'Publicité ou démarchage',
    couleur: '#a16207',
  },
  {
    value: 'hors_sujet',
    label: 'Hors sujet',
    couleur: '#706963',
  },
  {
    value: 'autre',
    label: 'Autre',
    description: 'Précisez en quelques mots',
    couleur: '#706963',
  },
] as const;

/**
 * Ce qu'on montre à la place d'un message masqué.
 *
 * ⚠️ ON NE LE FAIT PAS DISPARAÎTRE DU FIL. Un trou silencieux dans une
 * conversation la rend incompréhensible — les réponses qui suivent citent un
 * message que plus personne ne voit. On garde la place, on retire le contenu,
 * et on dit pourquoi.
 */
export const TEXTE_MESSAGE_MASQUE =
  'Ce message a été masqué automatiquement après plusieurs signalements. Il sera relu.';
