import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { MutableRefObject } from 'react';
import { useWindowScrollMemory } from './use-window-scroll-memory';

function Page({ saved, ready = true }: { saved: MutableRefObject<number | null>; ready?: boolean }) {
  useWindowScrollMemory(saved, ready);
  return null;
}

/** Moves the window like the browser does, then fires the scroll event. */
function scrollWindowTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('useWindowScrollMemory', () => {
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollWindowTo(0);
    scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  });

  it('does not scroll on the first visit', () => {
    render(<Page saved={{ current: null }} />);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls back to where the page was left', () => {
    const saved = { current: null as number | null };
    const { unmount } = render(<Page saved={saved} />);
    scrollWindowTo(1200);
    unmount();

    // The next page is shorter: the browser clamps and fires a scroll event.
    scrollWindowTo(0);
    expect(saved.current).toBe(1200);

    render(<Page saved={saved} />);
    expect(scrollTo).toHaveBeenCalledWith(0, 1200);
  });

  it('waits for the content before scrolling back', () => {
    const saved = { current: 1200 as number | null };
    const { rerender } = render(<Page saved={saved} ready={false} />);
    // While loading, the page is short and the browser may move the window.
    scrollWindowTo(50);
    expect(scrollTo).not.toHaveBeenCalled();

    rerender(<Page saved={saved} ready />);
    expect(scrollTo).toHaveBeenCalledWith(0, 1200);
  });
});
