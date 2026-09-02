// ═══════════════════════════════════════════════════════════════════════════
// LE CATALOGUE DES ACTIONS DE MAYA — UNE SEULE TABLE, DES DONNÉES PURES.
//
// ⚠️ CE FICHIER NAÎT D'UN COMPTE : AJOUTER UNE ACTION DEMANDAIT DE TOUCHER
// SEIZE REGISTRES DANS SIX FICHIERS, ET HUIT PASSAIENT EN SILENCE.
//
//   copilote-actions.ts   ActionId · union Ecriture · ACTIONS_AUTO ·
//                         switch annulerAction · switch previsualiserAction ·
//                         switch executerAction
//   copilote-gating.ts    ROUTE_EQUIVALENTE
//   copilote-local.ts     DOMAINE_ECRITURE · ordre de parse des clauses ·
//                         ordre de détection mono-action
//   copilote-executeur.ts executerEtapeTx · annulerRessourceTx
//   copilote.post.ts      actionIdEnum · ACTION_DOMAIN · signature de runExecute
//   useCopilote.ts        le miroir client de ActionId
//
// TypeScript n'en attrapait que six — les `switch` exhaustifs et deux
// `Record<…>`. Les huit autres se taisaient, et DEUX ÉTAIENT DES TROUS DE
// SÉCURITÉ :
//
//   · `ROUTE_EQUIVALENTE` définissait son propre type de clés
//     (`keyof typeof`). Oublier d'y inscrire une action ne produisait AUCUNE
//     erreur : l'action devenait simplement NON GATÉE. Une écriture nouvelle
//     échappait au plan d'abonnement, en silence, et la page tarifs restait
//     exacte pendant que le produit la démentait.
//   · Le balayage RBAC « rôles × actions » itérait sur une liste RECOPIÉE dans
//     le banc. Une action nouvelle passait donc au vert sans avoir jamais été
//     testée — et si son domaine était mal déclaré (terrain au lieu de
//     commerce), rien ne tombait.
//
// Ce fichier est la source unique. Il ne contient AUCUN comportement — pas une
// fonction, pas un import de serveur : c'est ce qui lui permet d'être lu par le
// navigateur comme par Nitro, et donc de supprimer le miroir client.
// ═══════════════════════════════════════════════════════════════════════════

import type { DomaineEcriture } from '~/config/roles';

/**
 * Comment Maya décide d'exécuter sans demander.
 *
 *   'jamais'      — confirmation explicite, toujours (le sensible : argent,
 *                   stock, tiers).
 *   'si-annulable'— exécution directe si, ET SEULEMENT SI, ce qui est écrit
 *                   sait se défaire entièrement. C'est le cas de
 *                   l'intervention, dont la moitié des TYPES écrivent dans des
 *                   tables satellites qu'on ne sait pas retirer.
 *
 * ⚠️ IL N'Y A PAS DE `'toujours'`, ET C'EST VOULU. L'autonomie se justifie par
 * une seule promesse — « ce que j'écris seule, tu peux le défaire d'un clic ».
 * Une valeur qui s'en dispenserait ferait mentir le bouton « Annuler ».
 */
export type RegleAutonomie = 'jamais' | 'si-annulable';

export interface ActionMaya {
  /** Ce que Maya en dit à l'apiculteur. Jamais l'identifiant technique. */
  readonly libelle: string;
  /** Domaine RBAC : un technicien n'écrit pas dans le commerce, et l'inverse. */
  readonly domaine: DomaineEcriture;
  /**
   * La route dont cette action est l'équivalent dicté. Sa porte de plan
   * (`ROUTE_GATES`) devient celle de Maya — la règle n'est jamais redéclarée.
   *
   * `null` est une DÉCLARATION, pas un oubli : l'action porte ses propres
   * portes ailleurs. Le champ est obligatoire, donc on ne peut plus laisser une
   * action non gatée par distraction — il faut écrire `null` et dire pourquoi.
   */
  readonly route: string | null;
  /** Voir `RegleAutonomie`. */
  readonly autonomie: RegleAutonomie;
  /**
   * L'action écrit-elle vraiment aujourd'hui ? `false` = squelette déclaré mais
   * non branché. Séparer « déclarée » de « écrit » empêche qu'un squelette
   * entre dans le journal d'annulation, où il produirait un no-op silencieux
   * compté comme une suppression réussie.
   */
  readonly ecrit: boolean;
}

/**
 * ⚠️ L'ORDRE COMPTE : il est celui de la DÉTECTION. Les analyseurs sont
 * essayés dans cet ordre, du plus spécifique au plus permissif, parce que
 * `analyserIntervention` accepte presque n'importe quelle phrase. La placer
 * ailleurs qu'en dernier ferait passer « ajoute le client Dupont » pour une
 * intervention.
 */
export const MAYA_ACTIONS = {
  client: {
    libelle: 'un nouveau client',
    domaine: 'commerce',
    route: 'POST /api/clients',
    autonomie: 'jamais',
    ecrit: true,
  },
  recolte: {
    libelle: 'une récolte',
    domaine: 'terrain',
    route: 'POST /api/production/recoltes',
    autonomie: 'jamais',
    ecrit: true,
  },
  stock: {
    libelle: 'un mouvement de stock',
    domaine: 'terrain',
    route: 'POST /api/stocks',
    autonomie: 'jamais',
    ecrit: true,
  },
  achat: {
    libelle: 'une dépense',
    domaine: 'commerce',
    route: 'POST /api/finances/achats',
    autonomie: 'jamais',
    /**
     * ⚠️ SYMÉTRIQUE DE LA VENTE, SAUF SUR UN POINT : elle s'écrit **payée**,
     * pas en brouillon. Les quatre lectures de charges du produit excluent les
     * brouillons — une dépense en brouillon serait « notée » et invisible du
     * tableau de bord, de la trésorerie et des deux pages d'analyse. La vente,
     * elle, part en brouillon parce que son numéro appartient à une séquence
     * légale continue ; une dépense n'a pas ce numéro à protéger, c'est le
     * fournisseur qui émet le document.
     */
    ecrit: true,
  },
  vente: {
    libelle: 'une vente',
    domaine: 'commerce',
    route: 'POST /api/finances/ventes',
    autonomie: 'jamais',
    /**
     * ⚠️ CE DRAPEAU A ÉTÉ MON GARDE-FOU, ET C'EST LE BUT DE CETTE TABLE.
     *
     * `ActionCreatrice` se DÉRIVE de `ecrit: true`. Tant que la vente était un
     * squelette, écrire `cree: { actionId: 'vente' }` dans le code d'insertion
     * ne compilait tout simplement pas : le type refusait qu'on prétende créer
     * quelque chose que le catalogue déclare inerte. Le compilateur a donc
     * exigé que la déclaration et le comportement changent ENSEMBLE — au lieu
     * de laisser une action écrire sans entrer au journal d'annulation.
     *
     * Maya n'écrit que des BROUILLONS de facture : un brouillon ne reçoit pas
     * de numéro (art. 242 nonies A CGI), donc l'annulation ne troue aucune
     * séquence légale, et le brouillon n'entre pas dans le chiffre d'affaires
     * tant que l'apiculteur ne l'a pas émis.
     */
    ecrit: true,
  },
  intervention: {
    libelle: 'une intervention',
    domaine: 'terrain',
    // `null` ASSUMÉ : l'intervention ne passe pas par une route unique. Son
    // gating vit dans `dispatchHandler`, par catégorie (`recolte` → production,
    // `reine` → moduleReine) plus le plafond de cheptel sur `division`.
    route: null,
    autonomie: 'si-annulable',
    ecrit: true,
  },
} as const satisfies Record<string, ActionMaya>;

/** L'identifiant d'une écriture de Maya — DÉRIVÉ, jamais réécrit. */
export type ActionId = keyof typeof MAYA_ACTIONS;

/** Les actions qui écrivent vraiment, donc qui peuvent entrer dans un undo. */
export type ActionCreatrice = {
  [K in ActionId]: (typeof MAYA_ACTIONS)[K]['ecrit'] extends true ? K : never;
}[ActionId];

/** Toutes les actions, dans l'ordre de détection. */
export const ACTIONS_IDS = Object.keys(MAYA_ACTIONS) as ActionId[];

/** Le domaine RBAC de chaque action — dérivé du catalogue. */
export const ACTION_DOMAINE = Object.fromEntries(
  ACTIONS_IDS.map((id) => [id, MAYA_ACTIONS[id].domaine]),
) as Record<ActionId, DomaineEcriture>;
