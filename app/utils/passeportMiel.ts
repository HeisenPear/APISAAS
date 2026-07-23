// ═══════════════════════════════════════════════════════════════════════════
// PASSEPORT MIEL — « l'histoire de ce pot », AUTONOME dans le QR code.
//
// Choix d'architecture : les données du passeport voyagent DANS le QR (encodées
// dans le fragment d'URL `apigo.fr/p#<données>`), pas dans une base. Conséquences :
//   • ZÉRO route serveur / ZÉRO quota Vercel (contrainte projet) ;
//   • fonctionne hors-ligne, le fragment n'est jamais envoyé au serveur ;
//   • l'histoire d'un pot est FIGÉE à la mise en pot — un snapshot statique est
//     donc le bon modèle (pas de donnée « live » à resynchroniser).
//
// Conformité (directive miel 2001/110/CE + décret miel) : le passeport COMPLÈTE
// l'étiquette, il ne la remplace pas. On n'affiche que des faits déclarés par le
// producteur (origine, fleurs, dates, teneur en eau, éco-score de transparence).
// AUCUNE allégation de santé (interdite hors listes officielles).
//
// Module PUR (encode/decode UTF-8 → base64url) — testable, sans dépendance.
// ═══════════════════════════════════════════════════════════════════════════

export interface PasseportMiel {
  /** Version du format (montée de version = compat ascendante gérée au décodage). */
  v: 1;
  /** Numéro de lot (obligatoire — traçabilité). */
  lot: string;
  /** Producteur / exploitation (identité déjà obligatoire sur l'étiquette miel). */
  prod?: string;
  /** Types de miel / fleurs butinées. */
  miels?: string[];
  /** Provenance : ruchers, commune/région, pays. */
  origine?: string;
  /** Récolte : année ou période (ex. « 2026 » ou « juin–août 2026 »). */
  recolte?: string;
  /** Mise en pot (AAAA-MM). */
  pot?: string;
  /** Date de durabilité minimale (AAAA-MM). */
  ddm?: string;
  /** Teneur en eau finale (%). */
  eau?: number;
  /** Éco-score : score /100 + lettre A→E. */
  eco?: { s: number; n: string };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Encode un passeport en chaîne compacte, sûre dans un fragment d'URL. */
export function encoderPasseport(p: PasseportMiel): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(p)));
}

/** Décode un passeport ; renvoie null si la chaîne est absente/illisible/invalide. */
export function decoderPasseport(s: string | null | undefined): PasseportMiel | null {
  if (!s) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(s.trim()));
    const obj: unknown = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    const p = obj as PasseportMiel;
    // Garde-fous : version connue + numéro de lot présent (le reste est optionnel).
    if (p.v !== 1 || typeof p.lot !== 'string' || !p.lot) return null;
    return p;
  } catch {
    return null;
  }
}
