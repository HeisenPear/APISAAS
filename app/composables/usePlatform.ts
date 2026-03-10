/**
 * Détecte si l'app tourne dans Capacitor (natif) ou dans le navigateur (web)
 */
export function usePlatform() {
  const isNative = computed(() => {
    if (import.meta.server) return false;
    return !!(
      window as { Capacitor?: { isNativePlatform?: () => boolean } }
    ).Capacitor?.isNativePlatform?.();
  });

  const isIos = computed(() => {
    if (import.meta.server) return false;
    const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    return cap?.getPlatform?.() === 'ios';
  });

  const isAndroid = computed(() => {
    if (import.meta.server) return false;
    const cap = (window as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    return cap?.getPlatform?.() === 'android';
  });

  const isWeb = computed(() => !isNative.value);

  return { isNative, isIos, isAndroid, isWeb };
}
