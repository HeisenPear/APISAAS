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
// ⚠️ LA SYNTHÈSE N'EST LOCALE QUE SI LA VOIX L'EST, et l'en-tête l'affirmait
// sans condition. `SpeechSynthesisVoice.localService` distingue une voix
// embarquée d'une voix SERVIE À DISTANCE ; le repli acceptait la seconde en
// silence, et ce sont les RÉPONSES de Maya qui partaient chez l'éditeur du
// navigateur — noms de ruchers, noms de clients, chiffres de récolte.
//
// On ne parle donc qu'avec une voix EMBARQUÉE. C'est la règle du dépôt
// appliquée telle quelle — « inconnu ne vaut jamais laisse-passer » — et elle
// a sa porte de sortie : là où aucune voix locale française n'existe,
// `supporte` est faux et la boucle vocale continue sans la voix, comme sur
// Firefox. L'engagement « zéro modèle de langage », lui, reste entier : la
// synthèse n'est pas un modèle de langage.
// ═══════════════════════════════════════════════════════════════════════════
import { texteAOraliser, vautLaPeineDEtreDit } from '~/utils/paroleMaya';

/** L'API de synthèse du navigateur, ou null. */
function synthese(): SpeechSynthesis | null {
  if (!import.meta.client) return null;
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

/**
 * ⚠️ AUCUNE ÉNONCIATION NE DURE PLUS LONGTEMPS QUE ÇA. `end` et `error` sont
 * deux évènements que certains navigateurs n'émettent JAMAIS quand la synthèse
 * est interrompue par le système — appel entrant, mise en veille, onglet
 * suspendu. Sans borne, la promesse de `dire()` reste en suspens, la boucle
 * vocale ne rouvre plus jamais le micro, et rien à l'écran ne l'explique : un
 * mode vocal figé et muet.
 *
 * ⚠️ ET ELLE DÉPEND DU TEXTE. Une borne fixe de trente secondes coupait 79 des
 * 484 textes du savoir au milieu d'une phrase — la fiche varroa fait
 * 1 227 caractères, soit près d'une minute de synthèse. 80 ms par caractère,
 * c'est 12,5 caractères par seconde : la moitié du débit réel, donc une marge
 * franche et jamais une coupure.
 */
function borneDeParole(texteDit: string): number {
  return 10_000 + texteDit.length * 80;
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
    /**
     * ⚠️ EMBARQUÉE, OU RIEN. Les deux replis retirés acceptaient une voix
     * SERVIE À DISTANCE : le texte de Maya — noms de ruchers, de clients,
     * chiffres de récolte — partait alors chez l'éditeur du navigateur, sans
     * que personne l'ait décidé et sans que rien ne le dise.
     *
     * Le repli sur `fr-*` reste, lui : une voix québécoise ou belge EMBARQUÉE
     * lit le français correctement, et rien ne sort de l'appareil.
     */
    voix =
      dispo.find((v) => v.lang === 'fr-FR' && v.localService) ??
      dispo.find((v) => v.lang?.startsWith('fr') && v.localService) ??
      null;
    /**
     * ⚠️ `supporte` DISAIT « l'API existe », PAS « Maya peut parler ». La
     * nuance n'en était pas une du jour où le repli distant a été retiré : sur
     * un système sans voix française embarquée, l'API répond présente et
     * `dire()` ne dit rien. Le drapeau suit donc la VOIX, seule chose dont
     * dépend vraiment la parole — et il se réévalue à chaque `voiceschanged`,
     * parce que Chrome livre ses voix après coup.
     */
    supporte.value = voix !== null;
  }

  onMounted(() => {
    const s = synthese();
    if (!s) return;
    choisirVoix();
    s.addEventListener?.('voiceschanged', choisirVoix);
  });

  onScopeDispose(() => {
    const s = synthese();
    s?.removeEventListener?.('voiceschanged', choisirVoix);
    taire();
  });

  /**
   * CE QUI REND LA PROMESSE EN COURS, QUOI QU'IL ARRIVE.
   *
   * ⚠️ SANS ÇA, LA PROMESSE DE `dire()` EST FAUSSE SUR QUATRE CHEMINS — et son
   * commentaire affirmait le contraire. `taire()` appelle `cancel()`, qui
   * n'émet `end` sur AUCUN navigateur de façon garantie ; un second `dire()`
   * écrase le premier ; le démontage coupe tout ; et un navigateur muet ne
   * répond jamais. Dans les quatre cas, la boucle vocale attendait une main
   * qu'on ne lui rendait plus.
   */
  let rendreLaMain: (() => void) | null = null;

  function conclureParole(): void {
    const rendre = rendreLaMain;
    rendreLaMain = null;
    parle.value = false;
    rendre?.();
  }

  /** Coupe la parole immédiatement (l'apiculteur reprend la main). */
  function taire(): void {
    const s = synthese();
    /**
     * ⚠️ ON REND LA MAIN AVANT TOUT — c'est le geste qui doit TOUJOURS aboutir.
     *
     * Aucune mutation ne distingue cet ordre de l'inverse, et c'est dit ici
     * plutôt que caché : `rendreLaMain` n'est posé que par un `dire()` qui a
     * trouvé une synthèse, donc « promesse en attente ET synthèse disparue » ne
     * s'atteint pas. On garde malgré tout l'ordre qui exprime l'invariant —
     * « taire rend la main » — parce qu'il ne coûte rien et que l'inverse
     * inviterait, au prochain refactor, à faire dépendre la libération d'une
     * condition qui n'a rien à voir avec elle.
     */
    conclureParole();
    if (!s) return;
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
    /**
     * On rend la main TOUT DE SUITE dans trois cas — une énonciation qui ne
     * part pas n'émettrait jamais `end`, et la boucle vocale attendrait une
     * main perdue :
     *
     *   · navigateur sans synthèse (Firefox mobile) ;
     *   · texte que le nettoyage a vidé ;
     *   · ⚠️ AUCUNE VOIX EMBARQUÉE FRANÇAISE. C'est le refus qui compte : sans
     *     lui, `choisirVoix` avait beau rendre `null`, `speak()` partait quand
     *     même et le navigateur choisissait LUI-MÊME sa voix — c'est-à-dire,
     *     sur Chrome, une voix servie à distance. Le repli qu'on venait de
     *     retirer d'un côté revenait par l'autre, en pire : sans trace.
     */
    if (!s || !voix || !vautLaPeineDEtreDit(texte)) {
      conclureParole();
      return Promise.resolve();
    }

    // Un second `dire()` remplace le premier : `taire()` rend sa main avant que
    // la nouvelle énonciation ne prenne la place.
    taire();
    const enonce = new SpeechSynthesisUtterance(texteAOraliser(texte));
    enonce.lang = voix.lang || 'fr-FR';
    enonce.voice = voix;
    // Un peu au-dessus du naturel : sur le terrain, on veut l'information, pas
    // une lecture posée. Reste très en deçà du seuil où l'on décroche.
    enonce.rate = 1.06;
    enonce.pitch = 1;

    return new Promise<void>((resoudre) => {
      let rendu = false;
      let minuteur: ReturnType<typeof setTimeout> | null = null;
      const finir = (): void => {
        if (rendu) return;
        rendu = true;
        if (minuteur) clearTimeout(minuteur);
        // Ne rend la main que si c'est BIEN cette énonciation-ci qui finit :
        // un second `dire()` a pu prendre la place entre-temps.
        if (rendreLaMain === finir) conclureParole();
        else parle.value = false;
        resoudre();
      };
      // `taire()`, le démontage et un second `dire()` passent par ici.
      rendreLaMain = finir;
      enonce.onend = finir;
      enonce.onerror = finir;
      parle.value = true;
      // Le filet : un navigateur qui n'émet ni `end` ni `error` ne fige plus
      // la boucle. La borne suit la longueur du texte (cf. `borneDeParole`).
      minuteur = setTimeout(finir, borneDeParole(enonce.text));
      try {
        s.speak(enonce);
      } catch {
        finir();
      }
    });
  }

  return { supporte, parle, dire, taire };
}
