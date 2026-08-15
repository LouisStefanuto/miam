import { useEffect } from 'react';

/**
 * Keeps the screen on while `enabled` is true, so a recipe stays readable
 * without touching the phone with dirty hands.
 *
 * No-op on browsers without the Screen Wake Lock API (Firefox, older Safari).
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const request = async () => {
      if (released || document.visibilityState !== 'visible') return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        // The effect may have been cleaned up while the request was pending
        if (released) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Denied (low battery, permission policy) — cooking goes on without it
      }
    };

    // The browser drops the lock whenever the tab is hidden, so take it again
    // once the user comes back to the recipe.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) request();
    };

    request();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [enabled]);
}
