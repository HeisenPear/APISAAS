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
  bonsLivraison,
  PhotoEntry,
  LigneBL,
} from '~~/server/database/schema';

export type { PhotoEntry };

/**
 * Une ligne de bon de livraison — LE MÊME TYPE QUE CELUI STOCKÉ EN BASE.
 *
 * ⚠️ `BonLivraisonForm.vue` en portait une recopie, et elle avait perdu trois
 * champs : `modePrix`, `contenance` et `uniteContenance`. Le formulaire ne
 * pouvait donc pas les envoyer, quand bien même le schéma Zod du serveur les
 * accepte. Un seau de 25 kg tarifé 10 €/kg partait sans ce qui justifie son
 * prix : le serveur calculait 10 × 10 = 100 € et l'ÉCRIVAIT, puis la
 * conversion en facture reprenait ces 100 € sur un document numéroté. C'est
 * « le bug d'origine » de `pricing.ts`, cette fois entré par le formulaire —
 * alors que le formulaire de VENTE, lui, transporte bien les trois champs.
 */
export type { LigneBL };

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

/** Bon de livraison */
export type BonLivraison = InferSelectModel<typeof bonsLivraison>;

/** Bon de livraison enrichi avec les infos client (retourné par GET /api/bons-livraison) */
export type BonLivraisonWithClient = BonLivraison & {
  clientNom: string | null;
  clientPrenom: string | null;
  clientEntreprise: string | null;
  clientType: string | null;
};

/** Rucher enrichi avec le nombre de ruches (retourné par GET /api/ruchers) */
export type RucherWithCount = Rucher & {
  ruchesCount: number;
  /** Emplacement sur lequel le rucher est posé (joint par GET /api/ruchers). */
  emplacementNom?: string | null;
  emplacementCommune?: string | null;
};

/** Ruche enrichie avec les données de santé calculées (retournée par GET /api/ruches) */
export type RucheWithStats = Ruche & {
  rucherNom: string | null;
  lastForceColonie: number | null;
  santeScore: number | null;
};
