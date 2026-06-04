/**
 * Web Push (PWA) côté client — abonnement aux notifications navigateur.
 * Fonctionne sur tout navigateur supportant le Service Worker + Push API
 * (Chrome/Edge/Firefox/Android, et iOS 16.4+ en PWA installée).
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function useWebPush() {
  const supported = ref(false);
  const permission = ref<NotificationPermission>('default');
  const subscribed = ref(false);
  const loading = ref(false);

  const config = useRuntimeConfig();
  const vapidKey = config.public.vapidPublicKey as string;

  onMounted(async () => {
    supported.value =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      !!vapidKey;
    if (!supported.value) return;
    permission.value = Notification.permission;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      subscribed.value = !!sub;
    } catch {
      /* SW pas encore prêt */
    }
  });

  /** Demande la permission puis crée l'abonnement et l'envoie au serveur. */
  async function enable(): Promise<boolean> {
    if (!supported.value || loading.value) return false;
    loading.value = true;
    try {
      const perm = await Notification.requestPermission();
      permission.value = perm;
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: { endpoint: json.endpoint, keys: json.keys },
      });
      subscribed.value = true;
      return true;
    } catch {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Désabonne cet appareil (et prévient le serveur). */
  async function disable(): Promise<void> {
    if (!supported.value || loading.value) return;
    loading.value = true;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await $fetch('/api/push/unsubscribe', {
          method: 'POST',
          body: { endpoint: sub.endpoint },
        }).catch(() => {});
        await sub.unsubscribe();
      }
      subscribed.value = false;
    } finally {
      loading.value = false;
    }
  }

  async function sendTest(): Promise<boolean> {
    try {
      await $fetch('/api/push/test', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }

  return { supported, permission, subscribed, loading, enable, disable, sendTest };
}
