import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { scheduleAlarmSound, vibrateAlarm } from '@/lib/alarm';

export type TimerStatus = 'running' | 'paused' | 'done';

export interface KitchenTimer {
  /** Stable id, built from the recipe/step/duration the timer comes from. */
  id: string;
  /** Duration label, e.g. "10 min". */
  label: string;
  /** Where the timer comes from, e.g. "Étape 3". */
  context?: string;
  totalMs: number;
  remainingMs: number;
  status: TimerStatus;
}

/** Persisted shape: wall-clock based, so a reload keeps counting down. */
interface TimerSpec {
  id: string;
  label: string;
  context?: string;
  totalMs: number;
  /** Set while running. */
  endsAt?: number;
  /** Set while paused. */
  remainingMs?: number;
  done?: boolean;
}

interface TimerContextValue {
  timers: KitchenTimer[];
  get: (id: string) => KitchenTimer | undefined;
  start: (id: string, seconds: number, meta: { label: string; context?: string }) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  stop: (id: string) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

const STORAGE_KEY = 'miam-timers';
const TICK_MS = 500;

function loadTimers(): TimerSpec[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TimerSpec[];
    if (!Array.isArray(parsed)) return [];
    // A timer that expired while the app was closed comes back as "done", but
    // without ringing: there is no user gesture to unlock audio on load.
    return parsed
      .filter((spec) => spec && typeof spec.id === 'string' && typeof spec.totalMs === 'number')
      .map((spec) =>
        spec.endsAt !== undefined && spec.endsAt <= Date.now()
          ? { ...spec, endsAt: undefined, remainingMs: 0, done: true }
          : spec,
      );
  } catch {
    return [];
  }
}

function saveTimers(specs: TimerSpec[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(specs));
  } catch {
    /* storage full or unavailable */
  }
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
    setSpecs((prev) =>
      prev.map((spec) =>
        ids.has(spec.id) ? { ...spec, endsAt: undefined, remainingMs: 0, done: true } : spec,
      ),
    );
    // The bell was scheduled on the audio clock at start time; only the
    // vibration has to be triggered here.
    vibrateAlarm();
  }, [now, specs]);

  const cancelBell = useCallback((id: string) => {
    bellCancels.current.get(id)?.();
    bellCancels.current.delete(id);
  }, []);

  const start = useCallback(
    (id: string, seconds: number, meta: { label: string; context?: string }) => {
      cancelBell(id);
      // Called from a click, which is what unlocks audio playback on mobile.
      bellCancels.current.set(id, scheduleAlarmSound(seconds));
      const spec: TimerSpec = {
        id,
        label: meta.label,
        context: meta.context,
        totalMs: seconds * 1000,
        endsAt: Date.now() + seconds * 1000,
      };
      setSpecs((prev) => [...prev.filter((other) => other.id !== id), spec]);
      setNow(Date.now());
    },
    [cancelBell],
  );

  const pause = useCallback(
    (id: string) => {
      cancelBell(id);
      setSpecs((prev) =>
        prev.map((spec) => {
          if (spec.id !== id || spec.endsAt === undefined) return spec;
          return { ...spec, remainingMs: Math.max(0, spec.endsAt - Date.now()), endsAt: undefined };
        }),
      );
    },
    [cancelBell],
  );

  const resume = useCallback(
    (id: string) => {
      const spec = specs.find((candidate) => candidate.id === id);
      if (!spec || spec.endsAt !== undefined || spec.done) return;
      const remaining = spec.remainingMs ?? spec.totalMs;
      cancelBell(id);
      bellCancels.current.set(id, scheduleAlarmSound(remaining / 1000));
      setSpecs((prev) =>
        prev.map((candidate) =>
          candidate.id === id ? { ...candidate, endsAt: Date.now() + remaining, remainingMs: undefined } : candidate,
        ),
      );
      setNow(Date.now());
    },
    [specs, cancelBell],
  );

  const stop = useCallback(
    (id: string) => {
      cancelBell(id);
      setSpecs((prev) => prev.filter((spec) => spec.id !== id));
    },
    [cancelBell],
  );

  const timers = useMemo<KitchenTimer[]>(
    () =>
      specs.map((spec) => {
        const status: TimerStatus = spec.done ? 'done' : spec.endsAt !== undefined ? 'running' : 'paused';
        const remainingMs =
          status === 'done' ? 0 : status === 'running' ? Math.max(0, spec.endsAt! - now) : spec.remainingMs ?? spec.totalMs;
        return {
          id: spec.id,
          label: spec.label,
          context: spec.context,
          totalMs: spec.totalMs,
          remainingMs,
          status,
        };
      }),
    [specs, now],
  );

  const get = useCallback((id: string) => timers.find((timer) => timer.id === id), [timers]);

  const value = useMemo<TimerContextValue>(
    () => ({ timers, get, start, pause, resume, stop }),
    [timers, get, start, pause, resume, stop],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimers(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimers must be used within a TimerProvider');
  return ctx;
}

/** The timer for a given id, or undefined when it has never been started. */
export function useTimer(id: string): KitchenTimer | undefined {
  return useTimers().get(id);
}
