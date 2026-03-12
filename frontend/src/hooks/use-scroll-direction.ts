import { useState, useEffect, useRef, useCallback } from 'react';

const HIDE_THRESHOLD = 10;
const HEADER_HEIGHT = 56; // h-14 = 3.5rem = 56px

/**
 * Returns:
 * - hidden: true when scrolling down past threshold (for bottom bar snap)
 * - headerOffset: 0 (fully visible) to -HEADER_HEIGHT (fully hidden), tracks scroll proportionally on reveal
 */
export function useScrollDirection() {
  const [hidden, setHidden] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);
  const lastScrollY = useRef(0);
  const scrollUpAnchor = useRef<number | null>(null);

  const onScroll = useCallback(() => {
    const currentY = window.scrollY;
    const diff = currentY - lastScrollY.current;

    if (diff > 0) {
      // Scrolling down
      scrollUpAnchor.current = null;
      if (diff > HIDE_THRESHOLD) {
        setHidden(true);
        setHeaderOffset(-HEADER_HEIGHT);
      }
    } else if (diff < 0) {
      // Scrolling up
      if (scrollUpAnchor.current === null) {
        scrollUpAnchor.current = lastScrollY.current;
      }

      // Bottom bar snaps back immediately on any upward scroll
      setHidden(false);

      // Header reveals proportionally to total upward distance from anchor
      const totalUp = scrollUpAnchor.current - currentY;
      const offset = Math.min(0, -HEADER_HEIGHT + totalUp);
      setHeaderOffset(offset);
    }

    lastScrollY.current = currentY;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return { hidden, headerOffset };
}
