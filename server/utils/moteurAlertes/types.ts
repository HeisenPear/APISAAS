import type { alertes } from '~~/server/database/schema';
import type { RucheSnapshot } from './cheptel';

// ═══════════════════════════════════════════════════════════════════════════
// CONTRATS DU MOTEUR D'ALERTES.
//
// Le moteur a deux points d'entrée — la route dashboard (à la demande) et le
// cron quotidien — qui exécutaient jusqu'ici DEUX implémentations parallèles.
// Elles avaient déjà divergé : `rdv_rappel` n'était résolu que par le cron, le
// message de `stock_bas` différait d'un mot, et le style SQL `ANY(...::uuid[])`
// — responsable d'un incident en production derrière le pooler Supabase —
// subsistait d'un seul côté.
//
// Ici, une règle = un `Detecteur` : ce qu'elle produit, ce qu'elle résout, ce
// qu'elle exige. Les deux points d'entrée ne diffèrent plus que par un PROFIL
// déclaratif.
// ═══════════════════════════════════════════════════════════════════════════

export type AlerteInsert = typeof alertes.$inferInsert;
export type DejaExiste = (type: string, referenceId?: string) => boolean;

/** Une alerte encore active (non résolue) en base. */
export interface AlerteActive {
  id: string;
  type: string;
  referenceId: string | null;
}

/**
 * Contexte de résolution. Les alertes actives ET le cheptel sont chargés UNE
 * fois pour tout le run et partagés par tous les résolveurs.
 */
export interface ContexteResolution {
  userId: string;
  maintenant: Date;
  existantes: readonly AlerteActive[];
  cheptel: readonly RucheSnapshot[];
}

/**
 * Un résolveur rend les IDS d'alertes à marquer résolues. Il n'ÉCRIT jamais :
 * l'orchestrateur regroupe tout en une seule mise à jour.
 */
export type Resolveur = (ctx: ContexteResolution) => Promise<string[]> | string[];

/** Contexte de détection. */
export interface ContexteDetection {
  userId: string;
  maintenant: Date;
  /** Anti-doublon — tient compte des alertes résolues plus tôt dans CE run. */
  dejaExiste: DejaExiste;
  cheptel: readonly RucheSnapshot[];
}

/** Une règle du moteur. */
export interface Detecteur {
  cle: string;
  /**
   * Types d'alertes produits. Sert la lisibilité ET les invariants testés
   * (couverture de catégorie, présence d'un résolveur, absence de doublon).
   */
  types: readonly string[];
  /** Ne rien produire si le compte n'a aucune ruche active. */
  requiertCheptel?: boolean;
  detecter: (ctx: ContexteDetection) => Promise<AlerteInsert[]> | AlerteInsert[];
  /**
   * Résolution des alertes de CES types. Absent = type volontairement jamais
   * auto-résolu — l'invariant testé impose alors de le déclarer ici.
   */
  resoudre?: Resolveur;
  /**
   * Types produits qui ne sont volontairement jamais auto-résolus, avec la
   * raison. Documente l'exception au lieu de la laisser passer en silence.
   */
  sansResolution?: Readonly<Record<string, string>>;
}

/** Ce qui distingue le cron de la route à la demande. */
export interface ProfilMoteur {
  cle: 'dashboard' | 'cron';
  detecteurs: readonly Detecteur[];
  /** Anti-rafale : rechargements successifs du dashboard. */
  antiRafale: boolean;
  /** Ne pas doubler les types que la feuille de route du matin regroupe déjà. */
  respecterBriefing: boolean;
}
