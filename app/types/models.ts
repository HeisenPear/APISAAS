import type { InferSelectModel } from 'drizzle-orm';
import type {
  profils,
  ruchers,
  ruches,
  recoltes,
  stocks,
  mouvementsStock,
  clients,
  transactions,
  alertes,
  membres,
} from '~~/server/database/schema';

/** Profil utilisateur */
export type Profil = InferSelectModel<typeof profils>;

/** Rucher (emplacement) */
export type Rucher = InferSelectModel<typeof ruchers>;

/** Ruche individuelle */
export type Ruche = InferSelectModel<typeof ruches>;

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

/** Membre d'equipe */
export type Membre = InferSelectModel<typeof membres>;

/** Rucher enrichi avec le nombre de ruches (retourné par GET /api/ruchers) */
export type RucherWithCount = Rucher & { ruchesCount: number };

/** Ruche enrichie avec les données de santé calculées (retournée par GET /api/ruches) */
export type RucheWithStats = Ruche & {
  rucherNom: string | null;
  lastForceColonie: number | null;
  santeScore: number | null;
};
