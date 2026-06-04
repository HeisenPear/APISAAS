/* Handlers Web Push injectés dans le service worker généré par vite-pwa.
   Affiche la notification reçue et gère le clic (focus / ouverture de l'URL). */

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
