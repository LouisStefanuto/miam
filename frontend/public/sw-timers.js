/**
 * Timer half of the service worker, pulled in by the generated Workbox worker
 * (see `workbox.importScripts` in `vite.config.ts`).
 *
 * A locked screen freezes the page: the countdown on its card stops being
 * refreshed and the alarm it would have fired arrives late, or not at all. The
 * worker is not tied to the page's lifetime, so it keeps the card counting down
 * and posts the ring itself.
 *
 * Best effort by design: the browser may shut the worker down before the
 * timeout fires. The page reposts the same card, under the same tag, as soon as
 * it wakes up — whichever comes first wins, and the other replaces it in place.
 */

const MIAM_TAG_PREFIX = 'miam-timer-';
const MIAM_ICON = '/icon-192x192.png';
const MIAM_BADGE = '/badge-timer.png';
const MIAM_VIBRATION = [500, 250, 500, 250, 500];
const MIAM_RUNNING_ACTIONS = [
  { action: 'pause', title: 'Pause' },
  { action: 'stop', title: 'Annuler' },
];
const MIAM_PAUSED_ACTIONS = [
  { action: 'resume', title: 'Reprendre' },
  { action: 'stop', title: 'Annuler' },
];

/** Timer id -> pending `setTimeout` handle. */
const miamTimeouts = new Map();

function miamCancel(id) {
  const handle = miamTimeouts.get(id);
  if (handle === undefined) return;
  clearTimeout(handle);
  miamTimeouts.delete(id);
}

/**
 * The countdown as `formatClock` writes it in the app — the card must not
 * change shape depending on which side posted it last.
 */
function miamRemainingLabel(remaining) {
  const total = Math.max(0, Math.ceil(remaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? hours + ':' + pad(minutes) + ':' + pad(seconds) : pad(minutes) + ':' + pad(seconds);
}

/** Next whole second, which is when the card would read differently. */
function miamNextRefresh(remaining) {
  return Math.min(remaining, remaining % 1000 || 1000);
}

/**
 * Reposts the card a second at a time, so the countdown keeps running in the
 * shade, then posts the ring. The page cannot do this while it is frozen behind
 * a locked screen — which is exactly when the card is all there is to read.
 *
 * The ticking is also what keeps the worker itself awake: a worker with nothing
 * pending is shut down within seconds, and would take the ring with it.
 */
function miamTick(timer) {
  const remaining = timer.endsAt - Date.now();
  if (remaining <= 0) {
    miamTimeouts.delete(timer.id);
    // Takes the chrono's place, under the same tag: the countdown turns into
    // its own answer instead of leaving a card stuck at 00:00.
    self.registration.showNotification("C'est prêt !", {
      tag: MIAM_TAG_PREFIX + timer.id,
      body: 'Minuteur ' + (timer.label || ''),
      icon: MIAM_ICON,
      badge: MIAM_ICON,
      requireInteraction: true,
      vibrate: MIAM_VIBRATION,
      data: { url: timer.url, done: true },
    });
    return;
  }
  self.registration.showNotification(miamRemainingLabel(remaining), {
    tag: MIAM_TAG_PREFIX + timer.id,
    body: 'Minuteur ' + (timer.label || ''),
    icon: MIAM_ICON,
    badge: MIAM_BADGE,
    silent: true,
    requireInteraction: true,
    actions: MIAM_RUNNING_ACTIONS,
    data: { url: timer.url, label: timer.label, endsAt: timer.endsAt },
  });
  miamTimeouts.set(
    timer.id,
    setTimeout(() => miamTick(timer), miamNextRefresh(remaining)),
  );
}

function miamShowPaused(timer) {
  self.registration.showNotification(miamRemainingLabel(timer.remainingMs), {
    tag: MIAM_TAG_PREFIX + timer.id,
    body: 'Minuteur ' + (timer.label || '') + ', en pause',
    icon: MIAM_ICON,
    badge: MIAM_BADGE,
    silent: true,
    requireInteraction: true,
    actions: MIAM_PAUSED_ACTIONS,
    data: { url: timer.url, label: timer.label, remainingMs: timer.remainingMs },
  });
}

function miamSchedule(timer) {
  if (!timer || typeof timer.id !== 'string' || typeof timer.endsAt !== 'number') return;
  miamCancel(timer.id);
  miamTick(timer);
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'miam-timer-schedule') miamSchedule(data.timer);
  else if (data.type === 'miam-timer-cancel') miamCancel(data.id);
});

/**
 * A button on the card. The worker answers it on the spot — the shade must not
 * sit there unchanged while the app boots — and then tells the page, where the
 * timers actually live, to do the same. Everything needed comes from the card's
 * own `data`, so a press works even on a worker that just woke up.
 */
async function miamHandleAction(action, id, data, notification) {
  miamCancel(id);
  if (action === 'stop') {
    notification.close();
  } else if (action === 'pause') {
    miamShowPaused({
      id,
      label: data.label,
      url: data.url,
      remainingMs: Math.max(0, (data.endsAt || Date.now()) - Date.now()),
    });
  } else {
    miamTick({
      id,
      label: data.label,
      url: data.url,
      endsAt: Date.now() + (data.remainingMs || 0),
    });
  }
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) client.postMessage({ type: 'miam-timer-action', action, id });
}

/** Tapping a timer card brings the app back, on the recipe it came from. */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  if (!notification.tag || !notification.tag.startsWith(MIAM_TAG_PREFIX)) return;
  const data = notification.data || {};
  const id = notification.tag.slice(MIAM_TAG_PREFIX.length);

  if (event.action === 'pause' || event.action === 'resume' || event.action === 'stop') {
    event.waitUntil(miamHandleAction(event.action, id, data, notification));
    return;
  }

  notification.close();
  const url = data.url || '/';
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
