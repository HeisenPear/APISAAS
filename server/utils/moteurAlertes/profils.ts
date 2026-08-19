import {
  DETECTEUR_AVANCEES,
  DETECTEUR_BALANCES_MUETTES,
  DETECTEUR_EXTRA,
  DETECTEUR_FACTURE_RETARD,
  DETECTEUR_METEO,
  DETECTEUR_RDV,
  DETECTEUR_SAISON,
  DETECTEUR_SANTE_CRITIQUE,
  DETECTEUR_STOCK_BAS,
  DETECTEUR_VISITE,
} from './detecteurs';
import type { Detecteur, ProfilMoteur } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// LES DEUX PROFILS.
//
// La route dashboard et le cron ne diffèrent plus que par cette déclaration.
// Un invariant testé vérifie que tout détecteur du dashboard est aussi dans le
// cron : c'est ce qui empêche une règle de n'exister que d'un côté — l'origine
// exacte du bug « santé critique jamais générée hors dashboard ».
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que TOUT apiculteur doit recevoir, qu'il ouvre l'app ou non. */
export const SOCLE: readonly Detecteur[] = [
  DETECTEUR_VISITE,
  DETECTEUR_SANTE_CRITIQUE,
  DETECTEUR_STOCK_BAS,
  DETECTEUR_FACTURE_RETARD,
  DETECTEUR_EXTRA,
  DETECTEUR_AVANCEES,
  DETECTEUR_SAISON,
];

/**
 * Route à la demande, appelée au chargement du dashboard.
 * Pas de météo (appel réseau : ni la latence ni le coût n'y ont leur place) ;
 * pas de balances muettes ni de RDV (fenêtres calibrées sur le cron du matin).
 */
export const PROFIL_DASHBOARD: ProfilMoteur = {
  cle: 'dashboard',
  detecteurs: SOCLE,
  antiRafale: true,
  // La route à la demande ne repêche pas : le balayage est l'affaire du cron du
  // matin, qui tourne de toute façon hors heures calmes.
  rattrapagePush: false,
  // Parité stricte avec l'existant. Le durcissement (ne pas doubler la feuille
  // de route depuis le dashboard non plus) est un changement de comportement
  // produit : il mérite son propre commit, et ce booléen suffira à le faire.
  respecterBriefing: false,
};

/** Cron quotidien : le socle plus tout ce qui n'a de sens qu'une fois par jour. */
export const PROFIL_CRON: ProfilMoteur = {
  cle: 'cron',
  detecteurs: [...SOCLE, DETECTEUR_RDV, DETECTEUR_METEO, DETECTEUR_BALANCES_MUETTES],
  antiRafale: false,
  respecterBriefing: true,
  rattrapagePush: true,
};
