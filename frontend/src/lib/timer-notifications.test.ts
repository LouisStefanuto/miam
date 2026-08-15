import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelDoneNotification,
  clearDoneNotifications,
  clearNotification,
  formatRemainingLabel,
  notificationsAllowed,
  notificationsEnabled,
  scheduleDoneNotification,
  setNotificationsAllowed,
  showDoneNotification,
  showPausedNotification,
  showRunningNotification,
} from '@/lib/timer-notifications';

const showNotification = vi.fn();
const postMessage = vi.fn();
const getNotifications = vi.fn(async () => [] as Notification[]);

function installNotificationApi(permission: NotificationPermission) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    writable: true,
    value: Object.assign(vi.fn(), { permission, requestPermission: vi.fn() }),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    writable: true,
    value: {
      getRegistration: async () => ({
        showNotification,
        getNotifications,
        active: { postMessage },
      }),
    },
  });
}

/** Lets the `getRegistration` promise chain inside the module settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** jsdom ships no storage here, so the preference gets a in-memory stand-in. */
function installStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

beforeEach(() => {
  installStorage();
  showNotification.mockClear();
  postMessage.mockClear();
  getNotifications.mockReset();
  getNotifications.mockResolvedValue([]);
  installNotificationApi('granted');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('preference', () => {
  it('is on until it is switched off', () => {
    expect(notificationsAllowed()).toBe(true);
    setNotificationsAllowed(false);
    expect(notificationsAllowed()).toBe(false);
    expect(notificationsEnabled()).toBe(false);
    setNotificationsAllowed(true);
    expect(notificationsEnabled()).toBe(true);
  });

  it('stays off without permission', () => {
    installNotificationApi('denied');
    expect(notificationsAllowed()).toBe(true);
    expect(notificationsEnabled()).toBe(false);
  });
});

describe('remaining time', () => {
  it('reads as the clock on the chip', () => {
    expect(formatRemainingLabel(8 * 60_000)).toBe('08:00');
    expect(formatRemainingLabel(272_000)).toBe('04:32');
    expect(formatRemainingLabel(90 * 60_000)).toBe('1:30:00');
    expect(formatRemainingLabel(1_500)).toBe('00:02');
    expect(formatRemainingLabel(-100)).toBe('00:00');
  });
});

describe('cards', () => {
  it('leads with the running clock, and anchors it to the end time', async () => {
    const endsAt = new Date('2024-01-01T14:32:00').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2024-01-01T14:24:00').getTime());
    showRunningNotification({ id: 'step-1', label: '10 min', endsAt, url: '/recipe/1' });
    await flush();

    expect(showNotification).toHaveBeenCalledTimes(1);
    const [title, options] = showNotification.mock.calls[0];
    expect(title).toBe('08:00');
    // The clock stalls whenever neither side is awake; the end time does not.
    expect(options.body).toBe('Minuteur 10 min, fin à 14:32');
    expect(options.tag).toBe('miam-timer-step-1');
    expect(options.silent).toBe(true);
    expect(options.data.url).toBe('/recipe/1');
  });

  it('freezes the clock of a paused timer', async () => {
    showPausedNotification({ id: 'step-1', label: '10 min', remainingMs: 272_000 });
    await flush();

    expect(showNotification.mock.calls[0][0]).toBe('04:32');
    expect(showNotification.mock.calls[0][1].body).toBe('Minuteur 10 min, en pause');
  });

  it('rings loud when the app is not on screen', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    showDoneNotification({ id: 'step-1', label: '10 min' });
    await flush();

    const options = showNotification.mock.calls[0][1];
    expect(options.body).toBe("10 min : c'est prêt");
    expect(options.silent).toBe(false);
    expect(options.data.done).toBe(true);
  });

  it('stays quiet when the app is already showing the alarm', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    showDoneNotification({ id: 'step-1', label: '10 min' });
    await flush();

    expect(showNotification.mock.calls[0][1].silent).toBe(true);
  });

  it('posts nothing once notifications are switched off', async () => {
    setNotificationsAllowed(false);
    showRunningNotification({ id: 'step-1', label: '10 min', endsAt: Date.now() + 1000 });
    await flush();

    expect(showNotification).not.toHaveBeenCalled();
  });
});

describe('closing', () => {
  it('closes the card of a stopped timer', async () => {
    const close = vi.fn();
    getNotifications.mockResolvedValue([{ close }] as unknown as Notification[]);

    clearNotification('step-1');
    await flush();

    expect(getNotifications).toHaveBeenCalledWith({ tag: 'miam-timer-step-1' });
    expect(close).toHaveBeenCalled();
  });

  it('only closes the cards of timers that already rang', async () => {
    const doneClose = vi.fn();
    const runningClose = vi.fn();
    const foreignClose = vi.fn();
    getNotifications.mockResolvedValue([
      { tag: 'miam-timer-a', data: { done: true }, close: doneClose },
      { tag: 'miam-timer-b', data: {}, close: runningClose },
      { tag: 'other', data: { done: true }, close: foreignClose },
    ] as unknown as Notification[]);

    await clearDoneNotifications();

    expect(doneClose).toHaveBeenCalled();
    expect(runningClose).not.toHaveBeenCalled();
    expect(foreignClose).not.toHaveBeenCalled();
  });
});

describe('worker hand-off', () => {
  it('hands the ring to the worker, and takes it back', async () => {
    const endsAt = Date.now() + 600_000;
    scheduleDoneNotification({ id: 'step-1', label: '10 min', endsAt, url: '/recipe/1' });
    await flush();

    expect(postMessage).toHaveBeenCalledWith({
      type: 'miam-timer-schedule',
      timer: { id: 'step-1', label: '10 min', endsAt, url: '/recipe/1' },
    });

    cancelDoneNotification('step-1');
    await flush();

    expect(postMessage).toHaveBeenLastCalledWith({ type: 'miam-timer-cancel', id: 'step-1' });
  });
});
