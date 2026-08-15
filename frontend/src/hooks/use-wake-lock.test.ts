import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from './use-wake-lock';

function mockWakeLock() {
  const sentinel = { released: false, release: vi.fn(async () => { sentinel.released = true; }) };
  const request = vi.fn(async () => sentinel);
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  return { sentinel, request };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useWakeLock', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  afterEach(() => {
    delete (navigator as { wakeLock?: unknown }).wakeLock;
  });

  it('requests a screen lock when enabled', async () => {
    const { request } = mockWakeLock();
    await act(async () => {
      renderHook(() => useWakeLock(true));
    });
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('requests nothing when disabled', async () => {
    const { request } = mockWakeLock();
    await act(async () => {
      renderHook(() => useWakeLock(false));
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('releases the lock when it becomes disabled', async () => {
    const { sentinel } = mockWakeLock();
    const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await act(async () => {});
    await act(async () => rerender({ on: false }));
    expect(sentinel.release).toHaveBeenCalled();
  });

  it('releases the lock on unmount', async () => {
    const { sentinel } = mockWakeLock();
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    unmount();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it('takes the lock again when the tab becomes visible', async () => {
    const { sentinel, request } = mockWakeLock();
    renderHook(() => useWakeLock(true));
    await act(async () => {});
    // The browser drops the lock on its own when the tab is hidden
    sentinel.released = true;
    await act(async () => setVisibility('hidden'));
    await act(async () => setVisibility('visible'));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does nothing on browsers without the API', async () => {
    await act(async () => {
      renderHook(() => useWakeLock(true));
    });
    expect('wakeLock' in navigator).toBe(false);
  });
});
