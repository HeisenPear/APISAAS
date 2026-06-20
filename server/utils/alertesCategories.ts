// ═══════════════════════════════════════════════════════════════════════════
// CATÉGORIES DE NOTIFICATIONS — source de vérité unique.
//
// Plutôt qu'une case à cocher PAR type d'alerte (14 et ça augmente…), on
// regroupe les types en 6 grandes catégories. L'utilisateur ne voit que
// 6 interrupteurs dans les Paramètres ; chaque nouveau type d'alerte hérite
// automatiquement de sa catégorie sans ajouter de case.
//
// Le contrat partagé front ↔ back, ce sont les CLÉS de catégorie (CategorieNotif)
// + le fait que les préférences sont stockées par catégorie.
// ═══════════════════════════════════════════════════════════════════════════

export type CategorieNotif =
  | 'sante'
  | 'production'
  | 'stock'
  | 'saison'
  | 'gestion'
  | 'reglementaire';

/** Type d'alerte → catégorie. Tout type inconnu retombe sur « sante ». */
export const CATEGORIE_PAR_TYPE: Record<string, CategorieNotif> = {
  // Santé du cheptel
  visite_requise: 'sante',
  premiere_visite: 'sante',
  sante_critique: 'sante',
  reine_agee: 'sante',
  // Récolte & production
  traitement_fin: 'production',
  // Stocks & matériel
  stock_bas: 'stock',
  // Saison & agenda
  rappel_saison: 'saison',
  transhumance_proche: 'saison',
  rdv_rappel: 'saison',
  // Gestion & ventes
  facture_retard: 'gestion',
  // Réglementaire
  napi: 'reglementaire',
};

/** Préférences par défaut : tout activé. */
export const CATEGORIES_DEFAUT: Record<CategorieNotif, boolean> = {
  sante: true,
  production: true,
  stock: true,
  saison: true,
  gestion: true,
  reglementaire: true,
};

export const CATEGORIES_NOTIF: CategorieNotif[] = [
  'sante',
  'production',
  'stock',
  'saison',
  'gestion',
  'reglementaire',
];

export function categorieDeType(type: string): CategorieNotif {
  return CATEGORIE_PAR_TYPE[type] ?? 'sante';
}

/**
 * Une alerte de ce `type` doit-elle déclencher une notification ?
 * On lit la préférence de SA CATÉGORIE. Les anciennes clés par type
 * éventuellement encore stockées sont ignorées (retombent sur le défaut = on).
 */
export function typeActif(
  prefs: Record<string, boolean | undefined> | null | undefined,
  type: string,
): boolean {
  const cat = categorieDeType(type);
  return (prefs?.[cat] ?? CATEGORIES_DEFAUT[cat]) !== false;
}

/** Normalise un objet de préférences brut → 6 booléens de catégorie. */
export function normaliserPrefs(
  brut: Record<string, unknown> | null | undefined,
): Record<CategorieNotif, boolean> {
  const out = { ...CATEGORIES_DEFAUT };
  if (brut) {
    for (const cat of CATEGORIES_NOTIF) {
      if (typeof brut[cat] === 'boolean') out[cat] = brut[cat] as boolean;
    }
  }
  return out;
}
