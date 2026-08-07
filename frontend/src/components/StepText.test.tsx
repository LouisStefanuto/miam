import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
    for (const name of ['localStorage', 'sessionStorage']) {
      const store = new Map<string, string>();
      Object.defineProperty(window, name, {
        configurable: true,
        value: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => store.set(key, value),
          removeItem: (key: string) => store.delete(key),
          clear: () => store.clear(),
        },
      });
    }
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

  it('clears a finished timer on its own a few seconds later', () => {
    renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(screen.getByRole('button', { name: /terminé/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole('button', { name: /Lancer un minuteur de 10 min/ })).toBeInTheDocument();
  });

  it('starts fresh when the app is reopened, dropping the stored timer', () => {
    const { unmount } = renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    unmount();

    // Closing the app empties sessionStorage; anything left there is a reload.
    window.sessionStorage.clear();
    renderStep('Cuire 10 min.');
    expect(screen.getByRole('button', { name: /Lancer un minuteur de 10 min/ })).toBeInTheDocument();
  });

  /** Presses the chip, holds it for `ms`, then releases it like a browser would. */
  function press(button: HTMLElement, ms: number) {
    act(() => {
      fireEvent.pointerDown(button, { button: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(ms);
    });
    act(() => {
      fireEvent.pointerUp(button, { button: 0 });
      button.click();
    });
  }

  it('resets a running timer on a long press, with the reset animation', () => {
    renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    press(screen.getByRole('button'), 1_200);

    const chip = screen.getByRole('button', { name: /Lancer un minuteur de 10 min/ });
    expect(chip).toBeInTheDocument();
    expect(chip.className).toContain('animate-scale-in');

    // The animation class is dropped once it has played, so it can play again.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('button').className).not.toContain('animate-scale-in');
  });

  it('starts the timer when the chip is held down before anything runs', () => {
    renderStep('Cuire 10 min.');

    press(screen.getByRole('button'), 1_200);

    expect(screen.getByRole('button').textContent).toBe('10 min (10:00)');
  });

  it('pauses rather than resets when the press is short', () => {
    renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    press(screen.getByRole('button'), 100);

    expect(screen.getByRole('button', { name: /Reprendre le minuteur/ }).textContent).toContain('09:00');
  });

  it('keeps counting down through a reload', () => {
    const { unmount } = renderStep('Cuire 10 min.');

    act(() => {
      screen.getByRole('button').click();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    unmount();

    renderStep('Cuire 10 min.');
    expect(screen.getByRole('button').textContent).toContain('09:00');
  });
});
