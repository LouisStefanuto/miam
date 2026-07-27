import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ALARM_SOUNDS, DEFAULT_ALARM_SOUND, getAlarmSound, getAlarmSoundById, setAlarmSound } from './alarm';

/** Minimal Web Audio stub: records what each sound schedules. */
function fakeAudioContext() {
  const started: number[] = [];
  const stopped: number[] = [];
  const ramps: { value: number; at: number }[] = [];

  const param = () => ({
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn((value: number, at: number) => {
      ramps.push({ value, at });
    }),
  });

  const ctx = {
    currentTime: 100,
    state: 'running' as const,
    destination: {},
    resume: vi.fn(),
    createOscillator: () => ({
      type: 'sine',
      frequency: param(),
      connect: (node: unknown) => node,
      start: (at: number) => started.push(at),
      stop: (at?: number) => stopped.push(at ?? -1),
    }),
    createGain: () => ({
      gain: param(),
      connect: (node: unknown) => node,
    }),
  };

  return { ctx, started, stopped, ramps };
}

function installFakeAudio() {
  const fake = fakeAudioContext();
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: function AudioContextStub() {
      return fake.ctx;
    },
  });
  return fake;
}

/**
 * Reloads the module so it forgets its cached audio context, and hands back a
 * fresh recorder.
 */
async function loadAlarmWithFakeAudio() {
  vi.resetModules();
  const fake = installFakeAudio();
  const module = await import('./alarm');
  return { ...fake, module };
}

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
});

describe('alarm sound preference', () => {
  it('falls back to the default sound', () => {
    expect(getAlarmSound()).toBe(DEFAULT_ALARM_SOUND);
  });

  it('remembers the picked sound', () => {
    setAlarmSound('castor');
    expect(getAlarmSound()).toBe('castor');
  });

  it('ignores an unknown stored value', () => {
    localStorage.setItem('miam-alarm-sound', 'trompette');
    expect(getAlarmSound()).toBe(DEFAULT_ALARM_SOUND);
  });

  it('offers five sounds, each with a label and a description', () => {
    expect(ALARM_SOUNDS).toHaveLength(5);
    for (const sound of ALARM_SOUNDS) {
      expect(sound.label).toBeTruthy();
      expect(sound.description).toBeTruthy();
      expect(getAlarmSoundById(sound.id)).toBe(sound);
    }
  });
});

describe('scheduling', () => {
  it('schedules every sound without a gap and stops after it started', () => {
    for (const sound of ALARM_SOUNDS) {
      const { ctx, started, stopped, ramps } = installFakeAudio();
      const nodes = sound.schedule(ctx as unknown as AudioContext, ctx.currentTime);

      expect(nodes.length).toBeGreaterThan(0);
      expect(started).toHaveLength(nodes.length);
      expect(stopped).toHaveLength(nodes.length);
      // Nothing starts before "now", and nothing rings for more than a few seconds.
      for (const at of started) {
        expect(at).toBeGreaterThanOrEqual(ctx.currentTime);
        expect(at).toBeLessThan(ctx.currentTime + 4);
      }
      // Exponential ramps must never target zero, or the browser throws.
      for (const ramp of ramps) expect(ramp.value).toBeGreaterThan(0);
    }
  });

  it('uses the sound picked in the settings', async () => {
    setAlarmSound('coucou');
    const { started, module } = await loadAlarmWithFakeAudio();
    module.scheduleAlarmSound(600);
    // "coucou" is two notes, three times.
    expect(started).toHaveLength(6);
  });

  it('delays the ring by the timer duration', async () => {
    const { started, module } = await loadAlarmWithFakeAudio();
    module.scheduleAlarmSound(600, 'cloche');
    expect(started.length).toBeGreaterThan(0);
    for (const at of started) expect(at).toBeGreaterThanOrEqual(700);
  });

  it('cancels a scheduled ring', async () => {
    const { started, stopped, module } = await loadAlarmWithFakeAudio();
    const cancel = module.scheduleAlarmSound(600, 'cloche');
    const scheduledStops = stopped.length;
    cancel();
    expect(stopped).toHaveLength(scheduledStops + started.length);
  });

  it('does nothing when the browser has no Web Audio support', async () => {
    vi.resetModules();
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: undefined });
    const module = await import('./alarm');
    expect(() => module.playAlarmSound('castor')()).not.toThrow();
  });
});
