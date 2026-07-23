// ═══════════════════════════════════════════════════════════════════════════
// API Web Speech — types + fabrique PARTAGÉS (dictée `useDictee` + réveil vocal
// `useReveilMaya`). L'API n'est pas typée par la lib DOM standard : on décrit ICI
// le strict minimum qu'on utilise (zéro `any`, conforme à la règle TS du projet).
// 100 % navigateur, gratuit, sans clé ni serveur. Firefox ne la propose pas.
// ═══════════════════════════════════════════════════════════════════════════

export interface AlternativeReco {
  readonly transcript: string;
}
export interface ResultatReco {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: AlternativeReco;
}
export interface ListeResultatsReco {
  readonly length: number;
  readonly [index: number]: ResultatReco;
}
export interface EvenementResultatReco {
  readonly resultIndex: number;
  readonly results: ListeResultatsReco;
}
export interface EvenementErreurReco {
  readonly error: string;
}
export interface Reconnaissance {
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

/** Le constructeur de reconnaissance vocale du navigateur, ou null si absent. */
export function constructeurReco(): ConstructeurReco | null {
  if (!import.meta.client) return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructeurReco;
    webkitSpeechRecognition?: ConstructeurReco;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Vrai si le navigateur sait reconnaître la parole (sinon : masquer les boutons). */
export function speechSupporte(): boolean {
  return constructeurReco() !== null;
}

/** Crée une reconnaissance configurée (fr-FR), ou null si non supportée. */
export function creerReconnaissance(options?: {
  continuous?: boolean;
  interimResults?: boolean;
}): Reconnaissance | null {
  const Ctor = constructeurReco();
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = 'fr-FR';
  r.continuous = options?.continuous ?? false;
  r.interimResults = options?.interimResults ?? true;
  r.maxAlternatives = 1;
  return r;
}
