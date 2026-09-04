// ═══════════════════════════════════════════════════════════════════════════
// RÉVEIL VOCAL « Salut Maya » — lecteur d'écoute continue (option 1 validée).
//
// Écoute UNIQUEMENT quand : l'option est activée (opt-in), le navigateur sait
// reconnaître la parole, l'onglet est au premier plan, ET la bulle est fermée.
// → jamais en arrière-plan ni téléphone verrouillé (pas de vrai « always-on »,
//   c'est le choix assumé), et pas pendant qu'on interagit déjà avec la bulle
//   (ce qui évite deux reconnaissances simultanées sur le micro).
//
// Le navigateur coupe périodiquement l'écoute continue → on la relance dans
// `onend` tant que les conditions tiennent. Si le micro est refusé, on coupe
// proprement l'option (pas de boucle de relance infinie).
//
// ⚠️ Le comportement micro live ne se teste pas hors navigateur : le CŒUR pur
//    (détection de la phrase) est couvert par `reveilVocal.test.ts`.
// ═══════════════════════════════════════════════════════════════════════════
import { compteurApresSession } from '~/utils/sessionSaine';
import { creerDetecteurReveil } from '~/utils/reveilVocal';
import { creerReconnaissance, type Reconnaissance } from '~/utils/webSpeech';
import type { DecisionReveil } from '~/utils/reveilVocal';
import { creerDiagnostiqueurMicro } from '~/utils/erreurMicro';
import { memoireLocaleEchecsMicro, detecterAppareil } from '~/utils/memoireEchecsMicro';

/** Repos entre deux relances : sans lui, une coupure immédiate boucle à plein régime. */
const REPOS_RELANCE_MS = 400;
/** Relances consécutives sans un mot entendu avant de passer en repos long. */
const RELANCES_MAX_A_VIDE = 12;
/**
 * ⚠️ CE PALIER EST NÉ D'UN DÉFAUT : LE RÉVEIL SE TAISAIT POUR TOUJOURS, SANS UN
 * MOT, PENDANT QUE LE RÉGLAGE AFFICHAIT « activé ».
 *
 * Après douze relances à vide, l'ancien code posait `bloque = true` et rendait
 * la main. Or `bloque` entre dans `doitEcouter` : une fois levé, la condition
 * est fausse pour toujours, le `watch` ne se redéclenche jamais, et rien ne
 * repart — ni au retour au premier plan, ni à la fin d'une dictée. L'apiculteur
 * disait « Salut Maya » dans le vide, en croyant l'option active.
 *
 * Or douze coupures rapides ne veulent PAS dire « impossible » : le micro est
 * souvent pris quelques secondes par une autre application, un appel, une note
 * vocale. On passe donc en repos long, on retente, et ce n'est qu'après trois
 * cycles complets qu'on renonce — en le DISANT, et en nommant où relancer.
 */
const REPOS_LONG_MS = 30_000;
/** Cycles de repos long avant de renoncer pour de bon. */
const CYCLES_LONGS_MAX = 3;
/**
 * Délai de confirmation d'un intermédiaire, quand aucun second intermédiaire
 * n'arrive. Court à dessein : c'est le temps qui sépare « Salut Maya » de la
 * bulle qui apparaît, et c'est tout l'objet de ce changement.
 */
const CONFIRMATION_MS = 220;
/**
 * Garde-fou du passage de relais : au-delà, le réveil rend le micro même sans
 * résultat final.
 *
 * ⚠️ SANS LUI, LE MICRO POURRAIT NE JAMAIS ÊTRE RENDU. Le final peut ne jamais
 * venir — la session se ferme sur une erreur, l'apiculteur ouvre la bulle et se
 * tait, le moteur reste muet. La dictée de la bulle attend `transfertVocal`
 * baissé : elle ne démarrerait plus jamais, et le mode vocal resterait ouvert
 * sur un micro que personne n'écoute.
 */
const TRANSFERT_MAX_MS = 4_000;

/**
 * Son propre diagnostiqueur, au niveau du module — même raison qu'en dictée :
 * c'est le navigateur qu'on mesure, pas le composant. Instance distincte de
 * celle de la dictée à dessein : les deux lecteurs ne partagent ni leur cycle
 * de vie, ni le moment où l'apiculteur les déclenche.
 */
const diagnostiquer = creerDiagnostiqueurMicro(
  // La mémoire SURVIT au rechargement : sans ça, le message durable n'arrivait
  // jamais. Le premier échec réseau est fatal et coupe la relance, donc deux
  // échecs dans la MÊME session ne se produisent pas — et la fermeture de
  // module repartait de zéro à chaque chargement de page. Sur un navigateur où
  // la dictée ne peut pas marcher, le réveil vocal répétait « réessaie » à l'infini.
  memoireLocaleEchecsMicro('reveil'),
  detecterAppareil(),
);

export function useReveilMaya() {
  const maya = useMayaStore();
  /**
   * CAPTURÉ ICI, PENDANT LE SETUP — pas dans le rappel `onerror`.
   *
   * ⚠️ ET LA RAISON N'EST PAS CELLE QUE J'AI CRUE. La première version appelait
   * `useToast()` directement dans `onerror`, et je l'ai corrigée en annonçant un
   * plantage. Vérification faite dans les sources de Nuxt : il n'y en a pas.
   * `useNuxtApp()` jette bien « [nuxt] instance unavailable » quand il ne trouve
   * pas de contexte, mais CÔTÉ NAVIGATEUR il en trouve toujours un : le contexte
   * y est posé en singleton (`nuxtAppCtx.set(nuxt)` dans `callWithNuxt`,
   * `asyncContext` étant réservé au serveur) et n'est jamais retiré — `unset()`
   * n'est appelé nulle part dans le code client. Un rappel du navigateur y a donc
   * accès comme n'importe quel autre code de la page.
   *
   * Ce qui reste vrai, et suffit à justifier la capture : cette garantie tient à
   * un détail d'implémentation non documenté. Le même code JETTERAIT si
   * `experimental.asyncContext` était activé, au rendu serveur, ou en `multiApp`.
   * Et c'est déjà la forme employée par `useNotifications` et `usePostAction` :
   * on résout le composable une fois, on n'appelle plus que la fonction rendue.
   * Gardé par `tests/unit/app/composables/composableHorsSetup.test.ts`.
   */
  const toast = useToast();
  const visible = ref(true);
  const bloque = ref(false); // micro refusé → on n'insiste pas
  const ecoute = ref(false);
  let reco: Reconnaissance | null = null;
  let relancesAVide = 0;
  let cyclesLongs = 0;
  /**
   * ⚠️ CE QUI DISTINGUE UN SILENCE D'UNE PANNE. Sans ces deux-là, `onend`
   * comptait TOUTES les fermetures — or l'écoute continue se referme d'elle-même
   * à chaque silence. Un apiculteur qui travaille sans parler faisait donc
   * mourir son propre réveil vocal. La règle vit dans `~/utils/sessionSaine`,
   * partagée avec la dictée, parce que c'est de l'avoir écrite là-bas seulement
   * que vient ce défaut.
   */
  let debutSession = 0;
  let aDemarre = false;
  let minuteur: ReturnType<typeof setTimeout> | null = null;
  let confirmation: ReturnType<typeof setTimeout> | null = null;
  let gardeTransfert: ReturnType<typeof setTimeout> | null = null;
  const detecteur = creerDetecteurReveil();

  const doitEcouter = computed(
    () =>
      maya.reveilVocal &&
      /**
       * ⚠️ LA DICTÉE COUPÉE COUPE AUSSI LE RÉVEIL, et ce n'est pas une
       * précaution de confort. « Salut Maya » n'ouvre pas seulement la bulle :
       * il DICTE la phrase qui suit. Laisser le réveil écouter alors que
       * l'apiculteur a éteint la dictée ouvrirait un microphone qu'il vient de
       * refuser, pour livrer une commande que rien n'attend.
       */
      maya.dicteeAutorisee &&
      /**
       * ⚠️ `transfertVocal` FAIT EXCEPTION À « bulle fermée », et c'est le cœur
       * de l'ouverture rapide. La bulle apparaît sur un intermédiaire (« Salut
       * Maya »), mais la phrase n'est pas finie : rendre le micro ici perdrait
       * « …comment vont mes ruches ? ». Le réveil garde donc la main jusqu'au
       * résultat final, puis la passe à la dictée.
       */
      (!maya.bubbleOpen || maya.transfertVocal) &&
      // Une DICTÉE en cours prend le micro. Deux reconnaissances simultanées et
      // le navigateur en tue une sur-le-champ : le réveil faisait taire la
      // dictée au bout d'une seconde sur la page Maya (bulle fermée, donc
      // réveil actif). Il cède la place, et la reprend à la fin.
      !maya.dicteeEnCours &&
      visible.value &&
      !bloque.value,
  );

  function purgerMinuteur(): void {
    if (minuteur) {
      clearTimeout(minuteur);
      minuteur = null;
    }
  }

  function purgerConfirmation(): void {
    if (confirmation) {
      clearTimeout(confirmation);
      confirmation = null;
    }
  }

  function purgerGardeTransfert(): void {
    if (gardeTransfert) {
      clearTimeout(gardeTransfert);
      gardeTransfert = null;
    }
  }

  function arreter(): void {
    purgerMinuteur();
    purgerConfirmation();
    detecteur.reinitialiser();
    try {
      reco?.stop();
    } catch {
      /* déjà arrêtée */
    }
  }

  /**
   * Exécute la décision du détecteur. Un seul endroit : c'est ici que se joue le
   * passage de relais du micro, et le dupliquer entre `onresult` et le minuteur
   * de confirmation aurait fait diverger les deux chemins.
   */
  function appliquer(d: DecisionReveil): void {
    switch (d.action) {
      case 'rien':
        return;
      case 'patienter':
        // Un seul intermédiaire a dit réveil. On lui laisse un dixième pour être
        // contredit par une révision ; sinon on ouvre.
        purgerConfirmation();
        confirmation = setTimeout(() => {
          confirmation = null;
          appliquer(detecteur.confirmer());
        }, CONFIRMATION_MS);
        return;
      case 'ouvrir':
        purgerConfirmation();
        // La bulle apparaît, le micro RESTE ici : la phrase n'est pas finie.
        maya.ouvrirPourLaVoix();
        armerGardeTransfert();
        return;
      case 'livrer':
        purgerConfirmation();
        purgerGardeTransfert();
        // Un final peut arriver sans qu'on ait jamais ouvert (l'apiculteur a
        // parlé d'un trait) : on ouvre alors ET on livre.
        if (!maya.bubbleOpen) maya.ouvrirPourLaVoix();
        maya.livrerCommandeVocale(d.commande);
        detecteur.reinitialiser();
        return;
    }
  }

  function armerGardeTransfert(): void {
    purgerGardeTransfert();
    gardeTransfert = setTimeout(() => {
      gardeTransfert = null;
      // Le final n'est jamais venu. On rend le micro sans commande : la dictée
      // de la bulle prend le relais et l'apiculteur reformule.
      if (maya.transfertVocal) maya.livrerCommandeVocale('');
      detecteur.reinitialiser();
    }, TRANSFERT_MAX_MS);
  }

  function demarrer(): void {
    if (reco || !doitEcouter.value) return;
    /**
     * ⚠️ `interimResults: true` — ET C'EST LA RAISON D'ÊTRE DE CE CHANGEMENT.
     *
     * Un résultat FINAL n'arrive qu'après un silence : le moteur attend d'être
     * sûr. « Salut Maya » mettait donc une à deux secondes à ouvrir la bulle.
     * Les intermédiaires arrivent en deux à quatre dixièmes ; ce qu'ils coûtent
     * — ils se révisent — est traité par le détecteur, qui exige une
     * confirmation avant d'ouvrir, et n'accepte la COMMANDE que sur le final.
     */
    const r = creerReconnaissance({ continuous: true, interimResults: true });
    if (!r) return;
    r.onstart = () => {
      ecoute.value = true;
      aDemarre = true;
      debutSession = import.meta.client ? performance.now() : 0;
    };
    r.onerror = (e) => {
      /**
       * ⚠️ IL Y AVAIT ICI SA PROPRE LISTE DE CODES, RECOPIÉE ET COURTE — deux
       * sur huit (`not-allowed`, `service-not-allowed`). La table complète
       * existait déjà à côté, pour la dictée.
       *
       * `network` n'y figurait pas. Sur un navigateur qui ne joint pas le
       * service de reconnaissance, le réveil relançait donc douze fois toutes
       * les 400 ms, se taisait sans un mot — et `watch(doitEcouter)` remettait
       * le compteur à zéro à chaque retour au premier plan et à chaque fin de
       * dictée. Une boucle qui repart indéfiniment, l'indicateur
       * d'enregistrement qui clignote, la batterie qui descend, et aucune
       * explication pour l'apiculteur.
       *
       * `bloque` seul ne suffisait pas : il est local au composable, et le
       * `watch` le ressuscite. Sur une cause définitive on coupe l'OPTION.
       */
      const diag = diagnostiquer(e.error);
      if (!diag.fatal) return; // 'no-speech' / 'aborted' : `onend` relance.
      bloque.value = true;
      maya.setReveilVocal(false);
      // Une option qui se coupe toute seule et en silence ressemble à une panne
      // de l'application. On dit ce qui s'est passé, une fois, et on en reste là.
      if (diag.message) {
        toast.add({ title: 'Réveil vocal désactivé', description: diag.message });
      }
    };
    r.onend = () => {
      ecoute.value = false;
      reco = null;
      if (!doitEcouter.value) return;
      // Le navigateur coupe l'écoute continue par intermittence : on relance —
      // mais APRÈS un repos. Relancer dans la foulée de `onend` créait une
      // boucle serrée quand la session se refermait aussitôt (micro occupé,
      // service indisponible) : `start` → `onend` → `start`… à plein régime,
      // avec l'indicateur d'enregistrement qui clignote sans fin.
      /**
       * ⚠️ ON NE COMPTE QUE LES SESSIONS MORT-NÉES. Ce `++` était inconditionnel,
       * et c'est le silence qu'il comptait : douze respirations et le réveil
       * s'espaçait de trente secondes sans un mot, quatre cycles et il se
       * déclarait en panne en accusant une autre application de tenir le micro.
       * Personne ne le tenait — l'apiculteur se taisait.
       */
      relancesAVide = compteurApresSession(relancesAVide, {
        aDemarre,
        vecuMs: import.meta.client ? performance.now() - debutSession : Number.NaN,
      });
      aDemarre = false;
      if (relancesAVide > RELANCES_MAX_A_VIDE) {
        // Douze coupures rapides : quelque chose tient le micro. On ESPACE au
        // lieu de renoncer — un appel, une note vocale, une autre application se
        // terminent d'eux-mêmes.
        relancesAVide = 0;
        cyclesLongs++;
        if (cyclesLongs > CYCLES_LONGS_MAX) {
          bloque.value = true;
          /**
           * ⚠️ ET ON COUPE L'OPTION, comme le fait le chemin fatal. Sans ça le
           * réglage continuait d'afficher « activé » sur un réveil mort, et le
           * message ci-dessous nommait une porte de sortie qui ne s'ouvrait
           * pas : `bloque` entre dans `doitEcouter`, donc rebasculer l'option
           * ne produisait AUCUNE transition — rien ne repartait, sauf un
           * rechargement complet de la page.
           */
          maya.setReveilVocal(false);
          // ⚠️ ON LE DIT. Se taire ici laissait l'apiculteur appeler dans le
          // vide devant un réglage qui affichait « activé ». Un refus qui ne
          // nomme pas sa porte de sortie laisse devant un mur.
          toast.add({
            title: 'Réveil vocal en pause',
            description:
              'Je n’arrive pas à garder le micro — une autre application le tient peut-être. ' +
              'Relance-le depuis Réglages › Maya quand tu veux.',
          });
          return;
        }
        purgerMinuteur();
        minuteur = setTimeout(demarrer, REPOS_LONG_MS);
        return;
      }
      purgerMinuteur();
      minuteur = setTimeout(demarrer, REPOS_RELANCE_MS);
    };
    r.onresult = (e) => {
      // On a entendu quelque chose : l'écoute fonctionne, les compteurs repartent.
      relancesAVide = 0;
      cyclesLongs = 0;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        appliquer(detecteur.observer(res[0]?.transcript ?? '', res.isFinal));
      }
    };
    reco = r;
    try {
      r.start();
    } catch {
      reco = null;
    }
  }

  function onVisibilite(): void {
    visible.value = !document.hidden;
  }

  /**
   * ⚠️ LA PORTE DE SORTIE, ET ELLE ÉTAIT MURÉE. Les deux abandons posent
   * `bloque` — qui entre dans `doitEcouter` — et coupent l'option. Or RIEN ne
   * rabaissait `bloque` : rebasculer « Salut Maya » dans Réglages ne produisait
   * aucune transition, donc rien ne repartait. Le message disait « Relance-le
   * depuis Réglages › Maya » en désignant une porte qui ne s'ouvrait pas ;
   * seul un rechargement complet de la page ressuscitait le réveil.
   *
   * Rallumer l'option est le geste par lequel l'apiculteur dit « réessaie ».
   * On l'écoute : on efface le blocage et les compteurs, et `doitEcouter`
   * redevient vrai de lui-même. Si la cause tient toujours, il le réapprendra
   * — mais c'est LUI qui aura décidé, pas un drapeau qu'il ne voit pas.
   */
  watch(
    () => maya.reveilVocal,
    (actif, avant) => {
      if (!actif || avant) return;
      bloque.value = false;
      relancesAVide = 0;
      cyclesLongs = 0;
    },
  );

  watch(doitEcouter, (ok) => {
    if (ok) {
      // Reprise après une dictée ou un retour au premier plan : les compteurs
      // repartent, sinon un blocage passé condamnerait la reprise.
      relancesAVide = 0;
      cyclesLongs = 0;
      demarrer();
    } else {
      arreter();
    }
  });

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilite);
    onVisibilite();
    if (doitEcouter.value) demarrer();
  });

  onScopeDispose(() => {
    purgerMinuteur();
    purgerConfirmation();
    purgerGardeTransfert();
    document.removeEventListener('visibilitychange', onVisibilite);
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { ecoute };
}
