export function useMutationState() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function execute<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      return await fn();
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Une erreur est survenue');
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading: readonly(loading), error: readonly(error), execute };
}
