// ═══════════════════════════════════════════════════════════════════════════
// QR APIGO — analyse d'un QR DÉCODÉ vers la route interne à ouvrir.
//
// Sécurité : on ne navigue QUE vers des routes RECONNUES de l'app. Un QR étranger
// (une pub, une URL quelconque) ne doit jamais nous faire naviguer n'importe où.
// Pur et testable — le cœur du scanner auto-détecté.
// ═══════════════════════════════════════════════════════════════════════════

export interface CibleQr {
  /** Route interne à ouvrir (ex. « /ruches/abc-123 »). */
  path: string;
  type: 'ruche' | 'lot';
}

/**
 * Extrait la cible APIGO d'un texte de QR (URL complète, chemin relatif…), ou
 * null si ce n'est pas un QR de l'app. On ignore la query/fragment et l'hôte :
 * seul le CHEMIN reconnu compte (ruche ou lot de production).
 */
export function analyserQrApigo(texte: string): CibleQr | null {
  const t = (texte ?? '').trim();
  if (!t) return null;

  let path: string | null = null;
  try {
    path = new URL(t).pathname;
  } catch {
    // Pas une URL absolue : on accepte un chemin relatif « /ruches/… ».
    if (t.startsWith('/')) path = t.split(/[?#]/)[0] ?? null;
  }
  if (!path) return null;

  const ruche = path.match(/^\/ruches\/([^/?#]+)/);
  if (ruche?.[1]) return { path: `/ruches/${ruche[1]}`, type: 'ruche' };

  const lot = path.match(/^\/production\/lots\/([^/?#]+)/);
  if (lot?.[1]) return { path: `/production/lots/${lot[1]}`, type: 'lot' };

  return null;
}
