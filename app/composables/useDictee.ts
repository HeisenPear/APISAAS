// ═══════════════════════════════════════════════════════════════════════════
// DICTÉE VOCALE — reconnaissance de la parole via l'API Web Speech du navigateur
// (types + fabrique partagés : `~/utils/webSpeech`). 100 % navigateur, GRATUITE,
// sans clé ni serveur. Firefox ne la propose pas → `supporte=false` et l'appelant
// masque proprement le bouton.
//
// Pensée « terrain » (gants, soleil, une main) : on appuie, on parle, Maya écrit.
// On rend la main d'un second appui — JAMAIS toute seule.
//
// ─── POURQUOI LA DICTÉE SE COUPAIT AU BOUT D'UNE SECONDE ───────────────────
// Elle était créée en `continuous: false`. Dans ce mode, Chrome met fin à la
// session dès le premier silence — et si la parole ne démarre pas dans la
// seconde, il la coupe immédiatement. `onend` se contentait alors de repasser
// `actif` à false : le micro s'éteignait tout seul, sans un mot d'explication.
//
// La dictée écoute donc désormais en continu et SE RELANCE tant que l'apiculteur
// n'a pas demandé l'arrêt. Le navigateur coupe l'écoute par intermittence — c'est
// normal et hors de notre contrôle ; ce qui compte, c'est de reprendre.
// ═══════════════════════════════════════════════════════════════════════════
import { creerReconnaissance, speechSupporte, type Reconnaissance } from '~/utils/webSpeech';

/** Callback qui reçoit le transcript courant (interim compris) et s'il est final. */
export type SurTexteDicte = (texte: string, final: boolean) => void;

/** Repos entre deux relances : sans lui, une erreur immédiate boucle à plein régime. */
const REPOS_RELANCE_MS = 260;
/**
 * Relances consécutives sans un mot entendu, avant d'abandonner. Le micro peut
 * être pris par une autre application ou refusé au niveau du système : mieux
 * vaut s'arrêter et le dire que de harceler le navigateur.
 */
const RELANCES_MAX_A_VIDE = 6;

export function useDictee() {
  const supporte = speechSupporte();
  const actif = ref(false);
  /** Message d'erreur lisible (micro refusé, rien entendu…), sinon null. */
  const erreur = ref<string | null>(null);

  const maya = useMayaStore();

  let reco: Reconnaissance | null = null;
  let rappel: SurTexteDicte | null = null;
  /** L'apiculteur a-t-il demandé l'arrêt ? Seul cas où l'on ne relance pas. */
  let arretDemande = false;
  /** Texte DÉJÀ figé, conservé d'une relance à l'autre — sinon il serait perdu. */
  let acquis = '';
  let relancesAVide = 0;
  let minuteur: ReturnType<typeof setTimeout> | null = null;

  function purgerMinuteur(): void {
    if (minuteur) {
      clearTimeout(minuteur);
      minuteur = null;
    }
  }

  function arreter(): void {
    arretDemande = true;
    purgerMinuteur();
    actif.value = false;
    // Le réveil vocal peut reprendre la main sur le micro.
    maya.setDicteeEnCours(false);
    try {
      reco?.stop();
    } catch {
      /* déjà arrêtée */
    }
  }

  function ouvrirSession(): void {
    const r = creerReconnaissance({ continuous: true, interimResults: true });
    if (!r) return;

    r.onstart = () => {
      actif.value = true;
    };

    r.onerror = (e) => {
      // 'not-allowed'/'service-not-allowed' = micro refusé : inutile d'insister.
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        erreur.value = 'Micro refusé. Autorise le microphone dans ton navigateur pour dicter.';
        arretDemande = true;
      } else if (e.error === 'audio-capture') {
        erreur.value = "Aucun micro détecté sur l'appareil.";
        arretDemande = true;
      }
      // 'no-speech' et 'aborted' ne sont PAS des échecs : le navigateur ferme la
      // session, `onend` suit, et la relance reprend l'écoute. Les signaler
      // afficherait « je n'ai rien entendu » alors qu'on écoute toujours.
    };

    r.onend = () => {
      reco = null;
      if (arretDemande) {
        actif.value = false;
        maya.setDicteeEnCours(false);
        return;
      }
      // Rien de neuf depuis la dernière relance : on compte, et on renonce au
      // bout de quelques tours plutôt que de tourner en boucle indéfiniment.
      relancesAVide++;
      if (relancesAVide > RELANCES_MAX_A_VIDE) {
        actif.value = false;
        maya.setDicteeEnCours(false);
        erreur.value = "Je n'ai rien entendu — réessaie en approchant le micro.";
        return;
      }
      purgerMinuteur();
      minuteur = setTimeout(ouvrirSession, REPOS_RELANCE_MS);
    };

    r.onresult = (e) => {
      let interim = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        const t = res[0]?.transcript ?? '';
        if (res.isFinal) {
          acquis = `${acquis} ${t}`.trim();
          final = true;
        } else {
          interim += t;
        }
      }
      // On a entendu quelque chose : le compteur de relances à vide repart.
      relancesAVide = 0;
      erreur.value = null;
      // Le texte rendu est CUMULÉ : l'appelant remplace son brouillon par cette
      // valeur, et une relance ne doit pas lui faire perdre la phrase d'avant.
      rappel?.(`${acquis} ${interim}`.trim(), final);
    };

    reco = r;
    try {
      r.start();
    } catch {
      // start() jette si une session est déjà en cours (double appui rapide).
      reco = null;
    }
  }

  function demarrer(onTexte: SurTexteDicte): void {
    if (actif.value) return;
    erreur.value = null;
    arretDemande = false;
    acquis = '';
    relancesAVide = 0;
    rappel = onTexte;
    // Le réveil vocal « Salut Maya » écoute peut-être déjà : deux
    // reconnaissances sur le même micro et le navigateur en tue une sur-le-champ.
    // C'était l'autre raison des coupures immédiates, sur la page Maya où la
    // bulle est fermée — donc où le réveil est actif.
    maya.setDicteeEnCours(true);
    ouvrirSession();
  }

  /** Bascule écoute ↔ arrêt (l'usage naturel du bouton micro). */
  function basculer(onTexte: SurTexteDicte): void {
    if (actif.value) arreter();
    else demarrer(onTexte);
  }

  onScopeDispose(() => {
    arretDemande = true;
    purgerMinuteur();
    maya.setDicteeEnCours(false);
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { supporte, actif, erreur, demarrer, arreter, basculer };
}
