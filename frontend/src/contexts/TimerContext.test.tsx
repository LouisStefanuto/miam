import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerProvider, useTimers } from '@/contexts/TimerContext';

// Hoisted with the `vi.mock` call below, which runs before the imports.
const {
  showRunningNotification,
  showPausedNotification,
  showDoneNotification,
  scheduleDoneNotification,
} = vi.hoisted(() => ({
  showRunningNotification: vi.fn(),
  showPausedNotification: vi.fn(),
  showDoneNotification: vi.fn(),
  scheduleDoneNotification: vi.fn(),
}));

// The wording itself is covered in timer-notifications.test.ts; what matters
// here is when the provider decides to repost a card.
vi.mock('@/lib/timer-notifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/timer-notifications')>();
  return {
    ...actual,
    notificationsAllowed: () => true,
    notificationsEnabled: () => true,
    requestNotificationPermission: async () => 'granted' as NotificationPermission,
    showRunningNotification,
    showPausedNotification,
    showDoneNotification,
    scheduleDoneNotification,
    cancelDoneNotification: vi.fn(),
    clearNotification: vi.fn(),
    clearDoneNotifications: async () => {},
  };
});

function Harness() {
  const { start, pause } = useTimers();
  return (
    <>
      <button type="button" onClick={() => start('step-1', 180, '3 min')}>
        start
      </button>
      <button type="button" onClick={() => start('step-2', 2, '2 s')}>
        start short
      </button>
      <button type="button" onClick={() => pause('step-1')}>
        pause
      </button>
    </>
  );
}

/** Messages the provider is listening for, as the worker would post them. */
const workerListeners = new Set<(event: MessageEvent) => void>();

function installServiceWorker() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      addEventListener: (_type: string, fn: (event: MessageEvent) => void) =>
        workerListeners.add(fn),
      removeEventListener: (_type: string, fn: (event: MessageEvent) => void) =>
        workerListeners.delete(fn),
      getRegistration: async () => undefined,
    },
  });
}

function pressCardButton(action: string, id: string) {
  for (const listener of workerListeners) {
    listener({ data: { type: 'miam-timer-action', action, id } } as MessageEvent);
  }
}

beforeEach(() => {
  workerListeners.clear();
  installServiceWorker();
  vi.useFakeTimers();
  showRunningNotification.mockClear();
  showPausedNotification.mockClear();
  showDoneNotification.mockClear();
  scheduleDoneNotification.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('lock screen cards', () => {
  it('reposts the card every second, so the clock runs in the shade', async () => {
    render(
      <TimerProvider>
        <Harness />
      </TimerProvider>,
    );

    await act(async () => {
      screen.getByText('start').click();
    });
    expect(showRunningNotification).toHaveBeenCalledTimes(1);
    expect(showRunningNotification.mock.calls[0][0].endsAt - Date.now()).toBe(180_000);

    // The provider ticks twice a second; the card only changes once, so the
    // half-second in between is not worth a repost.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(showRunningNotification).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(showRunningNotification).toHaveBeenCalledTimes(2);

    // One second at a time: jumping ten at once would batch into a single
    // render, and count renders rather than seconds.
    for (let second = 0; second < 10; second++) {
      await act(async () => {
        vi.advanceTimersByTime(1_000);
      });
    }
    expect(showRunningNotification).toHaveBeenCalledTimes(12);
  });

  it('lets the ring have the last word, with no 00:00 posted over it', async () => {
    render(
      <TimerProvider>
        <Harness />
      </TimerProvider>,
    );

    await act(async () => {
      screen.getByText('start short').click();
    });

    for (let second = 0; second < 4; second++) {
      await act(async () => {
        vi.advanceTimersByTime(1_000);
      });
    }

    expect(showDoneNotification).toHaveBeenCalledTimes(1);
    // Both effects run in the same pass; whichever posted last is what the
    // phone shows, and it has to be the ring.
    const ring = showDoneNotification.mock.invocationCallOrder[0];
    const lastChrono = Math.max(...showRunningNotification.mock.invocationCallOrder);
    expect(ring).toBeGreaterThan(lastChrono);
  });

  it('follows the buttons pressed on the card', async () => {
    render(
      <TimerProvider>
        <Harness />
      </TimerProvider>,
    );

    await act(async () => {
      screen.getByText('start').click();
    });
    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });

    await act(async () => {
      pressCardButton('pause', 'step-1');
    });
    expect(showPausedNotification).toHaveBeenCalledTimes(1);
    expect(showPausedNotification.mock.calls[0][0].remainingMs).toBe(160_000);

    // Paused for real: the clock stops moving, in the app as on the card.
    showRunningNotification.mockClear();
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(showRunningNotification).not.toHaveBeenCalled();

    await act(async () => {
      pressCardButton('resume', 'step-1');
    });
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(showRunningNotification).toHaveBeenCalled();
  });

  it('posts a paused card, and hands the ring back to the worker on resume', async () => {
    render(
      <TimerProvider>
        <Harness />
      </TimerProvider>,
    );

    await act(async () => {
      screen.getByText('start').click();
    });
    expect(scheduleDoneNotification).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(10_000);
      screen.getByText('pause').click();
    });

    expect(showPausedNotification).toHaveBeenCalledTimes(1);
    expect(showPausedNotification.mock.calls[0][0].remainingMs).toBe(170_000);

    // A paused card says the same thing forever: no repost while it sits there.
    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });
    expect(showPausedNotification).toHaveBeenCalledTimes(1);
  });
});
