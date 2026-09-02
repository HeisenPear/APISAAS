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
import { creerDiagnostiqueurMicro, MESSAGE_RIEN_ENTENDU } from '~/utils/erreurMicro';
import { memoireLocaleEchecsMicro, detecterAppareil } from '~/utils/memoireEchecsMicro';

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

  function arreter(): void {
    arretDemande = true;
    journaliser('arrêt demandé');
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
      // Rien de neuf depuis la dernière relance : on compte, et on renonce au
      // bout de quelques tours plutôt que de tourner en boucle indéfiniment.
      relancesAVide++;
      if (relancesAVide > RELANCES_MAX_A_VIDE) {
        actif.value = false;
        maya.setDicteeEnCours(false);
        // Réservé au cas où c'est VRAI : on a écouté, on n'a rien capté. Ce
        // message ne doit plus servir de fourre-tout — chaque autre cause a
        // désormais sa phrase, et le journal garde la séquence exacte.
        erreur.value = MESSAGE_RIEN_ENTENDU;
        journaliser('abandon:aucun-son');
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
    journaliser(`demarrer · réveil vocal ${maya.reveilVocal ? 'ACTIF' : 'inactif'}`);
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

  return { supporte, actif, erreur, journal, demarrer, arreter, basculer };
}
