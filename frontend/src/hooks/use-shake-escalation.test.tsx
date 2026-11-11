import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useShakeEscalation } from './use-shake-escalation';

function Logo({ onTap, onLongPress }: { onTap: () => void; onLongPress: () => void }) {
  const { ref, handlers } = useShakeEscalation<HTMLButtonElement>(onTap, onLongPress);
  return (
    <button ref={ref} type="button" {...handlers}>
      Miam
    </button>
  );
}

describe('useShakeEscalation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for the click to act on a tap', () => {
    const onTap = vi.fn();
    render(<Logo onTap={onTap} onLongPress={vi.fn()} />);
    const button = screen.getByRole('button');

    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    expect(onTap).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('does not count the release of a long press as a tap', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const onTap = vi.fn();
    const onLongPress = vi.fn();
    render(<Logo onTap={onTap} onLongPress={onLongPress} />);
    const button = screen.getByRole('button');

    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(onLongPress).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(button);
    fireEvent.click(button);
    expect(onTap).not.toHaveBeenCalled();

    // The next tap works again.
    fireEvent.click(button);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
