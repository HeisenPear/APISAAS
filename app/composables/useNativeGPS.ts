/**
 * Géolocalisation via Capacitor Geolocation (natif) ou navigator.geolocation (web).
 */
export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useNativeGPS() {
  const { isNative } = usePlatform();
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function getCurrentPosition(): Promise<GpsPosition | null> {
    loading.value = true;
    error.value = null;

    try {
      if (isNative.value) {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.requestPermissions();
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } else {
        return await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Géolocalisation non disponible'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 },
          );
        });
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de géolocalisation';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { getCurrentPosition, loading, error };
}
