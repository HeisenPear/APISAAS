// ═══════════════════════════════════════════════════════════════════════════
// DICTÉE VOCALE — reconnaissance de la parole via l'API Web Speech du navigateur
// (types + fabrique partagés : `~/utils/webSpeech`). 100 % navigateur, GRATUITE,
// sans clé ni serveur. Firefox ne la propose pas → `supporte=false` et l'appelant
// masque proprement le bouton.
//
// Pensée « terrain » (gants, soleil, une main) : on appuie, on parle, Maya écrit.
// Mode « appuyer-parler » (push-to-talk) : une phrase, puis on rend la main — pas
// d'écoute permanente ici (c'est le rôle, à part, du réveil vocal `useReveilMaya`).
// ═══════════════════════════════════════════════════════════════════════════
import { creerReconnaissance, speechSupporte, type Reconnaissance } from '~/utils/webSpeech';

/** Callback qui reçoit le transcript courant (interim compris) et s'il est final. */
export type SurTexteDicte = (texte: string, final: boolean) => void;

export function useDictee() {
  const supporte = speechSupporte();
  const actif = ref(false);
  /** Message d'erreur lisible (micro refusé, rien entendu…), sinon null. */
  const erreur = ref<string | null>(null);

  let reco: Reconnaissance | null = null;

  function arreter(): void {
    try {
      reco?.stop();
    } catch {
      /* déjà arrêtée */
    }
  }

  function demarrer(onTexte: SurTexteDicte): void {
    if (actif.value) return;
    const r = creerReconnaissance({ continuous: false, interimResults: true });
    if (!r) return;
    erreur.value = null;
    r.onstart = () => {
      actif.value = true;
    };
    r.onend = () => {
      actif.value = false;
      reco = null;
    };
    r.onerror = (e) => {
      // 'not-allowed'/'service-not-allowed' = micro refusé ; 'no-speech' = silence.
      erreur.value =
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'Micro refusé. Autorise le microphone dans ton navigateur pour dicter.'
          : e.error === 'no-speech'
            ? "Je n'ai rien entendu — réessaie."
            : e.error === 'audio-capture'
              ? "Aucun micro détecté sur l'appareil."
              : null;
    };
    r.onresult = (e) => {
      let texte = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        texte += res[0]?.transcript ?? '';
        if (res.isFinal) final = true;
      }
      onTexte(texte.trim(), final);
    };
    reco = r;
    try {
      r.start();
    } catch {
      // start() jette si déjà démarrée (double tap rapide) — on ignore.
      actif.value = false;
      reco = null;
    }
  }

  /** Bascule écoute ↔ arrêt (l'usage naturel du bouton micro). */
  function basculer(onTexte: SurTexteDicte): void {
    if (actif.value) arreter();
    else demarrer(onTexte);
  }

  onScopeDispose(() => {
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { supporte, actif, erreur, demarrer, arreter, basculer };
}
