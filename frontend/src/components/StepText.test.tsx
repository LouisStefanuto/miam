import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TimerProvider } from '@/contexts/TimerContext';
import StepText from './StepText';

function renderStep(text: string) {
  return render(
    <TimerProvider>
      <p>
        <StepText text={text} timerIdPrefix="recipe-1:0" />
      </p>
    </TimerProvider>,
  );
}

describe('StepText', () => {
  beforeEach(() => {
    // jsdom's storage is not usable here, and timers persist through it.
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('turns a duration into a timer button and keeps the sentence readable', () => {
    const { container } = renderStep('Faites cuire les pâtes 10 minutes.');
    expect(container.textContent).toBe('Faites cuire les pâtes 10 minutes.');
    expect(screen.getByRole('button', { name: /Lancer un minuteur de 10 minutes/ })).toBeInTheDocument();
  });

  it('renders no button when the step has no duration', () => {
    renderStep('Mélanger le tout.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts down on click, then rings and vibrates at zero', () => {
    renderStep('Faites cuire les pâtes 10 minutes.');

    act(() => {
      screen.getByRole('button').click();
    });
    // The duration as written stays next to the countdown.
    expect(screen.getByRole('button').textContent).toBe('10 minutes (10:00)');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('button').textContent).toBe('10 minutes (09:00)');

    act(() => {
      vi.advanceTimersByTime(9 * 60_000);
    });
    expect(screen.getByRole('button', { name: /terminé/i }).textContent).toBe('10 minutes (terminé)');
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it('pauses and resumes without losing the remaining time', () => {
    renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    act(() => {
      screen.getByRole('button').click(); // pause
    });
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.getByRole('button').textContent).toContain('09:00');

    act(() => {
      screen.getByRole('button').click(); // resume
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole('button').textContent).toContain('08:00');
  });

  it('dismisses a finished timer, leaving the duration tappable again', () => {
    renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    act(() => {
      screen.getByRole('button', { name: /terminé/i }).click();
    });
    expect(screen.getByRole('button', { name: /Lancer un minuteur de 10 min/ })).toBeInTheDocument();
  });
});
