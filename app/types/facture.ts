import { dateDuJour } from '~/utils/dateDuJour';
/**
 * Types partagés du formulaire de vente/facture + mapping facture → formulaire,
 * réutilisé pour l'ÉDITION d'un brouillon (page facture et liste des ventes).
 * Structurellement compatible avec `VenteForm.vue` (modelValue).
 */

export interface LigneVente {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  tauxTva: number;
  modePrix?: 'format' | 'poids';
  contenance?: number | null;
  uniteContenance?: string;
  stockId?: string;
  stockQuantite?: number;
  // Traçabilité miel — Décret 2003-587
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
  // Pedigree — reine vendue (module élevage, Expert), optionnel
  categorieVente?: string;
  reineElevageId?: string | null;
}

export interface VenteFormData {
  clientId?: string;
  dateTransaction: string; // YYYY-MM-DD (input date)
  dateEcheance?: string;
  lignes: LigneVente[];
  remise?: number;
  notes?: string;
  categorieOperation: 'livraison_biens' | 'prestation_services' | 'mixte';
}

/** Source minimale (facture chargée) nécessaire au pré-remplissage du formulaire. */
export interface FactureSource {
  clientId?: string | null;
  dateTransaction?: string | Date | null;
  dateEcheance?: string | Date | null;
  remise?: string | number | null;
  notes?: string | null;
  categorieOperation?: string | null;
  lignes?: Partial<LigneVente>[] | null;
}

function toDateInput(d: string | Date | null | undefined): string {
  const date = d ? new Date(d) : new Date();
  return Number.isNaN(date.getTime()) ? dateDuJour() : date.toISOString().slice(0, 10);
}

/** Convertit une facture existante en données pré-remplies pour `VenteForm`. */
export function factureVersForm(f: FactureSource): VenteFormData {
  const lignes: LigneVente[] = (f.lignes ?? []).map((l) => ({
    description: l.description ?? '',
    quantite: Number(l.quantite ?? 1),
    prixUnitaire: Number(l.prixUnitaire ?? 0),
    total: Number(l.total ?? 0),
    tauxTva: Number(l.tauxTva ?? 5.5),
    modePrix: l.modePrix,
    contenance: l.contenance ?? undefined,
    uniteContenance: l.uniteContenance,
    stockId: l.stockId,
    typeMiel: l.typeMiel,
    presentation: l.presentation,
    numLot: l.numLot,
    origineGeo: l.origineGeo,
    anneeRecolte: l.anneeRecolte,
    categorieVente: l.categorieVente,
    reineElevageId: l.reineElevageId,
  }));

  return {
    clientId: f.clientId ?? undefined,
    dateTransaction: toDateInput(f.dateTransaction),
    dateEcheance: f.dateEcheance ? toDateInput(f.dateEcheance) : undefined,
    lignes: lignes.length
      ? lignes
      : [{ description: '', quantite: 1, prixUnitaire: 0, total: 0, tauxTva: 5.5 }],
    remise: f.remise != null ? Number(f.remise) : undefined,
    notes: f.notes ?? undefined,
    categorieOperation:
      (f.categorieOperation as VenteFormData['categorieOperation']) ?? 'livraison_biens',
  };
}
