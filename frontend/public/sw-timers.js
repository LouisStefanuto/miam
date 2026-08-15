/**
 * Timer half of the service worker, pulled in by the generated Workbox worker
 * (see `workbox.importScripts` in `vite.config.ts`).
 *
 * A locked screen freezes the page: its interval stops ticking and the alarm it
 * would have fired arrives late, or not at all. The worker is not tied to the
 * page's lifetime, so the ring is scheduled here too, and posted as a
 * notification the phone can show without the app being open.
 *
 * Best effort by design: the browser may shut the worker down before the
 * timeout fires. The page reposts the same card, under the same tag, as soon as
 * it wakes up — whichever comes first wins, and the other replaces it in place.
 */

const MIAM_TAG_PREFIX = 'miam-timer-';
const MIAM_ICON = '/icon-192x192.png';
const MIAM_VIBRATION = [500, 250, 500, 250, 500];

/** Timer id -> pending `setTimeout` handle. */
const miamTimeouts = new Map();

function miamCancel(id) {
  const handle = miamTimeouts.get(id);
  if (handle === undefined) return;
  clearTimeout(handle);
  miamTimeouts.delete(id);
}

function miamSchedule(timer) {
  if (!timer || typeof timer.id !== 'string' || typeof timer.endsAt !== 'number') return;
  miamCancel(timer.id);
  const delay = Math.max(0, timer.endsAt - Date.now());
  const handle = setTimeout(() => {
    miamTimeouts.delete(timer.id);
    self.registration.showNotification('Minuteur terminé', {
      tag: MIAM_TAG_PREFIX + timer.id,
      body: (timer.label || 'Minuteur') + " : c'est prêt",
      icon: MIAM_ICON,
      badge: MIAM_ICON,
      requireInteraction: true,
      vibrate: MIAM_VIBRATION,
      data: { url: timer.url, done: true },
    });
  }, delay);
  miamTimeouts.set(timer.id, handle);
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'miam-timer-schedule') miamSchedule(data.timer);
  else if (data.type === 'miam-timer-cancel') miamCancel(data.id);
});

/** Tapping a timer card brings the app back, on the recipe it came from. */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  if (!notification.tag || !notification.tag.startsWith(MIAM_TAG_PREFIX)) return;
  notification.close();
  const url = (notification.data && notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          // Already open: focus it and leave the user where they were, unless
          // they wandered off the recipe the timer belongs to.
          const navigated = client.url.endsWith(url) || !('navigate' in client)
            ? Promise.resolve(client)
            : client.navigate(url).catch(() => client);
          return navigated.then((target) => (target || client).focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
