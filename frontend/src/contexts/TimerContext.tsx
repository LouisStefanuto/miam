import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { scheduleAlarmSound, vibrateAlarm } from '@/lib/alarm';
import {
  cancelDoneNotification,
  clearDoneNotifications,
  clearNotification,
  formatRemainingLabel,
  notificationsAllowed,
  notificationsEnabled,
  requestNotificationPermission,
  scheduleDoneNotification,
  showDoneNotification,
  showPausedNotification,
  showRunningNotification,
} from '@/lib/timer-notifications';

export type TimerStatus = 'running' | 'paused' | 'done';

export interface KitchenTimer {
  /** Stable id, built from the recipe/step/duration the timer comes from. */
  id: string;
  /** Duration label, e.g. "10 min". */
  label: string;
  totalMs: number;
  remainingMs: number;
  status: TimerStatus;
}

/** Persisted shape: wall-clock based, so a reload keeps counting down. */
interface TimerSpec {
  id: string;
  label: string;
  totalMs: number;
  /** Set while running. */
  endsAt?: number;
  /** Set while paused. */
  remainingMs?: number;
  /** Set when it rang; the timer clears itself DONE_LINGER_MS later. */
  doneAt?: number;
}

interface TimerContextValue {
  get: (id: string) => KitchenTimer | undefined;
  start: (id: string, seconds: number, label: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  stop: (id: string) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

const STORAGE_KEY = 'miam-timers';
const TICK_MS = 500;
/** How long a finished timer keeps showing its "done" state before clearing itself. */
const DONE_LINGER_MS = 5000;

/**
 * Timers live in `sessionStorage`: a reload keeps them counting down, but
 * closing the app drops them, so a recipe reopened later starts from scratch
 * instead of showing a countdown nobody remembers starting.
 */
function loadTimers(): TimerSpec[] {
  try {
    // Timers used to be kept in localStorage, where they survived forever.
    localStorage.removeItem(STORAGE_KEY);
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TimerSpec[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (spec) =>
        spec &&
        typeof spec.id === 'string' &&
        typeof spec.totalMs === 'number' &&
        // A timer that ran out while the app was away has nothing left to show:
        // its ring is long past, and there is no gesture to unlock audio on load.
        spec.doneAt === undefined &&
        (spec.endsAt === undefined || spec.endsAt > Date.now()),
    );
  } catch {
    return [];
  }
}

function saveTimers(specs: TimerSpec[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  } catch {
    /* storage full or unavailable */
  }
}

/** Where the timer was started from, so tapping its card comes back here. */
function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Hands the ring of a starting timer to the service worker. Permission is asked
 * the first time a timer is started, which is a tap — the only moment browsers
 * accept the prompt. The card itself is posted by the refresh effect below.
 */
function armNotifications(id: string, label: string, endsAt: number) {
  if (!notificationsAllowed()) return;
  void requestNotificationPermission().then(() => {
    scheduleDoneNotification({ id, label, endsAt, url: currentPath() });
  });
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [specs, setSpecs] = useState<TimerSpec[]>(loadTimers);
  const [now, setNow] = useState(() => Date.now());
  /** Cancels the pre-scheduled bell of a running timer. */
  const bellCancels = useRef(new Map<string, () => void>());

  const hasRunning = specs.some((spec) => spec.endsAt !== undefined);

  // Tick only while something is running, so idle consumers don't re-render.
  useEffect(() => {
    if (!hasRunning) return;
    const sync = () => setNow(Date.now());
    sync();
    const interval = window.setInterval(sync, TICK_MS);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [hasRunning]);

  useEffect(() => {
    saveTimers(specs);
  }, [specs]);

  // Fire the alarm for timers that just hit zero.
  useEffect(() => {
    const expired = specs.filter((spec) => spec.endsAt !== undefined && spec.endsAt <= now);
    if (expired.length === 0) return;
    const ids = new Set(expired.map((spec) => spec.id));
    for (const id of ids) bellCancels.current.delete(id);
    const doneAt = Date.now();
    setSpecs((prev) =>
      prev.map((spec) =>
        ids.has(spec.id) ? { ...spec, endsAt: undefined, remainingMs: 0, doneAt } : spec,
      ),
    );
    // The bell was scheduled on the audio clock at start time; only the
    // vibration has to be triggered here.
    vibrateAlarm();
    for (const spec of expired) {
      cancelDoneNotification(spec.id);
      // The worker may have posted this card already; same tag, so this
      // replaces it in place rather than stacking a second one.
      showDoneNotification({ id: spec.id, label: spec.label });
    }
  }, [now, specs]);

  // Coming back to the app is acknowledgement enough: the cards of timers that
  // already rang would just linger in the shade.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void clearDoneNotifications();
    };
    onVisible();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // A reload restarts the timers from storage, but the worker that was to ring
  // for them may have been shut down in between: schedule them again. Only when
  // permission is already there — a prompt needs a tap behind it.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (!notificationsEnabled()) return;
    for (const spec of specs) {
      if (spec.endsAt === undefined) continue;
      scheduleDoneNotification({
        id: spec.id,
        label: spec.label,
        endsAt: spec.endsAt,
        url: currentPath(),
      });
    }
  }, [specs]);

  /** Last card posted per timer, so a tick only reposts a changed countdown. */
  const postedCards = useRef(new Map<string, string>());

  // Keeps the lock screen cards counting down. A notification cannot tick on
  // its own, so it is reposted — under the same tag, silently — each time its
  // clock would read differently: once a second, out of the two ticks that ran.
  useEffect(() => {
    if (!notificationsEnabled()) return;
    const live = new Set<string>();
    for (const spec of specs) {
      live.add(spec.id);
      // A timer that has run out belongs to the "c'est prêt" card. Its chrono
      // must not be reposted over it — the two effects run in the same pass,
      // this one last, and a card reading 00:00 would bury the ring.
      if (spec.doneAt !== undefined || (spec.endsAt !== undefined && spec.endsAt <= now)) continue;
      const running = spec.endsAt !== undefined;
      const remainingMs = running
        ? Math.max(0, spec.endsAt! - now)
        : spec.remainingMs ?? spec.totalMs;
      const card = `${running ? 'run' : 'pause'}:${formatRemainingLabel(remainingMs)}`;
      if (postedCards.current.get(spec.id) === card) continue;
      postedCards.current.set(spec.id, card);
      const timer = { id: spec.id, label: spec.label, url: currentPath() };
      if (running) showRunningNotification({ ...timer, endsAt: spec.endsAt });
      else showPausedNotification({ ...timer, remainingMs });
    }
    for (const id of postedCards.current.keys()) {
      if (!live.has(id)) postedCards.current.delete(id);
    }
  }, [specs, now]);

  // A finished timer announces itself for a moment, then puts its chip back to
  // the idle state on its own — dismissing it is not something to remember.
  const nextClearAt = specs.reduce(
    (soonest, spec) =>
      spec.doneAt === undefined ? soonest : Math.min(soonest, spec.doneAt + DONE_LINGER_MS),
    Number.POSITIVE_INFINITY,
  );

  useEffect(() => {
    if (!Number.isFinite(nextClearAt)) return;
    const timeout = window.setTimeout(() => {
      const cutoff = Date.now();
      setSpecs((prev) =>
        prev.filter((spec) => spec.doneAt === undefined || spec.doneAt + DONE_LINGER_MS > cutoff),
      );
    }, Math.max(0, nextClearAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [nextClearAt]);

  const cancelBell = useCallback((id: string) => {
    bellCancels.current.get(id)?.();
    bellCancels.current.delete(id);
  }, []);

  const start = useCallback(
    (id: string, seconds: number, label: string) => {
      cancelBell(id);
      // Called from a click, which is what unlocks audio playback on mobile.
      bellCancels.current.set(id, scheduleAlarmSound(seconds));
      const endsAt = Date.now() + seconds * 1000;
      const spec: TimerSpec = {
        id,
        label,
        totalMs: seconds * 1000,
        endsAt,
      };
      armNotifications(id, label, endsAt);
      setSpecs((prev) => [...prev.filter((other) => other.id !== id), spec]);
      setNow(Date.now());
    },
    [cancelBell],
  );

  const pause = useCallback(
    (id: string) => {
      const spec = specs.find((candidate) => candidate.id === id);
      if (!spec || spec.endsAt === undefined) return;
      cancelBell(id);
      cancelDoneNotification(id);
      const remainingMs = Math.max(0, spec.endsAt - Date.now());
      setSpecs((prev) =>
        prev.map((candidate) =>
          candidate.id === id ? { ...candidate, remainingMs, endsAt: undefined } : candidate,
        ),
      );
    },
    [specs, cancelBell],
  );

  const resume = useCallback(
    (id: string) => {
      const spec = specs.find((candidate) => candidate.id === id);
      if (!spec || spec.endsAt !== undefined || spec.doneAt !== undefined) return;
      const remaining = spec.remainingMs ?? spec.totalMs;
      cancelBell(id);
      bellCancels.current.set(id, scheduleAlarmSound(remaining / 1000));
      const endsAt = Date.now() + remaining;
      armNotifications(id, spec.label, endsAt);
      setSpecs((prev) =>
        prev.map((candidate) =>
          candidate.id === id ? { ...candidate, endsAt, remainingMs: undefined } : candidate,
        ),
      );
      setNow(Date.now());
    },
    [specs, cancelBell],
  );

  const stop = useCallback(
    (id: string) => {
      cancelBell(id);
      cancelDoneNotification(id);
      clearNotification(id);
      setSpecs((prev) => prev.filter((spec) => spec.id !== id));
    },
    [cancelBell],
  );

  // The buttons on the card are pressed against the service worker, which has
  // already redrawn the card by the time this arrives; here the timer itself
  // catches up, so the chip and the alarm agree with what the shade shows.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'miam-timer-action' || typeof data.id !== 'string') return;
      if (data.action === 'pause') pause(data.id);
      else if (data.action === 'resume') resume(data.id);
      else if (data.action === 'stop') stop(data.id);
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [pause, resume, stop]);

  const timers = useMemo<KitchenTimer[]>(
    () =>
      specs.map((spec) => {
        const status: TimerStatus =
          spec.doneAt !== undefined ? 'done' : spec.endsAt !== undefined ? 'running' : 'paused';
        const remainingMs =
          status === 'done' ? 0 : status === 'running' ? Math.max(0, spec.endsAt! - now) : spec.remainingMs ?? spec.totalMs;
        return {
          id: spec.id,
          label: spec.label,
          totalMs: spec.totalMs,
          remainingMs,
          status,
        };
      }),
    [specs, now],
  );

  const get = useCallback((id: string) => timers.find((timer) => timer.id === id), [timers]);

  const value = useMemo<TimerContextValue>(
    () => ({ get, start, pause, resume, stop }),
    [get, start, pause, resume, stop],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimers(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimers must be used within a TimerProvider');
  return ctx;
}
