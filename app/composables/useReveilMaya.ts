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

export function useReveilMaya() {
  const maya = useMayaStore();
  const visible = ref(true);
  const bloque = ref(false); // micro refusé → on n'insiste pas
  const ecoute = ref(false);
  let reco: Reconnaissance | null = null;

  const doitEcouter = computed(
    () => maya.reveilVocal && !maya.bubbleOpen && visible.value && !bloque.value,
  );

  function arreter(): void {
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
      // Le navigateur coupe l'écoute continue par intermittence : on relance.
      if (doitEcouter.value) demarrer();
    };
    r.onresult = (e) => {
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
    if (ok) demarrer();
    else arreter();
  });

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilite);
    onVisibilite();
    if (doitEcouter.value) demarrer();
  });

  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', onVisibilite);
    try {
      reco?.abort();
    } catch {
      /* rien à annuler */
    }
  });

  return { ecoute };
}
