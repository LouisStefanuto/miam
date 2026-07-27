import { useEffect, useRef } from 'react';
import { Bell, Pause, Play, X } from 'lucide-react';
import { formatClock } from '@/lib/parse-durations';
import { useTimers } from '@/contexts/TimerContext';

/**
 * Floating panel keeping running timers reachable while scrolling the recipe.
 *
 * It publishes the screen space it takes as `--timer-dock-height`, so scrollable
 * content can reserve room for it instead of disappearing behind it.
 */
export default function TimerDock() {
  const { timers, pause, resume, stop } = useTimers();
  const dockRef = useRef<HTMLDivElement>(null);
  const count = timers.length;

  useEffect(() => {
    const root = document.documentElement;
    const clear = () => root.style.setProperty('--timer-dock-height', '0px');
    const dock = dockRef.current;
    if (!dock) {
      clear();
      return;
    }

    // The dock is bottom-anchored, so everything from its top edge down is hidden.
    const measure = () => {
      const obstructed = Math.max(0, window.innerHeight - dock.getBoundingClientRect().top);
      root.style.setProperty('--timer-dock-height', `${Math.round(obstructed)}px`);
    };
    measure();

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(dock);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      clear();
    };
  }, [count]);

  if (count === 0) return null;

  // Ringing timers first, then the ones about to ring.
  const sorted = [...timers].sort((a, b) => {
    const aDone = a.status === 'done';
    const bDone = b.status === 'done';
    if (aDone !== bDone) return aDone ? -1 : 1;
    return a.remainingMs - b.remainingMs;
  });

  return (
    <div
      ref={dockRef}
      className="fixed z-[45] right-3 left-3 md:left-auto md:right-4 md:w-72 flex flex-col gap-2 pointer-events-none bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4"
      role="region"
      aria-label="Minuteurs"
    >
      {sorted.map((timer) => {
        const done = timer.status === 'done';
        const progress = timer.totalMs > 0 ? 1 - timer.remainingMs / timer.totalMs : 0;
        return (
          <div
            key={timer.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-card animate-scale-in ${
              done ? 'border-primary bg-primary/10 animate-pulse' : 'border-border bg-card'
            }`}
          >
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-500 ease-linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
            <div className="relative flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-semibold text-card-foreground truncate">
                  {done ? 'Minuteur terminé' : timer.label}
                </p>
                {timer.context && (
                  <p className="font-body text-xs text-muted-foreground truncate">
                    {timer.context}
                    {done ? ` · ${timer.label}` : ''}
                  </p>
                )}
              </div>

              {done ? (
                <Bell size={18} className="flex-shrink-0 text-primary" />
              ) : (
                <span className="font-display text-lg font-bold text-foreground tabular-nums">
                  {formatClock(timer.remainingMs)}
                </span>
              )}

              {!done && (
                <button
                  type="button"
                  onClick={() => (timer.status === 'running' ? pause(timer.id) : resume(timer.id))}
                  aria-label={timer.status === 'running' ? 'Mettre en pause' : 'Reprendre'}
                  className="flex-shrink-0 w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors"
                >
                  {timer.status === 'running' ? <Pause size={13} /> : <Play size={13} />}
                </button>
              )}

              <button
                type="button"
                onClick={() => stop(timer.id)}
                aria-label={done ? 'Arrêter la sonnerie' : 'Annuler le minuteur'}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
