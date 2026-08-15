import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { scheduleAlarmSound, vibrateAlarm } from '@/lib/alarm';
import {
  cancelDoneNotification,
  clearDoneNotifications,
  clearNotification,
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
 * Mirrors a running timer onto the lock screen, and hands its ring to the
 * service worker. Permission is asked the first time a timer is started, which
 * is a tap — the only moment browsers accept the prompt.
 */
function mirrorRunning(id: string, label: string, endsAt: number) {
  if (!notificationsAllowed()) return;
  const timer = { id, label, endsAt, url: currentPath() };
  void requestNotificationPermission().then(() => {
    showRunningNotification(timer);
    scheduleDoneNotification(timer);
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
  // for them may have been shut down in between: post and schedule them again.
  // Only when permission is already there — a prompt needs a tap behind it.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (!notificationsEnabled()) return;
    for (const spec of specs) {
      if (spec.endsAt === undefined) continue;
      const timer = { id: spec.id, label: spec.label, endsAt: spec.endsAt, url: currentPath() };
      showRunningNotification(timer);
      scheduleDoneNotification(timer);
    }
  }, [specs]);

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
      mirrorRunning(id, label, endsAt);
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
      showPausedNotification({ id, label: spec.label, remainingMs });
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
      mirrorRunning(id, spec.label, endsAt);
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
