/**
 * PRÉSENTATION DE MAYA — la mini-cinématique que voient les apiculteurs déjà
 * installés, la première fois qu'ils touchent à Maya après la mise à jour.
 *
 * Ils n'ont jamais traversé l'onboarding version Maya : sans un mot, une bulle
 * inconnue apparaît en bas à droite de leur application. On rejoue donc la
 * NAISSANCE (le film d'ouverture) et rien d'autre — pas le récit complet, pas
 * la création d'un rucher : leur compte existe déjà.
 *
 * Persistance LOCALE, exactement comme les notes de patch (cf. usePatchNotes) :
 * une présentation n'a aucune raison d'exiger un aller-retour serveur, et « une
 * fois par appareil » est le bon grain — c'est là que l'apiculteur regarde.
 * Le CHOIX fait à la fin (la présence), lui, remonte bien au profil : ce n'est
 * pas une annonce, c'est un réglage, et il doit suivre le compte.
 */

/** Changer cette valeur rejoue la présentation, une fois, pour tout le monde. */
const ID = '2026-07-maya';
const CLE = 'apigo_maya_presentation_vue';

export function useMayaPresentation() {
  /** Vrai si l'apiculteur a déjà vu (ou a été pré-crédité de) la présentation. */
  function dejaVue(): boolean {
    if (!import.meta.client) return true; // au rendu serveur, on ne propose rien
    // `?rejouer=maya` (équipe APIGO) : la présentation redevient due, le temps
    // de la revoir. Cf. `porteDeRejeu.ts` — la porte échoue fermée.
    if (porteDeRejeuOuverte('maya')) return false;
    try {
      return localStorage.getItem(CLE) === ID;
    } catch {
      return true; // navigation privée / stockage refusé → on n'insiste pas
    }
  }

  /** Grave la présentation comme vue — idempotent, silencieux si le stockage refuse. */
  function marquerVue(): void {
    if (!import.meta.client) return;
    // Rejeu = observation : on ne consomme pas la présentation de celui qui la
    // relit. `presentationDue` retombe quand même à faux côté magasin — c'est
    // un état de session, pas une trace.
    if (porteDeRejeuOuverte('maya')) return;
    try {
      localStorage.setItem(CLE, ID);
    } catch {
      /* stockage indisponible : tant pis, elle pourra se remontrer une fois */
    }
  }

  return { id: ID, dejaVue, marquerVue };
}
