// ═══════════════════════════════════════════════════════════════════════════
// DICTÉE VOCALE — reconnaissance de la parole via l'API Web Speech du navigateur
// (types + fabrique partagés : `~/utils/webSpeech`). Gratuite et sans clé de
// notre côté — mais ⚠️ PAS sur l'appareil : sur tout navigateur Chromium, la
// parole part vers le service de reconnaissance distant de Google. Cf. l'en-tête
// de `~/utils/webSpeech` et le code « network » de `~/utils/erreurMicro`.
// Firefox ne la propose pas → `supporte=false` et l'appelant masque proprement
// le bouton.
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
import { creerDiagnostiqueurMicro, MESSAGE_RIEN_ENTENDU } from '~/utils/erreurMicro';
import { memoireLocaleEchecsMicro, detecterAppareil } from '~/utils/memoireEchecsMicro';
import { compteurApresSession } from '~/utils/sessionSaine';

/** Callback qui reçoit le transcript courant (interim compris) et s'il est final. */
export type SurTexteDicte = (texte: string, final: boolean) => void;

/** Réglages d'une session de dictée. */
export interface OptionsDictee {
  /**
   * LA FIN D'UN ÉNONCÉ — appelée quand l'apiculteur a fini de parler.
   *
   * ⚠️ « FINI DE PARLER » N'EST PAS « le moteur a rendu un résultat final ». Le
   * moteur clôt un résultat à la moindre respiration : « j'ai vu la reine…
   * [souffle] …sur le cadre 4 » en produit deux. Envoyer au premier couperait
   * l'apiculteur au milieu de sa phrase, et c'est exactement ce qu'on ne peut
   * pas se permettre quand il a les mains dans une ruche.
   *
   * On attend donc un SILENCE (`silenceMs`) après le dernier mot. C'est la
   * seule mesure honnête de la fin d'un énoncé sans modèle de langage.
   */
  surEnonce?: (texte: string) => void;
  /** Durée de silence qui clôt un énoncé. Sans `surEnonce`, sans effet. */
  silenceMs?: number;
}

/** Repos entre deux relances : sans lui, une erreur immédiate boucle à plein régime. */
const REPOS_RELANCE_MS = 260;
/**
 * Relances consécutives ANORMALES avant d'abandonner. Le micro peut être pris
 * par une autre application ou refusé au niveau du système : mieux vaut
 * s'arrêter et le dire que de harceler le navigateur.
 */
const RELANCES_MAX_A_VIDE = 6;
/**
 * ⚠️ « UNE SESSION SAINE » A DÉMÉNAGÉ DANS `~/utils/sessionSaine`, ET C'ÉTAIT
 * NÉCESSAIRE. La règle vivait ici seule ; le réveil vocal a exactement le même
 * `onend` et exactement le même compteur, et ne l'a jamais eue. Un apiculteur
 * qui travaille en silence tuait donc son « Salut Maya » — le défaut réparé ici
 * pour la dictée, intact trois fichiers plus loin. L'histoire complète est dans
 * l'en-tête du module partagé.
 */

/** Silence par défaut qui clôt un énoncé, quand `surEnonce` est fourni. */
const SILENCE_FIN_ENONCE_MS = 1_100;

/**
 * ⚠️ AU NIVEAU DU MODULE, PAS DANS LE COMPOSABLE. Ce que ce diagnostiqueur
 * retient n'est une propriété ni d'un bouton ni d'un écran : c'est une
 * propriété du NAVIGATEUR — il joint le service de reconnaissance, ou il ne le
 * joint pas. Recréé à chaque montage, il ne compterait jamais jusqu'à deux, et
 * on répéterait « réessaie » à quelqu'un pour qui réessayer ne peut rien
 * changer.
 */
const diagnostiquer = creerDiagnostiqueurMicro(
  // La mémoire SURVIT au rechargement : sans ça, le message durable n'arrivait
  // jamais. Le premier échec réseau est fatal et coupe la relance, donc deux
  // échecs dans la MÊME session ne se produisent pas — et la fermeture de
  // module repartait de zéro à chaque chargement de page. Sur un navigateur où
  // la dictée ne peut pas marcher, la dictée répétait « réessaie » à l'infini.
  memoireLocaleEchecsMicro('dictee'),
  detecterAppareil(),
);

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
  /** Le point de fin d'énoncé (endpointing), armé après chaque mot entendu. */
  let silence: ReturnType<typeof setTimeout> | null = null;
  let options: OptionsDictee = {};
  /**
   * A-t-on entendu UN SEUL mot depuis le début de cette dictée ?
   *
   * ⚠️ C'EST CE QUI DÉCIDE SI « Je n'ai rien entendu » EST VRAI. Ce message
   * partait dès que les relances s'épuisaient — y compris après une phrase
   * parfaitement transcrite. Il envoyait vérifier le micro à quelqu'un dont le
   * micro venait de marcher.
   */
  let aEntendu = false;
  /** Horodatage du dernier `start()`, pour mesurer si la session a vécu. */
  let debutSession = 0;
  /** `onstart` a-t-il été appelé ? Sinon le micro ne nous a jamais été donné. */
  let aDemarre = false;

  /**
   * JOURNAL DE DIAGNOSTIC — la seule façon honnête de comprendre une panne micro.
   *
   * Le comportement réel de l'API Web Speech dépend du navigateur, du système,
   * de la disponibilité d'un service distant et de qui tient le micro à cet
   * instant. Rien de tout cela ne se reproduit ici : on ne peut que RELEVER la
   * séquence vécue par l'apiculteur et la lire.
   *
   * Vingt entrées suffisent — au-delà, on regarde une autre panne. Horodatage
   * relatif : ce sont les ÉCARTS qui parlent (une session qui meurt à 40 ms ne
   * raconte pas la même chose qu'une qui tient six secondes).
   */
  const journal = ref<string[]>([]);
  const depart = import.meta.client ? performance.now() : 0;

  function journaliser(evenement: string): void {
    if (!import.meta.client) return;
    const t = Math.round(performance.now() - depart);
    journal.value = [...journal.value.slice(-19), `${t} ms · ${evenement}`];
  }

  function purgerMinuteur(): void {
    if (minuteur) {
      clearTimeout(minuteur);
      minuteur = null;
    }
  }

  function purgerSilence(): void {
    if (silence) {
      clearTimeout(silence);
      silence = null;
    }
  }

  /**
   * Relance le compte à rebours de fin d'énoncé. Appelé à CHAQUE mot entendu,
   * intermédiaire compris : c'est ce qui empêche d'envoyer au milieu d'une
   * phrase entrecoupée de respirations.
   */
  function armerFinEnonce(): void {
    if (!options.surEnonce) return;
    purgerSilence();
    silence = setTimeout(() => {
      silence = null;
      const texte = acquis.trim();
      if (!texte) return;
      // L'énoncé part : on repart d'une page blanche pour le suivant, sinon la
      // question d'après contiendrait celle d'avant.
      acquis = '';
      journaliser(`fin d’énoncé · ${texte.length} caractères`);
      options.surEnonce?.(texte);
    }, options.silenceMs ?? SILENCE_FIN_ENONCE_MS);
  }

  function arreter(): void {
    arretDemande = true;
    journaliser('arrêt demandé');
    purgerMinuteur();
    purgerSilence();
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
      aDemarre = true;
      journaliser('onstart · le micro est à nous');
    };

    r.onerror = (e) => {
      /**
       * TOUS les codes passent par la table (`~/utils/erreurMicro`), pas trois.
       *
       * Avant, `network` — le service de reconnaissance de Chrome est distant et
       * peut être injoignable — n'était traité nulle part : il tombait dans la
       * relance, puis, six tours plus tard, dans « je n'ai rien entendu, approche
       * le micro ». Le seul conseil qui ne pouvait pas aider.
       */
      const diag = diagnostiquer(e.error);
      journaliser(`onerror:${diag.code}`);
      if (diag.fatal) {
        erreur.value = diag.message;
        arretDemande = true;
      }
      // Les codes non fatals (`no-speech`, `aborted`) sont le cours NORMAL de
      // l'écoute continue : le navigateur ferme la session, `onend` suit, la
      // relance reprend. Les afficher dirait une panne alors qu'on écoute.
    };

    r.onend = () => {
      reco = null;
      journaliser(`onend · session fermée (relances à vide : ${relancesAVide})`);
      if (arretDemande) {
        actif.value = false;
        maya.setDicteeEnCours(false);
        return;
      }
      /**
       * ⚠️ ON NE COMPTE QUE LES SESSIONS MORT-NÉES. Une session qui a obtenu le
       * micro et vécu près d'une seconde avant de se refermer sur un silence est
       * le fonctionnement NORMAL de l'écoute continue : la compter faisait
       * mourir la dictée au bout de six respirations.
       */
      relancesAVide = compteurApresSession(relancesAVide, {
        aDemarre,
        vecuMs: Math.round(performance.now() - debutSession),
      });
      if (relancesAVide > RELANCES_MAX_A_VIDE) {
        actif.value = false;
        maya.setDicteeEnCours(false);
        purgerSilence();
        /**
         * ⚠️ ON NE DIT « je n'ai rien entendu » QUE SI C'EST VRAI. Ce message
         * partait même après une phrase parfaitement transcrite — il envoyait
         * vérifier le micro à quelqu'un dont le micro venait de marcher. Quand
         * on a entendu, on s'arrête en SILENCE : rien n'est perdu, le texte est
         * dans le champ, et l'apiculteur reprend d'un appui.
         */
        if (!aEntendu) erreur.value = MESSAGE_RIEN_ENTENDU;
        journaliser(aEntendu ? 'arrêt · micro repris ailleurs' : 'abandon:aucun-son');
        return;
      }
      purgerMinuteur();
      journaliser(`relance dans ${REPOS_RELANCE_MS} ms`);
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
      aEntendu = true;
      erreur.value = null;
      // Chaque mot repousse la fin d'énoncé : on n'envoie qu'après un silence.
      armerFinEnonce();
      // Le texte rendu est CUMULÉ : l'appelant remplace son brouillon par cette
      // valeur, et une relance ne doit pas lui faire perdre la phrase d'avant.
      rappel?.(`${acquis} ${interim}`.trim(), final);
    };

    reco = r;
    aDemarre = false;
    debutSession = import.meta.client ? performance.now() : 0;
    try {
      r.start();
    } catch {
      // start() jette si une session est déjà en cours (double appui rapide).
      reco = null;
    }
  }

  function demarrer(onTexte: SurTexteDicte, opts: OptionsDictee = {}): void {
    if (actif.value) return;
    erreur.value = null;
    arretDemande = false;
    acquis = '';
    relancesAVide = 0;
    aEntendu = false;
    options = opts;
    purgerSilence();
    rappel = onTexte;
    // Le réveil vocal « Salut Maya » écoute peut-être déjà : deux
    // reconnaissances sur le même micro et le navigateur en tue une sur-le-champ.
    // C'était l'autre raison des coupures immédiates, sur la page Maya où la
    // bulle est fermée — donc où le réveil est actif.
    maya.setDicteeEnCours(true);
    journaliser(`demarrer · réveil vocal ${maya.reveilVocal ? 'ACTIF' : 'inactif'}`);
    ouvrirSession();
  }

  /** Bascule écoute ↔ arrêt (l'usage naturel du bouton micro). */
  function basculer(onTexte: SurTexteDicte, opts: OptionsDictee = {}): void {
    if (actif.value) arreter();
    else demarrer(onTexte, opts);
  }

  onScopeDispose(() => {
    arretDemande = true;
    purgerMinuteur();
    purgerSilence();
    maya.setDicteeEnCours(false);
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { supporte, actif, erreur, journal, demarrer, arreter, basculer };
}
