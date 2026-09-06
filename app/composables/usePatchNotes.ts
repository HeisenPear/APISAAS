import { PATCH_NOTE } from '~/config/patchNotes';

/**
 * Notes de patch éphémères. Affichées UNE fois par version, à la première
 * connexion suivant la mise à jour, puis plus jamais.
 *
 * Persistance LOCALE (localStorage) : une annonce n'a aucune raison d'exiger un
 * aller-retour serveur ni une migration — et « une fois par appareil » est
 * exactement le bon grain pour un mot de bienvenue. Voir un appareil comme un
 * lecteur : montrer l'annonce une fois là où l'apiculteur lit.
 */
const CLE = 'apigo_patchnote_vu';

export function usePatchNotes() {
  const note = PATCH_NOTE;

  function lire(): string | null {
    if (!import.meta.client) return null;
    try {
      return localStorage.getItem(CLE);
    } catch {
      return null; // navigation privée / stockage refusé
    }
  }

  /** Vrai si l'apiculteur a déjà vu (ou a été pré-crédité de) la note courante. */
  function dejaVu(): boolean {
    // `?rejouer=patch` (équipe APIGO) : on rend la note « jamais vue », le temps
    // de la relire. Cf. `porteDeRejeu.ts` — la porte échoue fermée.
    if (porteDeRejeuOuverte('patch')) return false;
    return lire() === note.id;
  }

  /** Grave la note courante comme vue — idempotent, silencieux si le stockage refuse. */
  function marquerVu(): void {
    if (!import.meta.client) return;
    // Rejeu = observation : on ne consomme pas l'annonce de celui qui la relit.
    if (porteDeRejeuOuverte('patch')) return;
    try {
      localStorage.setItem(CLE, note.id);
    } catch {
      /* stockage indisponible : tant pis, l'annonce pourra se remontrer une fois */
    }
  }

  return { note, dejaVu, marquerVu };
}
