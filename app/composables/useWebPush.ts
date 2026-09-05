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

/**
 * Re-synchronise SILENCIEUSEMENT l'abonnement push avec le serveur.
 * Ne fait rien tant que la permission n'est pas déjà accordée (jamais de prompt).
 * - abonnement local perdu (rotation navigateur / iOS) → le recrée ;
 * - dans tous les cas → renvoie l'endpoint courant au serveur (idempotent,
 *   dédupliqué par endpoint côté serveur).
 * C'est le filet qui répare la perte d'abonnement après un déploiement, sans
 * que l'utilisateur ait à se reconnecter. Best-effort : ne lève jamais.
 */
export async function ensureFreshPushSubscription(vapidKey: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window) ||
      !vapidKey
    )
      return false;
    if (Notification.permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
    await appelApi('/api/push/subscribe', {
      method: 'POST',
      body: { endpoint: json.endpoint, keys: json.keys },
    });
    return true;
  } catch {
    return false;
  }
}

/** Ce qu'on montre à l'apiculteur pour chaque raison d'échec du serveur. */
const MESSAGES_RAISON: Record<string, string> = {
  'vapid-absent': 'Notifications non configurées sur le serveur — contacte le support',
  'aucun-abonnement': 'Aucun appareil enregistré : active les notifications ci-dessus',
  'tous-refuses': 'Ton navigateur a révoqué l’autorisation — désactive puis réactive',
  'rien-a-envoyer': 'Rien à envoyer',
};

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
      await appelApi('/api/push/subscribe', {
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
        await appelApi('/api/push/unsubscribe', {
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

  /**
   * Résultat d'un test d'envoi, tel qu'on peut l'AFFICHER.
   *
   * `sendTest` renvoyait `boolean` et ne regardait que « la requête n'a pas
   * levé ». Un envoi à zéro appareil rendait donc `true`, et l'écran annonçait
   * un succès qui n'existait pas.
   */
  async function sendTest(): Promise<{ reussi: boolean; message: string }> {
    try {
      const rep = await appelApi<{ data: { envoyes: number; raison: string; reussi: boolean } }>(
        '/api/push/test',
        { method: 'POST' },
      );
      const { envoyes, raison, reussi } = rep.data;
      if (reussi) {
        return {
          reussi: true,
          message: `Notification envoyée sur ${envoyes} appareil${envoyes > 1 ? 's' : ''}`,
        };
      }
      return { reussi: false, message: MESSAGES_RAISON[raison] ?? 'Aucune notification envoyée' };
    } catch (err) {
      // 503 = VAPID absent côté serveur : une erreur d'exploitation, pas une
      // erreur de l'utilisateur. Le dire plutôt que d'afficher « échec ».
      const code =
        (err as { statusCode?: number; status?: number }).statusCode ??
        (err as { status?: number }).status;
      if (code === 503) return { reussi: false, message: MESSAGES_RAISON['vapid-absent']! };
      return { reussi: false, message: 'Le serveur n’a pas répondu' };
    }
  }

  return { supported, permission, subscribed, loading, enable, disable, sendTest };
}
