import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TimerProvider } from '@/contexts/TimerContext';
import StepText from './StepText';
import TimerDock from './TimerDock';

const dockHeight = () => document.documentElement.style.getPropertyValue('--timer-dock-height');

function renderDock() {
  return render(
    <TimerProvider>
      <p>
        <StepText text="Cuire 10 min." timerIdPrefix="recipe-1:0" context="Étape 1" />
      </p>
      <TimerDock />
    </TimerProvider>,
  );
}

describe('TimerDock', () => {
  beforeEach(() => {
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
    document.documentElement.style.removeProperty('--timer-dock-height');
  });

  it('reserves no space while there is no timer', () => {
    renderDock();
    expect(screen.queryByRole('region', { name: 'Minuteurs' })).not.toBeInTheDocument();
    expect(dockHeight()).toBe('0px');
  });

  it('publishes the space it takes, and gives it back once dismissed', () => {
    renderDock();

    act(() => {
      screen.getByRole('button', { name: /Lancer un minuteur/ }).click();
    });
    expect(screen.getByRole('region', { name: 'Minuteurs' })).toBeInTheDocument();
    expect(dockHeight()).not.toBe('0px');

    act(() => {
      screen.getByRole('button', { name: /Annuler le minuteur/ }).click();
    });
    expect(screen.queryByRole('region', { name: 'Minuteurs' })).not.toBeInTheDocument();
    expect(dockHeight()).toBe('0px');
  });

  it('shows the countdown and the step it comes from', () => {
    renderDock();

    act(() => {
      screen.getByRole('button', { name: /Lancer un minuteur/ }).click();
    });
    const dock = screen.getByRole('region', { name: 'Minuteurs' });
    expect(dock.textContent).toContain('10 min');
    expect(dock.textContent).toContain('Étape 1');
    expect(dock.textContent).toContain('10:00');

    act(() => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    expect(dock.textContent).toContain('Minuteur terminé');
  });
});
