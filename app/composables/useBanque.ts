import type { ApiResponse } from '~/types/api';

export interface MouvementBancaire {
  id: string;
  dateOperation: string;
  montant: string;
  libelle: string;
  statut: 'a_rapprocher' | 'rapproche' | 'ignore';
  source: string;
  transactionId: string | null;
  dateRapprochement: string | null;
  factureNumero: string | null;
}

export interface SuggestionRapprochement {
  mouvementId: string;
  transactionId: string;
  score: number;
  raisons: string[];
  mouvement: { date: string; montant: number; libelle: string };
  facture: { numero: string | null; total: number; tiers: string | null; date: string };
}

export interface ResultatImport {
  importes: number;
  doublons: number;
  ignorees: number;
  format: string;
  /** PDF seulement : la mise en page reconnue (colonne signée, débit/crédit…). */
  colonnes?: string;
}

export interface FactureOuverte {
  id: string;
  numero: string | null;
  total: number;
  date: string;
  tiers: string | null;
}

export interface ConnexionBancaire {
  id: string;
  institutionNom: string | null;
  statut: 'en_attente' | 'liee' | 'expiree' | 'erreur';
  derniereSync: string | null;
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  logo: string | null;
}

export function useBanque() {
  const { emit } = useDataBus();

  async function importReleve(contenu: string, nomFichier?: string) {
    const { data } = await $fetch<ApiResponse<ResultatImport>>('/api/finances/banque/import', {
      method: 'POST',
      body: { contenu, nomFichier },
    });
    return data;
  }

  /**
   * Relevé PDF. Un PDF est un binaire : le lire en texte le détruirait. On
   * l'envoie donc en base64, et c'est le serveur qui reconstitue le tableau —
   * la position des montants y dit le sens de chaque opération.
   */
  async function importRelevePdf(base64: string, nomFichier?: string) {
    const { data } = await $fetch<ApiResponse<ResultatImport>>('/api/finances/banque/import', {
      method: 'POST',
      body: { contenuBase64: base64, nomFichier },
    });
    return data;
  }

  async function listMouvements(statut?: MouvementBancaire['statut']) {
    const { data } = await $fetch<ApiResponse<MouvementBancaire[]>>(
      '/api/finances/banque/mouvements',
      { query: statut ? { statut } : undefined },
    );
    return data ?? [];
  }

  async function getSuggestions() {
    const { data } = await $fetch<ApiResponse<SuggestionRapprochement[]>>(
      '/api/finances/banque/suggestions',
    );
    return data ?? [];
  }

  async function rapprocher(mouvementId: string, transactionId: string) {
    await $fetch<ApiResponse<{ ok: true }>>('/api/finances/banque/rapprocher', {
      method: 'POST',
      body: { mouvementId, transactionId },
    });
    // La facture vient de passer « payée » → rafraîchit les vues factures/alertes.
    emit('vente:updated', { id: transactionId });
  }

  async function action(mouvementId: string, act: 'ignorer' | 'restaurer') {
    await $fetch<ApiResponse<{ ok: true }>>('/api/finances/banque/action', {
      method: 'POST',
      body: { mouvementId, action: act },
    });
    if (act === 'restaurer') emit('vente:updated', { id: mouvementId });
  }

  async function facturesOuvertes() {
    const { data } = await $fetch<ApiResponse<FactureOuverte[]>>(
      '/api/finances/banque/factures-ouvertes',
    );
    return data ?? [];
  }

  // ── Connexion bancaire automatique (agrégateur DSP2, facultatif) ──
  async function etatConnexion() {
    const { data } = await $fetch<ApiResponse<{ actif: boolean; connexions: ConnexionBancaire[] }>>(
      '/api/finances/banque/connexion/etat',
    );
    return data ?? { actif: false, connexions: [] };
  }

  async function listerInstitutions(pays = 'FR') {
    const { data } = await $fetch<ApiResponse<Institution[]>>(
      '/api/finances/banque/connexion/institutions',
      { query: { pays } },
    );
    return data ?? [];
  }

  async function initierConnexion(institutionId: string, institutionNom?: string) {
    const { data } = await $fetch<ApiResponse<{ link: string }>>(
      '/api/finances/banque/connexion/initier',
      { method: 'POST', body: { institutionId, institutionNom } },
    );
    return data;
  }

  async function synchroniser(connexionId?: string) {
    const { data } = await $fetch<ApiResponse<{ importes: number; liees: number }>>(
      '/api/finances/banque/connexion/synchroniser',
      { method: 'POST', body: { connexionId } },
    );
    return data;
  }

  return {
    importReleve,
    importRelevePdf,
    listMouvements,
    getSuggestions,
    rapprocher,
    action,
    facturesOuvertes,
    etatConnexion,
    listerInstitutions,
    initierConnexion,
    synchroniser,
  };
}
