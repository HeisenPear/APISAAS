/**
 * Traduction des erreurs de l'API Web Speech en diagnostic honnête.
 *
 * POURQUOI CE MODULE EXISTE. `useDictee` ne traitait que trois codes
 * (`not-allowed`, `service-not-allowed`, `audio-capture`). Tous les autres
 * tombaient dans le même silence, puis, au bout de six relances sans un mot,
 * dans un unique message : « Je n'ai rien entendu — réessaie en approchant le
 * micro. »
 *
 * Ce message est FAUX dans la moitié des cas, et c'est le pire des défauts de
 * diagnostic : il envoie chercher au mauvais endroit. `network` — le service de
 * reconnaissance de Chrome est distant, il peut être injoignable — donnait
 * exactement cette phrase. L'apiculteur rapproche le micro, souffle dedans,
 * vérifie ses autorisations… alors que rien de tout cela n'est en cause.
 *
 * Un diagnostic qui ment coûte plus cher que pas de diagnostic du tout.
 *
 * ⚠️ CE QUI N'EST PAS ICI. Le comportement micro réel ne se teste pas hors
 * navigateur. Ce module est la partie PURE : la table de correspondance entre un
 * code d'erreur et ce qu'on en dit. C'est elle qui se vérifie.
 */

export interface DiagnosticMicro {
  /** Message destiné à l'apiculteur — jamais un code technique. */
  message: string;
  /**
   * Faut-il cesser d'insister ? `true` quand relancer ne peut rien changer :
   * micro refusé, absent, service injoignable. Relancer douze fois sur une
   * cause permanente fait clignoter l'indicateur d'enregistrement pour rien.
   */
  fatal: boolean;
  /** Code brut, conservé pour le journal de diagnostic. */
  code: string;
}

/**
 * Codes de `SpeechRecognitionErrorEvent.error` (spécification Web Speech).
 * Les deux non fatals sont le fonctionnement NORMAL de l'écoute continue : le
 * navigateur ferme la session périodiquement, `onend` suit, la relance reprend.
 */
const TABLE: Record<string, { message: string; fatal: boolean }> = {
  'not-allowed': {
    message: 'Micro refusé. Autorise le microphone dans ton navigateur pour dicter.',
    fatal: true,
  },
  'service-not-allowed': {
    message:
      'La reconnaissance vocale est bloquée par le navigateur ou le système. ' +
      'Vérifie les autorisations du site, puis réessaie.',
    fatal: true,
  },
  'audio-capture': {
    message: "Aucun micro détecté sur l'appareil.",
    fatal: true,
  },
  network: {
    message:
      'La reconnaissance vocale ne joint pas son service en ligne. ' +
      'Ce n’est pas ton micro : vérifie ta connexion, ou réessaie plus tard.',
    fatal: true,
  },
  'language-not-supported': {
    message: 'Ce navigateur ne reconnaît pas le français. La dictée n’est pas disponible ici.',
    fatal: true,
  },
  'bad-grammar': {
    message: 'La reconnaissance vocale a refusé sa configuration. La dictée est indisponible.',
    fatal: true,
  },
  // ── Non fatals : le cours normal de l'écoute continue ──────────────────────
  'no-speech': { message: '', fatal: false },
  aborted: { message: '', fatal: false },
};

/**
 * Ce qu'on dit d'un code d'erreur, et s'il faut renoncer.
 *
 * Un code inconnu n'est PAS traité comme fatal : la spécification peut évoluer,
 * et les navigateurs en inventent. On le nomme, on laisse la relance tenter sa
 * chance, et le journal garde le code brut pour qu'il soit identifiable.
 */
export function diagnostiquerMicro(code: string | undefined | null): DiagnosticMicro {
  const brut = (code ?? '').trim();
  const connu = TABLE[brut];
  if (connu) return { message: connu.message, fatal: connu.fatal, code: brut || 'inconnu' };
  return {
    message: `La dictée s’est interrompue (${brut || 'cause inconnue'}). Réessaie.`,
    fatal: false,
    code: brut || 'inconnu',
  };
}

/**
 * Le message servi après plusieurs relances sans un mot entendu.
 *
 * Distinct des erreurs ci-dessus, et c'est le point : « je n'ai rien entendu »
 * ne doit se dire QUE lorsqu'on a réellement écouté sans rien capter — jamais
 * comme fourre-tout d'un échec dont on ignore la cause.
 */
export const MESSAGE_RIEN_ENTENDU =
  'Je n’ai rien entendu. Vérifie que le bon micro est sélectionné, puis réessaie.';
