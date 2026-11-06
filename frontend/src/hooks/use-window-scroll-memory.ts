import { MutableRefObject, useLayoutEffect } from 'react';

/**
 * Remembers how far the window is scrolled while the calling page is shown, and
 * scrolls back there when the page mounts again (e.g. after a trip to /cart).
 *
 * `saved` must outlive the page (keep it in a context above the router).
 * `ready` should turn true once the content is rendered at its full height,
 * otherwise the browser clamps the restored position to the shorter page.
 */
export function useWindowScrollMemory(saved: MutableRefObject<number | null>, ready: boolean) {
  // A layout effect, so the listener comes off in the same commit that removes
  // the page. Once the page is gone the browser clamps the scroll to the next,
  // shorter page and fires a scroll event, which must not overwrite the position.
  // The listener only starts after the restore for the same reason on the way in.
  useLayoutEffect(() => {
    if (!ready) return;
    if (saved.current !== null) window.scrollTo(0, saved.current);

    const onScroll = () => {
      saved.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ready, saved]);
}
