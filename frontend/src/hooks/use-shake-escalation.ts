import { useRef, useCallback, useEffect } from 'react';

const HOLD_DURATION = 5000;
const TAP_THRESHOLD = 300;

/**
 * Progressive shake on hold: gentle wiggle that escalates over 5 s,
 * then fires onLongPress. Short taps play a quick wiggle and fire onTap.
 */
export function useShakeEscalation<T extends HTMLElement = HTMLImageElement>(
  onTap: () => void,
  onLongPress: () => void,
) {
  const elementRef = useRef<T>(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const activeRef = useRef(false);
  const firedRef = useRef(false);
  const tapRafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tapRafRef.current) cancelAnimationFrame(tapRafRef.current);
    };
  }, []);

  const clearHold = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    activeRef.current = false;
    if (elementRef.current) elementRef.current.style.transform = '';
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (!activeRef.current || !elementRef.current) return;

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);

      // Quadratic ease-in: first seconds are subtle, last seconds are frantic
      const t = progress * progress;
      const speed = 0.015 + progress * 0.035;
      const rotateAmp = 2 + t * 13; // 2 deg -> 15 deg
      const translateAmp = t * 3; // 0 px -> 3 px

      const angle = Math.sin(elapsed * speed) * rotateAmp;
      const tx = Math.cos(elapsed * speed * 1.3) * translateAmp;

      elementRef.current.style.transform = `rotate(${angle.toFixed(2)}deg) translateX(${tx.toFixed(2)}px)`;

      if (progress >= 1 && !firedRef.current) {
        firedRef.current = true;
        clearHold();
        onLongPress();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [onLongPress, clearHold],
  );

  const playTapWiggle = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    if (tapRafRef.current) cancelAnimationFrame(tapRafRef.current);

    const start = performance.now();
    const animate = (now: number) => {
      const t = now - start;
      if (t >= 400) {
        el.style.transform = '';
        return;
      }
      const decay = 1 - t / 400;
      const angle = Math.sin(t * 0.05) * 8 * decay;
      el.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      tapRafRef.current = requestAnimationFrame(animate);
    };
    tapRafRef.current = requestAnimationFrame(animate);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    firedRef.current = false;
    activeRef.current = true;
    startTimeRef.current = performance.now();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const onPointerUp = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    const wasActive = activeRef.current;
    clearHold();
    if (wasActive && !firedRef.current) {
      if (elapsed < TAP_THRESHOLD) playTapWiggle();
      onTap();
    }
  }, [onTap, clearHold, playTapWiggle]);

  const onPointerCancel = useCallback(() => {
    clearHold();
  }, [clearHold]);

  return {
    ref: elementRef,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
