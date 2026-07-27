import { Bell, Pause, Timer as TimerIcon } from 'lucide-react';
import { formatClock } from '@/lib/parse-durations';
import { useTimers } from '@/contexts/TimerContext';

interface TimerChipProps {
  /** Stable id, unique per duration occurrence. */
  id: string;
  /** Duration to count down, in seconds. */
  seconds: number;
  /** Text as written in the step, e.g. "10 à 15 min". */
  label: string;
  /** Where the duration comes from, e.g. "Étape 3". */
  context?: string;
}

/** Inline pill that turns a duration written in a step into a countdown. */
export default function TimerChip({ id, seconds, label, context }: TimerChipProps) {
  const { get, start, pause, resume, stop } = useTimers();
  const timer = get(id);

  const handleClick = () => {
    if (!timer) return start(id, seconds, { label, context });
    if (timer.status === 'running') return pause(id);
    if (timer.status === 'paused') return resume(id);
    return stop(id);
  };

  const progress = timer && timer.totalMs > 0 ? 1 - timer.remainingMs / timer.totalMs : 0;

  const base =
    'relative inline-flex items-center gap-1 align-baseline rounded-full px-2 py-0.5 mx-px font-body font-semibold text-[0.95em] leading-tight overflow-hidden transition-colors active:scale-[0.97]';

  if (!timer) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Lancer un minuteur de ${label}`}
        className={`${base} bg-primary/10 text-primary hover:bg-primary/20`}
      >
        <TimerIcon size={12} className="flex-shrink-0" />
        {label}
      </button>
    );
  }

  if (timer.status === 'done') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Minuteur de ${label} terminé, appuyer pour arrêter`}
        className={`${base} gradient-warm text-primary-foreground animate-pulse`}
      >
        <Bell size={12} className="flex-shrink-0" />
        Terminé
      </button>
    );
  }

  const running = timer.status === 'running';
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={running ? `Mettre en pause le minuteur de ${label}` : `Reprendre le minuteur de ${label}`}
      className={`${base} bg-primary/10 text-primary hover:bg-primary/20 ${running ? '' : 'opacity-70'}`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-500 ease-linear"
        style={{ width: `${Math.min(100, progress * 100)}%` }}
      />
      <span className="relative flex items-center gap-1">
        {running ? <TimerIcon size={12} className="flex-shrink-0" /> : <Pause size={12} className="flex-shrink-0" />}
        <span className="tabular-nums">{formatClock(timer.remainingMs)}</span>
      </span>
    </button>
  );
}
