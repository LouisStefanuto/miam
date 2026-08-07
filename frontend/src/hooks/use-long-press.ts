import { useCallback, useEffect, useRef, type PointerEvent } from 'react';

const DEFAULT_LONG_PRESS_MS = 1000;

/**
 * Tells a tap apart from a press held down.
 *
 * Built on pointer events, so it covers mouse and touch alike, and on `onClick`
 * rather than `onPointerUp` for the tap, so keyboard activation still works.
 * Pass no `onLongPress` to fall back to a plain button.
 */
export function useLongPress(
  onTap: () => void,
  onLongPress?: () => void,
  delayMs = DEFAULT_LONG_PRESS_MS,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(
    (event: PointerEvent) => {
      // Only the primary button: holding a right-click is not a long press.
      if (event.button !== 0) return;
      firedRef.current = false;
      clear();
      if (!onLongPress) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        firedRef.current = true;
        onLongPress();
      }, delayMs);
    },
    [clear, delayMs, onLongPress],
  );

  const click = useCallback(() => {
    clear();
    // Releasing a long press still fires a click; that one is not a tap.
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    onTap();
  }, [clear, onTap]);

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    /** Scrolling away from the element cancels the press. */
    onPointerCancel: clear,
    onClick: click,
  };
}
