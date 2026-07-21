export interface ReineNoeud {
  id: string;
  identifiant: string | null;
  couleurMarquage: string | null;
  anneeNaissance: number | null;
  estActive: boolean;
  ligneeNom: string | null;
  reineMereId: string | null;
}

export interface Generation {
  niveau: number;
  reines: ReineNoeud[];
}

/**
 * Construit l'arbre généalogique (ascendants + descendants) d'une reine à
 * partir de la liste plate des reines d'un compte, via la chaîne `reineMereId`.
 * Profondeur plafonnée à 6 générations en descente (garde-fou boucle infinie
 * si des données corrompues créaient un cycle).
 */
export function construireGenealogie(reines: ReineNoeud[], focusId: string): Generation[] {
  const parNoeud = new Map<string, ReineNoeud>(reines.map((r) => [r.id, r]));
  const focus = parNoeud.get(focusId);
  if (!focus) return [];

  const filsDe = new Map<string, string[]>();
  for (const r of reines) {
    if (!r.reineMereId) continue;
    const enfants = filsDe.get(r.reineMereId) ?? [];
    enfants.push(r.id);
    filsDe.set(r.reineMereId, enfants);
  }

  const generations: Generation[] = [{ niveau: 0, reines: [focus] }];

  // Ascendants (niveaux négatifs).
  let courante = focus;
  const vusAscendants = new Set<string>([focusId]);
  while (
    courante.reineMereId &&
    parNoeud.has(courante.reineMereId) &&
    !vusAscendants.has(courante.reineMereId)
  ) {
    const mere = parNoeud.get(courante.reineMereId)!;
    generations.unshift({ niveau: generations[0]!.niveau - 1, reines: [mere] });
    vusAscendants.add(mere.id);
    courante = mere;
  }

  // Descendants (niveaux positifs), parcours en largeur.
  let niveauCourant = [focusId];
  let profondeur = 0;
  const vusDescendants = new Set<string>([focusId]);
  while (profondeur < 6) {
    const suivant = niveauCourant
      .flatMap((idParent) => filsDe.get(idParent) ?? [])
      .filter((idEnfant) => !vusDescendants.has(idEnfant));
    if (suivant.length === 0) break;
    profondeur += 1;
    suivant.forEach((idEnfant) => vusDescendants.add(idEnfant));
    generations.push({
      niveau: profondeur,
      reines: suivant.map((idEnfant) => parNoeud.get(idEnfant)!),
    });
    niveauCourant = suivant;
  }

  return generations;
}
