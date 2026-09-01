/**
 * PORTE DE REJEU — revoir, à la demande, une animation qui ne se montre
 * QU'UNE FOIS.
 *
 * Trois séquences du produit s'auto-effacent après leur première lecture :
 * le film d'onboarding, la présentation de Maya et les notes de patch. C'est
 * exactement ce qu'il faut pour l'apiculteur, et exactement ce qui empêche
 * l'équipe de les relire pendant qu'on les peaufine — la seule manière de les
 * revoir était de vider le stockage du navigateur à la main, ce qui emportait
 * aussi les préférences de présence de Maya et le brouillon d'onboarding.
 *
 * `/onboarding?rejouer` existait déjà pour le film. Cette table généralise le
 * même geste aux deux autres, avec la MÊME mécanique — plutôt que trois
 * paramètres d'URL qui divergeraient (cf. CLAUDE.md § « Dériver, jamais
 * recopier »).
 *
 *   /onboarding?rejouer            → le film d'ouverture
 *   /dashboard?rejouer=maya        → la présentation de Maya
 *   /dashboard?rejouer=patch       → les notes de patch
 *   /dashboard?rejouer=tout        → tout ce que la page sait rejouer
 *   /dashboard?rejouer             → idem (valeur vide = tout)
 *
 * DEUX PROPRIÉTÉS NON NÉGOCIABLES :
 *
 * 1. RÉSERVÉE À L'ÉQUIPE (`isAdmin`, cf. `NUXT_ADMIN_EMAILS`). Un client qui
 *    tomberait sur un de ces liens ne doit pas se voir resservir une annonce
 *    qu'il a déjà lue et fermée.
 *
 * 2. SANS ÉCRITURE. Tant que la porte est ouverte, `marquerVu()` /
 *    `marquerVue()` ne gravent RIEN : relire une séquence est une observation,
 *    pas un événement de compte. Sans ça, un membre de l'équipe qui n'a pas
 *    encore vu l'annonce se la ferait consommer par sa propre relecture, et
 *    ne pourrait plus vérifier ce que vit un apiculteur au premier passage.
 *    C'est la transposition du mode `apercu` de `onboarding.vue`, qui existe
 *    parce que revoir l'intro depuis son propre compte y créait un second
 *    rucher.
 */

/** Les séquences rejouables. La valeur de `?rejouer=` est l'un de ces noms. */
export const REJEUX = ['onboarding', 'maya', 'patch'] as const;
export type Rejeu = (typeof REJEUX)[number];

/** Valeurs de `?rejouer=` qui ouvrent TOUTES les portes à la fois. */
const PASSE_PARTOUT = ['', 'tout'];

/**
 * La porte de `quoi` est-elle ouverte ?
 *
 * L'URL est lue sur `window.location` et non sur `useRoute()` : cette fonction
 * est appelée depuis des endroits qui ne sont PAS un `setup()` — le plugin qui
 * hydrate le magasin de Maya, un `setTimeout` de la fenêtre des notes — et
 * `useRoute()` y dépendrait du contexte Nuxt (cf. `composableHorsSetup.test.ts`,
 * qui documente pourquoi ce singleton client ne se mérite pas). Le routeur de
 * Vue pose l'URL via `pushState` AVANT de monter la page, donc
 * `window.location.search` est déjà à jour à la navigation interne.
 *
 * Reste `useAuthStore()`, qui n'a pas d'équivalent hors magasin : il est ceint
 * d'un `try` et la porte échoue FERMÉE. Devant une porte qu'on ne sait pas
 * mesurer, on refuse.
 */
export function porteDeRejeuOuverte(quoi: Rejeu): boolean {
  if (!import.meta.client) return false; // au rendu serveur, aucune porte
  try {
    if (!useAuthStore().isAdmin) return false;
    const demande = new URLSearchParams(window.location.search).get('rejouer');
    if (demande === null) return false;
    return demande === quoi || PASSE_PARTOUT.includes(demande);
  } catch {
    return false; // magasin absent, URL illisible → porte fermée
  }
}
