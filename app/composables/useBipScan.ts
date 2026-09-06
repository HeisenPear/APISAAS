/**
 * LE BIP DU SCANNER — le retour que l'apiculteur perçoit sans regarder l'écran.
 *
 * Demandé par Roger, et pour une bonne raison : on scanne une ruche en plein
 * soleil, gants aux mains, l'écran à bout de bras. Le changement d'affichage ne
 * se voit pas. Un son tranche — c'est le geste de la caisse de supermarché :
 * tant qu'on n'a pas entendu le bip, on n'a pas scanné.
 *
 * Le son est SYNTHÉTISÉ, jamais chargé : aucun fichier, aucune requête, rien à
 * mettre en cache hors ligne, et rien qui puisse être bloqué par la politique
 * de sécurité de contenu.
 *
 * Deux sons DISTINCTS, et c'est le point : un aigu bref pour « c'est bon », deux
 * graves pour « QR non reconnu ». Un signal unique laisserait croire au succès à
 * chaque fois qu'on entend quelque chose — pire que pas de son du tout.
 */

/** Un seul contexte audio pour toute la session : en créer un par bip les épuise. */
let contexte: AudioContext | null = null;

function obtenirContexte(): AudioContext | null {
  if (!import.meta.client) return null;
  try {
    type FenetreAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as FenetreAudio).webkitAudioContext;
    if (!Ctor) return null;
    contexte ??= new Ctor();
    // Les navigateurs suspendent le contexte tant qu'aucun geste n'a eu lieu.
    // Ouvrir le scanner EST un geste : on relance sans attendre la promesse,
    // le bip suivant en profitera même si celui-ci passe à la trappe.
    if (contexte.state === 'suspended') void contexte.resume();
    return contexte;
  } catch {
    return null; // audio indisponible : le scanner reste parfaitement utilisable
  }
}

/** Une note courte, en fondu — sans enveloppe, un son carré « claque ». */
function note(ctx: AudioContext, frequence: number, depart: number, duree: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequence;
  // Attaque très courte puis extinction : c'est ce qui rend le son net plutôt
  // que claquant, et l'extinction évite le « clic » de fin de signal.
  gain.gain.setValueAtTime(0, depart);
  gain.gain.linearRampToValueAtTime(0.22, depart + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, depart + duree);
  osc.connect(gain).connect(ctx.destination);
  osc.start(depart);
  osc.stop(depart + duree + 0.02);
}

function vibrer(motif: number | number[]): void {
  // Android uniquement — Safari iOS ne l'implémente pas. D'où l'importance du
  // son : c'est le seul retour disponible sur iPhone.
  try {
    navigator.vibrate?.(motif);
  } catch {
    /* refusé par le navigateur : sans conséquence */
  }
}

export function useBipScan() {
  /** Scan réussi : une note claire et haute, plus une vibration brève. */
  function reussite(): void {
    const ctx = obtenirContexte();
    if (ctx) {
      const t = ctx.currentTime;
      note(ctx, 1320, t, 0.09);
      note(ctx, 1760, t + 0.07, 0.11);
    }
    vibrer(35);
  }

  /** QR illisible ou étranger à APIGO : deux notes basses, sans ambiguïté. */
  function echec(): void {
    const ctx = obtenirContexte();
    if (ctx) {
      const t = ctx.currentTime;
      note(ctx, 320, t, 0.12);
      note(ctx, 240, t + 0.14, 0.16);
    }
    vibrer([25, 60, 25]);
  }

  /**
   * À appeler à l'ouverture du scanner, dans la foulée du geste : le contexte
   * audio se débloque là, et le premier bip sort au bon moment plutôt qu'après.
   */
  function preparer(): void {
    obtenirContexte();
  }

  return { reussite, echec, preparer };
}
