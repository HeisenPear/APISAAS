export function useOptimistic() {
  async function execute<T>(
    optimisticFn: () => T,
    serverFn: () => Promise<void>,
    rollbackFn: (previous: T) => void,
  ) {
    const previous = optimisticFn();
    try {
      await serverFn();
    } catch (e) {
      rollbackFn(previous);
      const msg = getApiErrorMessage(e, 'Erreur lors de la mise à jour');
      useNotifications().error(msg);
      throw e;
    }
  }

  return { execute };
}
