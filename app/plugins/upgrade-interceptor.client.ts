// Intercepteur global : sur un 402 « limite/plan atteint », ouvre le modal
// d'upgrade plutôt que de laisser un message d'erreur brut. Enveloppe $fetch
// (donc aussi useFetch) côté client. N'altère pas le flux : l'erreur se
// propage normalement, on ne fait qu'observer.
//
// Le 402 porte TOUT le contexte du refus — quelle fonctionnalité, quelle
// limite, quel plan minimum. On le conservait jusqu'ici sans l'utiliser : le
// modal parlait donc toujours de « limite de ruches atteinte », y compris
// quand le refus portait sur la transhumance ou l'élevage de reines. On garde
// désormais la charge utile pour que le modal montre les formules qui
// contiennent RÉELLEMENT ce que l'apiculteur vient de demander.
//
// La LECTURE du refus vit dans `~/utils/refusDePlan` : elle décide quels codes
// méritent un modal, et c'est la seule partie qui contienne une règle. La garder
// ici la rendait inexerçable — un banc ne pouvait que chercher des chaînes dans
// ce fichier, ce qu'une mutation a réfuté (le nom du code survivait dans un
// commentaire). Ce plugin ne fait plus que brancher et poser l'état.
import { lireRefusDePlan, type RefusDePlan } from '~/utils/refusDePlan';

export type { RefusDePlan };

export default defineNuxtPlugin(() => {
  const open = useState('upgrade-modal-open', () => false);
  const refus = useState<RefusDePlan | null>('upgrade-modal-refus', () => null);

  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ response }) {
      if (response?.status !== 402) return;

      const lu = lireRefusDePlan(response._data);
      if (!lu) return;

      refus.value = lu;
      open.value = true;
    },
  });
});
