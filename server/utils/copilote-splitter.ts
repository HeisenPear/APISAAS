import { normaliser } from '~~/server/utils/copilote-local';

/**
 * Découpage MULTI-CLAUSES — le déblocage n°2 du moteur de tâches de Maya : une
 * commande qui enchaîne PLUSIEURS actions ordonnées (« ajoute le client Jean PUIS
 * récolte 25 kg de lavande », « note un contrôle sur la ruche 3 ENSUITE pèse la
 * ruche 5 »). 100 % pur et déterministe : on découpe la phrase en sous-demandes,
 * chacune re-parsée par les analyseurs EXISTANTS (client/recolte/intervention/stock).
 *
 * CONSERVATEUR par conception (priorité : ne rien casser) :
 *  - on ne coupe QUE sur des connecteurs de séquence NON ambigus (« puis »,
 *    « ensuite », « ; »…) — jamais sur « et » nu ni sur une virgule (qui séparent
 *    des propriétés : « client Jean, email … » ; ou des observations : « reine vue,
 *    couvain »).
 *  - on n'accepte une séquence QUE si CHAQUE clause porte une TÊTE D'ACTION
 *    explicite (verbe d'écriture ou geste). Ainsi « note reine vue puis couvain »
 *    (une seule observation) N'EST PAS découpé (« couvain » n'a pas de tête
 *    d'action), tandis que « note un contrôle puis pèse la 5 » l'est.
 */

/** Connecteurs de séquence (ordonnés : variantes longues « et ensuite » avant « ensuite »). */
const RE_SPLIT =
  /\s*(?:;|\bet\s+ensuite\b|\bet\s+puis\b|\bet\s+apres\b|\bpuis\b|\bensuite\b|\bapres\s+ca\b|\bapres\s+quoi\b)\s*/i;

/**
 * Tête d'action : un verbe d'écriture ou un geste apicole qui DÉMARRE une action.
 * Sans elle, une clause est une simple continuation (observation, complément) et
 * ne doit PAS être traitée comme une action indépendante.
 */
const RE_TETE_ACTION =
  /\b(note|noter|enregistre|enregistrer|marque|marquer|consigne|consigner|inscris|inscrire|ajoute|ajouter|cree|creer|creee?|mets|mettre|fais|faire|rajoute|rajouter|nourri\w*|sirop|candi|recolt\w*|extrai\w*|pese|peser|pesee|poids|varroa\w*|acarien\w*|compt\w*|controle\w*|visite\w*|inspection\w*|traite\w*|traitement|client|stock|retire|retirer|sors|sortir|utilise|utiliser|consomme|consommer|entree|sortie)\b/;

/**
 * Découpe une commande en sous-demandes ordonnées. Renvoie un tableau de ≥ 2
 * clauses (texte brut, casse préservée) SEULEMENT si :
 *   1. un connecteur de séquence est présent ;
 *   2. le découpage produit ≥ 2 segments non vides ;
 *   3. CHAQUE segment porte une tête d'action explicite.
 * Sinon renvoie `null` (la commande est mono-action → flux normal).
 */
export function decouperSequence(raw: string): string[] | null {
  if (!RE_SPLIT.test(raw)) return null;

  const clauses = raw
    .split(RE_SPLIT)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (clauses.length < 2) return null;

  // Garde-fou anti sur-découpage : chaque clause doit être une VRAIE action.
  for (const clause of clauses) {
    if (!RE_TETE_ACTION.test(normaliser(clause))) return null;
  }

  return clauses;
}

/** Vrai si la commande enchaîne plusieurs actions ordonnées (≥ 2 clauses d'action). */
export function estSequenceComposee(raw: string): boolean {
  return decouperSequence(raw) !== null;
}
