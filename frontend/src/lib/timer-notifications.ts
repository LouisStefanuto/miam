/**
 * Timer notifications: the running countdown shown as a card outside the app.
 *
 * A phone put down next to the pan locks itself, and the in-app chip goes with
 * it. Mirroring every timer into a notification puts it back where it can be
 * read — on the lock screen — and turns the ring into something that shows up
 * even when the app is not on screen.
 *
 * Two things post notifications:
 *  - this module, from the page, for the "running" / "paused" / "done" cards;
 *  - `public/sw-timers.js`, from the service worker, for the "done" card of a
 *    timer that ran out while the page was frozen (a locked screen suspends the
 *    tab, so its own tick may be minutes late).
 * Both use the same tag per timer, so whichever fires first wins and the other
 * silently replaces it instead of stacking a duplicate.
 */

import { formatClock } from '@/lib/parse-durations';

/** Shared with the service worker: same prefix, same shape. */
const TAG_PREFIX = 'miam-timer-';
const PREF_KEY = 'miam-timer-notifications';
const ICON = '/icon-192x192.png';
const VIBRATION_PATTERN = [500, 250, 500, 250, 500];

export interface TimerNotification {
  id: string;
  /** Duration label, e.g. "10 min". */
  label: string;
  /** Wall-clock end, for a running timer. */
  endsAt?: number;
  /** What is left, for a paused timer. */
  remainingMs?: number;
  /** Path to reopen when the notification is tapped. */
  url?: string;
}

/** Notifications need both the API and a service worker to reach a lock screen. */
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied';
}

/** Opt-out preference; notifications are on as soon as permission is given. */
export function notificationsAllowed(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setNotificationsAllowed(allowed: boolean) {
  try {
    localStorage.setItem(PREF_KEY, allowed ? 'on' : 'off');
  } catch {
    /* storage full or unavailable */
  }
}

/** True when a timer may post a card right now, without asking anything. */
export function notificationsEnabled(): boolean {
  return notificationsSupported() && notificationsAllowed() && Notification.permission === 'granted';
}

/**
 * Asks for permission if it was never answered. Must be called from a user
 * gesture — browsers ignore the prompt otherwise.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) return undefined;
  try {
    // `getRegistration` over `ready`: it resolves with `undefined` when there is
    // no worker (dev server, first load) instead of hanging forever.
    return await navigator.serviceWorker.getRegistration();
  } catch {
    return undefined;
  }
}

function tagOf(id: string): string {
  return `${TAG_PREFIX}${id}`;
}

/** French time of day, e.g. "14:32". */
function formatEndTime(endsAt: number): string {
  return new Date(endsAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

async function show(title: string, options: NotificationOptions & { tag: string }) {
  if (!notificationsEnabled()) return;
  const reg = await registration();
  if (reg) {
    await reg.showNotification(title, options);
    return;
  }
  // Desktop browsers without a worker can still post a plain notification;
  // mobile ones cannot, and simply get nothing.
  try {
    new Notification(title, options);
  } catch {
    /* constructor unavailable, e.g. Android Chrome */
  }
}

async function close(id: string) {
  const reg = await registration();
  if (!reg) return;
  try {
    const open = await reg.getNotifications({ tag: tagOf(id) });
    for (const notification of open) notification.close();
  } catch {
    /* getNotifications unsupported */
  }
}

/** Ongoing card for a running timer: silent, and stating when it will ring. */
export function showRunningNotification(timer: TimerNotification) {
  if (timer.endsAt === undefined) return;
  void show(`Minuteur ${timer.label}`, {
    tag: tagOf(timer.id),
    body: `Fin à ${formatEndTime(timer.endsAt)}`,
    icon: ICON,
    badge: ICON,
    // The body cannot count down, so it names the end time instead: still true
    // ten minutes later, with no update needed while the page is frozen.
    silent: true,
    requireInteraction: true,
    data: { url: timer.url },
  });
}

export function showPausedNotification(timer: TimerNotification) {
  void show(`Minuteur ${timer.label}`, {
    tag: tagOf(timer.id),
    body: `En pause, ${formatClock(timer.remainingMs ?? 0)} restant`,
    icon: ICON,
    badge: ICON,
    silent: true,
    requireInteraction: true,
    data: { url: timer.url },
  });
}

/**
 * The ring, as a card. Stays silent when the app is on screen, where the alarm
 * sound and the chip already say it: no reason to ring twice.
 */
export function showDoneNotification(timer: TimerNotification) {
  const inForeground = typeof document !== 'undefined' && document.visibilityState === 'visible';
  void show('Minuteur terminé', {
    tag: tagOf(timer.id),
    body: `${timer.label} : c'est prêt`,
    icon: ICON,
    badge: ICON,
    silent: inForeground,
    requireInteraction: true,
    vibrate: inForeground ? undefined : VIBRATION_PATTERN,
    data: { url: timer.url, done: true },
  } as NotificationOptions & { tag: string });
}

export function clearNotification(id: string) {
  void close(id);
}

/**
 * Drops the "done" cards once the app is back on screen: the alert has been
 * seen, and leaving it in the shade turns it into stale noise.
 */
export async function clearDoneNotifications() {
  const reg = await registration();
  if (!reg) return;
  try {
    const open = await reg.getNotifications();
    for (const notification of open) {
      if (notification.tag.startsWith(TAG_PREFIX) && notification.data?.done) notification.close();
    }
  } catch {
    /* getNotifications unsupported */
  }
}

function post(message: unknown) {
  if (!('serviceWorker' in navigator)) return;
  void registration().then((reg) => {
    reg?.active?.postMessage(message);
  });
}

/**
 * Hands the ring over to the service worker, which is not frozen with the page
 * and can post the "done" card on time. Best effort: a worker the browser shut
 * down in the meantime loses its timeout, and the page posts the card itself
 * when it wakes up.
 */
export function scheduleDoneNotification(timer: TimerNotification) {
  if (!notificationsEnabled() || timer.endsAt === undefined) return;
  post({
    type: 'miam-timer-schedule',
    timer: { id: timer.id, label: timer.label, endsAt: timer.endsAt, url: timer.url },
  });
}

export function cancelDoneNotification(id: string) {
  post({ type: 'miam-timer-cancel', id });
}
