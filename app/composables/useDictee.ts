// ═══════════════════════════════════════════════════════════════════════════
// DICTÉE VOCALE — reconnaissance de la parole via l'API Web Speech du navigateur
// (SpeechRecognition). 100 % navigateur, GRATUITE, sans clé ni serveur : le
// navigateur assure la reconnaissance (Chrome, Edge et Safari la délèguent à un
// service système/éditeur). Firefox ne la propose pas → `supporte` vaut false et
// l'appelant masque proprement le bouton.
//
// Pensée « terrain » (gants, soleil, une main) : on appuie, on parle, Maya écrit.
// Mode « appuyer-parler » (push-to-talk) : une phrase, puis on rend la main —
// pas d'écoute permanente (batterie, vie privée). Le mot de réveil « salut Maya »
// est un autre mode, documenté à part.
// ═══════════════════════════════════════════════════════════════════════════

// L'API Web Speech n'est pas typée par la lib DOM standard : on décrit ICI le
// strict minimum qu'on utilise (zéro `any`, conforme à la règle TS du projet).
interface AlternativeReco {
  readonly transcript: string;
}
interface ResultatReco {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: AlternativeReco;
}
interface ListeResultatsReco {
  readonly length: number;
  readonly [index: number]: ResultatReco;
}
interface EvenementResultatReco {
  readonly resultIndex: number;
  readonly results: ListeResultatsReco;
}
interface EvenementErreurReco {
  readonly error: string;
}
interface Reconnaissance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: EvenementErreurReco) => void) | null;
  onresult: ((e: EvenementResultatReco) => void) | null;
}
type ConstructeurReco = new () => Reconnaissance;

function trouverConstructeur(): ConstructeurReco | null {
  if (!import.meta.client) return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructeurReco;
    webkitSpeechRecognition?: ConstructeurReco;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Callback qui reçoit le transcript courant (interim compris) et s'il est final. */
export type SurTexteDicte = (texte: string, final: boolean) => void;

export function useDictee() {
  const Constructeur = trouverConstructeur();
  const supporte = Constructeur !== null;
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
    if (!Constructeur || actif.value) return;
    erreur.value = null;
    const r = new Constructeur();
    r.lang = 'fr-FR';
    r.continuous = false; // push-to-talk : une seule prise de parole
    r.interimResults = true; // le texte s'affiche au fil de la parole
    r.maxAlternatives = 1;
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
