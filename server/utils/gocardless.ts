// Adapter GoCardless Bank Account Data (ex-Nordigen) — agrégation bancaire DSP2 (AIS only).
// Lecture des comptes/transactions via un agrégateur agréé : on ne voit jamais les identifiants
// bancaires de l'utilisateur (auth chez sa banque). Entièrement FACULTATIF : sans les secrets
// NUXT_GOCARDLESS_*, gocardlessActif() = false et la connexion auto reste désactivée (l'import
// CSV/OFX continue de fonctionner). Mapping des transactions → LigneReleve (même format que le
// parser de relevé) pour réutiliser tel quel le moteur de rapprochement.
import { normaliserLibelle } from './rapprochement';
import type { LigneReleve } from './releveBancaire';

const BASE = 'https://bankaccountdata.gocardless.com/api/v2';

export interface Institution {
  id: string;
  name: string;
  bic?: string;
  logo?: string;
}
export interface Requisition {
  id: string;
  status: string;
  accounts: string[];
  link?: string;
  institution_id?: string;
}

/** Vrai si l'intégration est configurée (les deux secrets présents). */
export function gocardlessActif(): boolean {
  const c = useRuntimeConfig();
  return Boolean(c.gocardlessSecretId && c.gocardlessSecretKey);
}

// Token d'accès (~24 h) mis en cache au niveau module pour une instance chaude.
let tokenCache: { token: string; exp: number } | null = null;

async function obtenirToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.exp > now) return tokenCache.token;
  const c = useRuntimeConfig();
  const res = await $fetch<{ access: string; access_expires: number }, string>(
    `${BASE}/token/new/`,
    {
      method: 'POST',
      body: { secret_id: c.gocardlessSecretId, secret_key: c.gocardlessSecretKey },
      timeout: 8000,
    },
  );
  tokenCache = { token: res.access, exp: now + (res.access_expires - 60) * 1000 };
  return res.access;
}

async function api<T>(
  path: string,
  opts: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
): Promise<T> {
  const token = await obtenirToken();
  /**
   * ⚠️ `<…, string>` PIN LE TYPE DE LA REQUÊTE — cf. `app/utils/appelApi.ts`.
   * URL externe (GoCardless) : la confronter à l'union des routes internes est
   * du travail entièrement perdu, et c'est ce travail qui saturait le budget
   * d'instanciation de TypeScript.
   */
  const res = await $fetch<unknown, string>(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}` },
    body: opts.body,
    timeout: 8000,
  });
  return res as T;
}

/** Banques disponibles pour un pays (ISO-2, ex. « FR »). */
export async function listerInstitutions(pays = 'FR'): Promise<Institution[]> {
  return api<Institution[]>(`/institutions/?country=${encodeURIComponent(pays.toLowerCase())}`);
}

/** Crée une demande de connexion (requisition) → renvoie le lien d'authentification banque. */
export async function creerRequisition(params: {
  institutionId: string;
  redirect: string;
  reference: string;
}): Promise<Requisition> {
  return api<Requisition>('/requisitions/', {
    method: 'POST',
    body: {
      institution_id: params.institutionId,
      redirect: params.redirect,
      reference: params.reference,
      user_language: 'FR',
    },
  });
}

/** État d'une requisition (statut + comptes liés une fois l'utilisateur authentifié). */
export async function recupererRequisition(id: string): Promise<Requisition> {
  return api<Requisition>(`/requisitions/${id}/`);
}

interface GcTransaction {
  transactionAmount: { amount: string; currency: string };
  bookingDate?: string;
  valueDate?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
  creditorName?: string;
  debtorName?: string;
  internalTransactionId?: string;
  transactionId?: string;
}

function mapTransaction(t: GcTransaction): LigneReleve | null {
  const montant = Number(t.transactionAmount?.amount);
  const date = (t.bookingDate || t.valueDate || '').slice(0, 10);
  if (!Number.isFinite(montant) || montant === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const libelle = (
    t.remittanceInformationUnstructured ||
    t.remittanceInformationUnstructuredArray?.join(' ') ||
    t.creditorName ||
    t.debtorName ||
    ''
  ).trim();
  const reference = t.internalTransactionId || t.transactionId;
  const empreinte = reference
    ? `gc:${reference}`
    : `${date}|${montant.toFixed(2)}|${normaliserLibelle(libelle)}`;
  return { date, montant, libelle, reference, empreinte };
}

/** Transactions « booked » d'un compte, normalisées en LigneReleve (prêtes au rapprochement). */
export async function recupererTransactions(accountId: string): Promise<LigneReleve[]> {
  const res = await api<{ transactions: { booked: GcTransaction[] } }>(
    `/accounts/${accountId}/transactions/`,
  );
  return (res.transactions?.booked ?? [])
    .map(mapTransaction)
    .filter((l): l is LigneReleve => l !== null);
}
