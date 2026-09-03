// ═══════════════════════════════════════════════════════════════════════════
// MAYA RÉPOND À VOIX HAUTE — synthèse vocale du navigateur, en mode vocal seul.
//
// ⚠️ ELLE NE PARLE QUE QUAND ON LUI PARLE. La synthèse ne s'enclenche que dans
// la boucle vocale — jamais sur une question tapée. Une application qui se met
// à parler toute seule dans une salle de traite, un bureau, un train, est une
// application qu'on désinstalle.
//
// ⚠️ ET LE MICRO SE TAIT PENDANT QU'ELLE PARLE. C'est la contrainte physique
// qu'aucune astuce logicielle ne contourne : sur un téléphone posé à côté d'une
// ruche, haut-parleur allumé, le micro entend Maya. Sans cette coupure, elle se
// répondrait à elle-même — et chaque réponse relancerait la suivante. Siri fait
// exactement la même chose, pour exactement cette raison. Ce n'est pas « couper
// la dictée » au sens de l'arrêter : la boucle, elle, ne s'interrompt jamais —
// c'est l'appelant qui rend la parole dès la dernière syllabe.
//
// 100 % navigateur : `speechSynthesis` est local, gratuit, sans clé et sans
// appel réseau — cohérent avec l'engagement « zéro modèle de langage » affiché
// sur /maya. Safari et Chrome la proposent ; là où elle manque, `supporte` est
// faux et la boucle vocale continue sans la voix.
// ═══════════════════════════════════════════════════════════════════════════
import { texteAOraliser, vautLaPeineDEtreDit } from '~/utils/paroleMaya';

/** L'API de synthèse du navigateur, ou null. */
function synthese(): SpeechSynthesis | null {
  if (!import.meta.client) return null;
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function useVoixMaya() {
  const supporte = ref(false);
  const parle = ref(false);

  /**
   * La voix française du système, choisie UNE FOIS puis mémorisée.
   *
   * ⚠️ `getVoices()` rend souvent un tableau VIDE au premier appel : Chrome les
   * charge de façon asynchrone et prévient par `voiceschanged`. Choisir sans
   * attendre donnait une voix anglaise lisant du français — parfaitement
   * incompréhensible, et impossible à diagnostiquer depuis l'écran.
   */
  let voix: SpeechSynthesisVoice | null = null;

  function choisirVoix(): void {
    const s = synthese();
    if (!s) return;
    const dispo = s.getVoices();
    if (!dispo.length) return;
    voix =
      dispo.find((v) => v.lang === 'fr-FR' && v.localService) ??
      dispo.find((v) => v.lang === 'fr-FR') ??
      dispo.find((v) => v.lang?.startsWith('fr')) ??
      null;
  }

  onMounted(() => {
    const s = synthese();
    supporte.value = s !== null;
    if (!s) return;
    choisirVoix();
    s.addEventListener?.('voiceschanged', choisirVoix);
  });

  onScopeDispose(() => {
    const s = synthese();
    s?.removeEventListener?.('voiceschanged', choisirVoix);
    taire();
  });

  /** Coupe la parole immédiatement (l'apiculteur reprend la main). */
  function taire(): void {
    const s = synthese();
    if (!s) return;
    parle.value = false;
    try {
      s.cancel();
    } catch {
      /* rien à annuler */
    }
  }

  /**
   * Dit le texte, et RÉPOND quand elle a fini.
   *
   * ⚠️ LA PROMESSE SE RÉSOUT TOUJOURS, y compris quand la synthèse est absente,
   * quand le texte ne vaut pas la peine d'être dit, ou quand l'énonciation
   * échoue. L'appelant s'en sert pour rendre le micro : une promesse qui reste
   * en suspens laisserait la boucle vocale muette et l'apiculteur devant un
   * micro éteint, sans rien à l'écran pour l'expliquer.
   */
  function dire(texte: string): Promise<void> {
    const s = synthese();
    if (!s || !vautLaPeineDEtreDit(texte)) return Promise.resolve();

    taire();
    const enonce = new SpeechSynthesisUtterance(texteAOraliser(texte));
    enonce.lang = 'fr-FR';
    if (voix) enonce.voice = voix;
    // Un peu au-dessus du naturel : sur le terrain, on veut l'information, pas
    // une lecture posée. Reste très en deçà du seuil où l'on décroche.
    enonce.rate = 1.06;
    enonce.pitch = 1;

    return new Promise<void>((resoudre) => {
      let rendu = false;
      const finir = (): void => {
        if (rendu) return;
        rendu = true;
        parle.value = false;
        resoudre();
      };
      enonce.onend = finir;
      enonce.onerror = finir;
      parle.value = true;
      try {
        s.speak(enonce);
      } catch {
        finir();
      }
    });
  }

  return { supporte, parle, dire, taire };
}
