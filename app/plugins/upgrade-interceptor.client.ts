// Intercepteur global : sur un 402 « limite/plan atteint » (middleware
// 04.subscription → code PLAN_REQUIRED / LIMIT_REACHED), ouvre le modal
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
import type { PlanFeatures, PlanLimits } from '~/config/plans';

export interface RefusDePlan {
  code: 'PLAN_REQUIRED' | 'LIMIT_REACHED';
  feature?: keyof PlanFeatures;
  limit?: keyof PlanLimits;
  current?: number;
  max?: number;
  requiredPlan?: string;
  message?: string;
}

export default defineNuxtPlugin(() => {
  const open = useState('upgrade-modal-open', () => false);
  const refus = useState<RefusDePlan | null>('upgrade-modal-refus', () => null);

  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ response }) {
      if (response?.status !== 402) return;

      // Le corps arrive sous deux formes selon l'émetteur : `createError` de h3
      // imbrique sous `data`, certains handlers renvoient à plat.
      const body = response._data as
        | { code?: string; data?: Partial<RefusDePlan> & { code?: string } }
        | undefined;
      const charge = body?.data ?? (body as Partial<RefusDePlan> | undefined);
      const code = charge?.code ?? body?.code;

      if (code !== 'PLAN_REQUIRED' && code !== 'LIMIT_REACHED') return;

      refus.value = {
        code,
        feature: charge?.feature,
        limit: charge?.limit,
        current: charge?.current,
        max: charge?.max,
        requiredPlan: charge?.requiredPlan,
        message: charge?.message,
      };
      open.value = true;
    },
  });
});
