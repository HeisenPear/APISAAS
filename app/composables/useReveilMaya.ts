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
import { analyserReveil } from '~/utils/reveilVocal';
import { creerReconnaissance, type Reconnaissance } from '~/utils/webSpeech';

/** Repos entre deux relances : sans lui, une coupure immédiate boucle à plein régime. */
const REPOS_RELANCE_MS = 400;
/** Relances consécutives sans un mot entendu avant de renoncer (micro pris, refusé…). */
const RELANCES_MAX_A_VIDE = 12;

export function useReveilMaya() {
  const maya = useMayaStore();
  const visible = ref(true);
  const bloque = ref(false); // micro refusé → on n'insiste pas
  const ecoute = ref(false);
  let reco: Reconnaissance | null = null;
  let relancesAVide = 0;
  let minuteur: ReturnType<typeof setTimeout> | null = null;

  const doitEcouter = computed(
    () =>
      maya.reveilVocal &&
      !maya.bubbleOpen &&
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

  function arreter(): void {
    purgerMinuteur();
    try {
      reco?.stop();
    } catch {
      /* déjà arrêtée */
    }
  }

  function demarrer(): void {
    if (reco || !doitEcouter.value) return;
    const r = creerReconnaissance({ continuous: true, interimResults: false });
    if (!r) return;
    r.onstart = () => {
      ecoute.value = true;
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        // On ne peut pas écouter : on coupe l'option pour ne pas boucler.
        bloque.value = true;
        maya.setReveilVocal(false);
      }
      // 'no-speech' / 'aborted' : `onend` suit, le redémarrage s'en charge.
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
      relancesAVide++;
      if (relancesAVide > RELANCES_MAX_A_VIDE) {
        // Quelque chose empêche durablement l'écoute. On se tait plutôt que de
        // harceler le navigateur ; l'apiculteur relancera depuis les réglages.
        bloque.value = true;
        return;
      }
      purgerMinuteur();
      minuteur = setTimeout(demarrer, REPOS_RELANCE_MS);
    };
    r.onresult = (e) => {
      // On a entendu quelque chose : l'écoute fonctionne, le compteur repart.
      relancesAVide = 0;
      // Uniquement les résultats FINAUX : un interim mal transcrit réveillerait à tort.
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res || !res.isFinal) continue;
        const { reveil, commande } = analyserReveil(res[0]?.transcript ?? '');
        if (reveil) {
          maya.declencherVocal(commande); // ouvre la bulle → doitEcouter passe à false → on s'arrête
          break;
        }
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

  watch(doitEcouter, (ok) => {
    if (ok) {
      // Reprise après une dictée ou un retour au premier plan : le compteur
      // d'échecs repart, sinon un blocage passé condamnerait la reprise.
      relancesAVide = 0;
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
    document.removeEventListener('visibilitychange', onVisibilite);
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { ecoute };
}
