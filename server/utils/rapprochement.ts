// Moteur de rapprochement bancaire — fonctions pures, zéro I/O, testables.
// Rapproche des transactions bancaires (importées par CSV/OFX ou, plus tard, via un
// agrégateur DSP2) avec les documents à régler (factures émises = ventes, dépenses = achats).
//
// Principe : on ne touche jamais aux identifiants bancaires de l'utilisateur. On reçoit ici
// des transactions déjà normalisées et des documents, et on produit des SUGGESTIONS de
// rapprochement scorées (montant + date + libellé), à confirmer côté UI. Aucune écriture
// automatique : l'humain valide. Le même moteur sert l'import manuel et l'agrégation live.

// ─── Types d'entrée ─────────────────────────────────────────────────────────

/** Transaction bancaire normalisée. `montant` SIGNÉ : + crédit (entrée), − débit (sortie). */
export interface TransactionBancaire {
  id: string;
  /** Date d'opération au format ISO (YYYY-MM-DD). */
  date: string;
  /** Montant signé en euros : positif = encaissement, négatif = décaissement. */
  montant: number;
  /** Libellé brut tel que fourni par la banque. */
  libelle: string;
}

/** Document de gestion à rapprocher : une vente (facture émise) ou un achat (dépense). */
export interface DocumentARapprocher {
  id: string;
  /** `vente` attend un encaissement (crédit) ; `achat` attend un décaissement (débit). */
  sens: 'vente' | 'achat';
  /** Date du document (facture / opération) au format ISO. */
  date: string;
  /** Montant TTC, toujours POSITIF. */
  montant: number;
  /** Numéro de facture / référence, si disponible. */
  reference?: string | null;
  /** Nom du tiers (client pour une vente, fournisseur pour un achat). */
  tiers?: string | null;
}

// ─── Type de sortie ─────────────────────────────────────────────────────────

export interface SuggestionRapprochement {
  transactionId: string;
  documentId: string;
  /** Confiance 0–100. ≥ SEUIL_AUTO ⇒ quasi certain ; ≥ SEUIL_SUGGESTION ⇒ à confirmer. */
  score: number;
  /** Explications lisibles (« Montant exact », « Référence trouvée », « À 2 jours »…). */
  raisons: string[];
}

export interface ResultatRapprochement {
  suggestions: SuggestionRapprochement[];
  transactionsNonRapprochees: string[];
  documentsNonRapproches: string[];
}

// ─── Réglages ───────────────────────────────────────────────────────────────

/** En dessous, on ne propose même pas le rapprochement. */
export const SEUIL_SUGGESTION = 45;
/** Au dessus, le rapprochement est tellement probable qu'on peut le pré-cocher. */
export const SEUIL_AUTO = 82;
/** Tolérance d'écart de montant considéré « exact » (centimes d'arrondi). */
const TOLERANCE_EXACT_EUR = 0.01;
/** Fenêtre de dates au-delà de laquelle un paiement n'est plus un candidat plausible. */
const FENETRE_JOURS_MAX = 75;

// ─── Helpers purs (exportés pour les tests) ─────────────────────────────────

/** Normalise un libellé : minuscules, sans accents, sans ponctuation, espaces compactés. */
export function normaliserLibelle(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Suite de chiffres d'une chaîne, accolés (pour comparer des numéros de facture). */
function chiffres(s: string): string {
  return s.replace(/\D+/g, '');
}

/** Nombre de jours calendaires entre deux dates ISO (b − a). Positif si b après a. */
export function diffJours(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Score de montant 0–50. Exact = 50, dégradé linéairement jusqu'à ~2 % d'écart. */
export function scoreMontant(montantTx: number, montantDoc: number): number {
  const ecart = Math.abs(Math.abs(montantTx) - montantDoc);
  if (ecart <= TOLERANCE_EXACT_EUR) return 50;
  const ref = Math.max(montantDoc, 1);
  const pct = ecart / ref;
  if (pct > 0.02) return 0; // plus de 2 % d'écart : ce n'est pas le même paiement
  return Math.round(50 * (1 - pct / 0.02));
}

/**
 * Score de date 0–30. Un paiement tombe normalement APRÈS la facture : on récompense
 * 0–FENETRE_JOURS_MAX jours après, on pénalise (sans exclure) un paiement antérieur.
 */
export function scoreDate(dateTx: string, dateDoc: string): number {
  const d = diffJours(dateDoc, dateTx);
  if (d >= 0 && d <= FENETRE_JOURS_MAX) {
    return Math.round(30 * (1 - d / FENETRE_JOURS_MAX));
  }
  if (d < 0 && d >= -5) return 10; // payé d'avance / décalage de saisie : plausible mais faible
  return 0;
}

/**
 * Score de libellé 0–20. Forte récompense si la référence (n° de facture) apparaît dans le
 * libellé ; sinon, recouvrement des mots du nom du tiers (≥ 3 lettres) dans le libellé.
 */
export function scoreLibelle(
  libelle: string,
  doc: DocumentARapprocher,
): { points: number; raison?: string } {
  const lib = normaliserLibelle(libelle);
  const ref = doc.reference ? chiffres(doc.reference) : '';
  if (ref.length >= 3 && chiffres(lib).includes(ref)) {
    return { points: 20, raison: `Référence ${doc.reference} trouvée` };
  }
  const tiers = doc.tiers ? normaliserLibelle(doc.tiers) : '';
  if (tiers) {
    const mots = tiers.split(' ').filter((m) => m.length >= 3);
    const trouves = mots.filter((m) => lib.includes(m));
    if (mots.length > 0 && trouves.length > 0) {
      const ratio = trouves.length / mots.length;
      return {
        points: Math.round(14 * ratio),
        raison:
          ratio >= 1
            ? `Tiers « ${doc.tiers} » reconnu`
            : `Tiers « ${doc.tiers} » partiellement reconnu`,
      };
    }
  }
  return { points: 0 };
}

/** Évalue une paire (transaction, document). Renvoie null si incompatible (sens / montant). */
export function evaluerPaire(
  tx: TransactionBancaire,
  doc: DocumentARapprocher,
): SuggestionRapprochement | null {
  // Compatibilité de sens : une vente attend un crédit (montant > 0), un achat un débit (< 0).
  const sensOk = doc.sens === 'vente' ? tx.montant > 0 : tx.montant < 0;
  if (!sensOk) return null;

  const sM = scoreMontant(tx.montant, doc.montant);
  if (sM === 0) return null; // sans correspondance de montant, on ne rapproche pas

  const sD = scoreDate(tx.date, doc.date);
  const sL = scoreLibelle(tx.libelle, doc);

  const score = sM + sD + sL.points;
  const raisons: string[] = [];
  if (sM === 50) raisons.push('Montant exact');
  else raisons.push('Montant proche');
  const jours = diffJours(doc.date, tx.date);
  if (jours >= 0) raisons.push(jours === 0 ? 'Même jour' : `À ${jours} j`);
  if (sL.raison) raisons.push(sL.raison);

  return { transactionId: tx.id, documentId: doc.id, score, raisons };
}

/**
 * Rapproche des transactions avec des documents. Attribution gloutonne 1-pour-1 par score
 * décroissant : chaque transaction et chaque document n'est utilisé qu'une fois. Simple,
 * déterministe, suffisant pour des volumes d'apiculteur (pas un problème d'affectation optimal).
 */
export function rapprocher(
  transactions: TransactionBancaire[],
  documents: DocumentARapprocher[],
): ResultatRapprochement {
  const paires: SuggestionRapprochement[] = [];
  for (const tx of transactions) {
    for (const doc of documents) {
      const s = evaluerPaire(tx, doc);
      if (s && s.score >= SEUIL_SUGGESTION) paires.push(s);
    }
  }
  // Score décroissant ; départage stable par identifiants pour un résultat reproductible.
  paires.sort(
    (a, b) =>
      b.score - a.score ||
      a.transactionId.localeCompare(b.transactionId) ||
      a.documentId.localeCompare(b.documentId),
  );

  const txPris = new Set<string>();
  const docPris = new Set<string>();
  const suggestions: SuggestionRapprochement[] = [];
  for (const p of paires) {
    if (txPris.has(p.transactionId) || docPris.has(p.documentId)) continue;
    txPris.add(p.transactionId);
    docPris.add(p.documentId);
    suggestions.push(p);
  }

  return {
    suggestions,
    transactionsNonRapprochees: transactions.filter((t) => !txPris.has(t.id)).map((t) => t.id),
    documentsNonRapproches: documents.filter((d) => !docPris.has(d.id)).map((d) => d.id),
  };
}

// ─── Relance des factures impayées ──────────────────────────────────────────

export interface FactureImpayee {
  documentId: string;
  reference?: string | null;
  tiers?: string | null;
  montant: number;
  /** Jours écoulés depuis l'échéance (positif = en retard). */
  joursRetard: number;
}

/**
 * Détermine les ventes à relancer : documents `vente` NON rapprochés (aucun encaissement
 * trouvé) dont l'échéance (date + délai) est dépassée à la date `aujourdHui`.
 */
export function facturesARelancer(
  documents: DocumentARapprocher[],
  documentsRapprochesIds: Set<string>,
  aujourdHui: string,
  delaiPaiementJours = 30,
): FactureImpayee[] {
  return documents
    .filter((d) => d.sens === 'vente' && !documentsRapprochesIds.has(d.id))
    .map((d) => {
      const joursDepuisFacture = diffJours(d.date, aujourdHui);
      return {
        documentId: d.id,
        reference: d.reference,
        tiers: d.tiers,
        montant: d.montant,
        joursRetard: joursDepuisFacture - delaiPaiementJours,
      };
    })
    .filter((f) => f.joursRetard > 0)
    .sort((a, b) => b.joursRetard - a.joursRetard);
}
