// Intercepteur global : sur un 402 « limite/plan atteint » (middleware
// 04.subscription → code PLAN_REQUIRED / LIMIT_REACHED), ouvre le modal d'upgrade
// contextuel plutôt que de laisser un message d'erreur brut. Enveloppe $fetch
// (donc aussi useFetch) côté client. N'altère pas le flux : l'erreur se propage
// normalement, on ne fait qu'observer.
export default defineNuxtPlugin(() => {
  const open = useState('upgrade-modal-open', () => false);

  globalThis.$fetch = globalThis.$fetch.create({
    onResponseError({ response }) {
      if (response?.status !== 402) return;
      const body = response._data as { code?: string; data?: { code?: string } } | undefined;
      const code = body?.data?.code ?? body?.code;
      if (code === 'PLAN_REQUIRED' || code === 'LIMIT_REACHED') {
        open.value = true;
      }
    },
  });
});
