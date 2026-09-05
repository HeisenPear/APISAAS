/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UN APPEL D'API QUI NE FAIT PAS EXPLOSER LE VÉRIFICATEUR DE TYPES.
 *
 * ⚠️ CE FICHIER EXISTE À CAUSE D'UN PLAFOND, PAS D'UNE PRÉFÉRENCE DE STYLE.
 *
 * Nitro type `$fetch` et `useFetch` en résolvant le chemin LITTÉRAL contre
 * l'union de TOUTES les routes du projet. Cette résolution
 * (`TypedInternalResponse`, `PickFrom`, `KeysOf`) s'épaissit à chaque route
 * ajoutée — et ce dépôt en a assez pour être arrivé à la limite de profondeur
 * d'instanciation de TypeScript.
 *
 * MESURÉ, PAS SUPPOSÉ. Sur un dépôt à zéro erreur, l'ajout d'UNE SEULE route —
 * `export default defineEventHandler(() => ({ ok: true }))`, une ligne, aucune
 * logique — faisait passer `npm run typecheck` à **92 erreurs**. Et 90 d'entre
 * elles étaient des `implicit any` dans des fichiers SANS AUCUN RAPPORT
 * (`BalanceReglages.vue`, `admin/analytics.vue`, `tournee.vue`) : quand
 * TypeScript renonce sur un TS2589, il rend `any` en cascade. Le symptôme ne
 * désigne jamais la cause, et on peut passer une journée à corriger des
 * annotations qui n'ont rien fait de mal.
 *
 * ─── CE QUE ÇA CHANGE, ET CE QUE ÇA COÛTE ──────────────────────────────────
 * On abandonne UNE chose : la vérification que le chemin correspond à une
 * route existante, et l'inférence automatique de son type de réponse. En
 * échange, le type de retour est DONNÉ explicitement — donc toujours vérifié
 * chez l'appelant — et la profondeur d'instanciation redevient constante,
 * quelle que soit la taille du projet.
 *
 * ⚠️ CE N'EST PAS À GÉNÉRALISER AVEUGLÉMENT. `useFetch` reste le bon outil
 * partout où il passe : il apporte le SSR, la déduplication et le typage du
 * chemin. On bascule ICI, site par site, quand un appel touche le plafond —
 * et le commentaire du site doit dire lequel.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Le même appel que `$fetch`, mais dont le chemin n'est pas résolu contre
 * l'union des routes. Le type de la réponse est celui qu'on annonce.
 */
export function appelApi<T>(url: string, options?: Record<string, unknown>): Promise<T> {
  return ($fetch as unknown as (u: string, o?: Record<string, unknown>) => Promise<T>)(
    url,
    options,
  );
}
