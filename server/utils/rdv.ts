/**
 * Libellés des types de rendez-vous professionnels.
 * Source unique partagée par le cron d'alertes (`rdv_rappel`) et la feuille de
 * route du jour (`planJour`) — évite la divergence entre les deux.
 */
export const RDV_TYPE_LABELS: Record<string, string> = {
  veterinaire: 'vétérinaire',
  syndicat: 'syndicat',
  fournisseur: 'fournisseur',
  client: 'client',
  administration: 'administration',
  autre: '',
};
