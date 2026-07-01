/* Handlers Web Push injectés dans le service worker généré par vite-pwa.
   Affiche la notification reçue et gère le clic (focus / ouverture de l'URL). */

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/* Ré-abonnement automatique : le navigateur (surtout iOS PWA, et à chaque
   remplacement du SW après déploiement) fait « tourner » l'abonnement push —
   l'endpoint change et l'ancien meurt (410). Sans ce handler, le serveur garde
   un endpoint mort et l'utilisateur cesse silencieusement de recevoir les
   notifications. Ici on recrée l'abonnement et on le renvoie au serveur
   (fetch same-origin → cookie de session inclus). Best-effort. */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Réutilise la clé de l'ancien abonnement si dispo, sinon la récupère.
        let appKey = event.oldSubscription && event.oldSubscription.options
          ? event.oldSubscription.options.applicationServerKey
          : null;
        if (!appKey) {
          const res = await fetch('/api/push/vapid-key');
          const { key } = await res.json();
          if (!key) return;
          appKey = urlB64ToUint8Array(key);
        }
        const sub =
          (event.newSubscription) ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appKey,
          }));
        const json = sub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });
      } catch {
        /* best-effort : la re-synchro côté client rattrapera à la prochaine ouverture */
      }
    })(),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'APIGO', body: event.data && event.data.text ? event.data.text() : '' };
  }

  const title = payload.title || 'APIGO';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    tag: payload.tag || undefined,
    data: { url: payload.url || '/alertes' },
    vibrate: payload.priorite === 'critique' ? [120, 60, 120] : [80],
    requireInteraction: payload.priorite === 'critique',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/alertes';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
