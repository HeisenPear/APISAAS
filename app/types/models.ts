import type { InferSelectModel } from 'drizzle-orm';
import type {
  profils,
  ruchers,
  ruches,
  inspections,
  recoltes,
  stocks,
  mouvementsStock,
  clients,
  transactions,
  alertes,
} from '~~/server/database/schema';

/** Profil utilisateur */
export type Profil = InferSelectModel<typeof profils>;

/** Rucher (emplacement) */
export type Rucher = InferSelectModel<typeof ruchers>;

/** Ruche individuelle */
export type Ruche = InferSelectModel<typeof ruches>;

/** Inspection / visite */
export type Inspection = InferSelectModel<typeof inspections>;

/** Recolte de miel */
export type Recolte = InferSelectModel<typeof recoltes>;

/** Article en stock */
export type Stock = InferSelectModel<typeof stocks>;

/** Mouvement de stock (entree / sortie / ajustement) */
export type MouvementStock = InferSelectModel<typeof mouvementsStock>;

/** Client (particulier ou professionnel) */
export type Client = InferSelectModel<typeof clients>;

/** Transaction (vente ou achat) */
export type Transaction = InferSelectModel<typeof transactions>;

/** Alerte systeme */
export type Alerte = InferSelectModel<typeof alertes>;
