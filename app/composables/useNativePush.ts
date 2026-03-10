/**
 * Push notifications via Capacitor PushNotifications (natif).
 * Sur le web, affiche des alertes browser ou ne fait rien.
 */
export function useNativePush() {
  const { isNative } = usePlatform();

  async function requestPermission(): Promise<boolean> {
    if (!isNative.value) {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      return false;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      return perm.receive === 'granted';
    } catch {
      return false;
    }
  }

  async function register(): Promise<string | null> {
    if (!isNative.value) return null;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.register();

      return await new Promise((resolve) => {
        PushNotifications.addListener('registration', (token) => {
          resolve(token.value);
        });
        PushNotifications.addListener('registrationError', () => {
          resolve(null);
        });
        // Timeout 10s
        setTimeout(() => resolve(null), 10000);
      });
    } catch {
      return null;
    }
  }

  async function sendTokenToServer(token: string) {
    await $fetch('/api/push/register-device', {
      method: 'POST',
      body: { token, platform: useNuxtApp().$isIos ? 'ios' : 'android' },
    });
  }

  return { requestPermission, register, sendTokenToServer };
}
