/**
 * Timer alarm: a synthesized ring plus a vibration pattern.
 *
 * Sounds are synthesized rather than shipped as audio files, so the app stays
 * self-contained and nothing extra has to be downloaded or precached.
 *
 * The ring is scheduled on the audio clock as soon as the timer starts, so it
 * still plays when the tab is in the background (where `setInterval` throttles).
 * Vibration can only be triggered live, from a foreground tick.
 */

export type AlarmSoundId = 'cloche' | 'bip' | 'carillon' | 'castor' | 'coucou';

export interface AlarmSound {
  id: AlarmSoundId;
  label: string;
  description: string;
  /** Queues the whole ring starting at `at` on the audio clock. */
  schedule: (ctx: AudioContext, at: number) => AudioScheduledSourceNode[];
}

export const DEFAULT_ALARM_SOUND: AlarmSoundId = 'cloche';

const STORAGE_KEY = 'miam-alarm-sound';
const VIBRATION_PATTERN = [500, 250, 500, 250, 500];

let audioContext: AudioContext | null = null;

/**
 * Opens (or resumes) the audio context. Must be called from a user gesture,
 * otherwise mobile browsers refuse to play anything later on.
 */
export function primeAlarmAudio(): AudioContext | null {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!audioContext) audioContext = new Ctor();
    if (audioContext.state === 'suspended') void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

interface VoiceOptions {
  type: OscillatorType;
  frequency: number;
  /** Seconds until the note has fully decayed. */
  duration: number;
  /** Loudness at the top of the attack, 0..1. */
  peak: number;
  /** Pitch glide target, for squeaks and knocks. */
  glideTo?: number;
  /** Seconds to reach `glideTo`; defaults to the whole duration. */
  glideDuration?: number;
  /** Seconds to reach `peak`; short by default, longer sounds softer. */
  attack?: number;
}

/** Schedules one note with a percussive attack/decay envelope. */
function voice(ctx: AudioContext, at: number, options: VoiceOptions): OscillatorNode {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, at);
  if (options.glideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      options.glideTo,
      at + (options.glideDuration ?? options.duration),
    );
  }
  const attack = options.attack ?? 0.008;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(options.peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + options.duration + 0.05);
  return oscillator;
}

export const ALARM_SOUNDS: AlarmSound[] = [
  {
    id: 'cloche',
    label: 'Clochette',
    description: 'Trois coups clairs',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      for (let stroke = 0; stroke < 3; stroke++) {
        const start = at + stroke * 0.75;
        // The upper partial stays quieter, which is what makes it read as a bell.
        nodes.push(voice(ctx, start, { type: 'sine', frequency: 1046.5, duration: 0.9, peak: 0.4 }));
        nodes.push(voice(ctx, start, { type: 'sine', frequency: 1568, duration: 0.9, peak: 0.18 }));
      }
      return nodes;
    },
  },
  {
    id: 'bip',
    label: 'Bips',
    description: 'Comme un minuteur de cuisine',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      for (let burst = 0; burst < 2; burst++) {
        for (let beep = 0; beep < 4; beep++) {
          const start = at + burst * 1.5 + beep * 0.22;
          nodes.push(voice(ctx, start, { type: 'square', frequency: 1760, duration: 0.11, peak: 0.11 }));
        }
      }
      return nodes;
    },
  },
  {
    id: 'carillon',
    label: 'Carillon',
    description: 'Quatre notes qui montent',
    schedule: (ctx, at) => {
      const notes = [1046.5, 1318.5, 1568, 2093];
      const nodes: OscillatorNode[] = [];
      for (let round = 0; round < 2; round++) {
        notes.forEach((frequency, index) => {
          const start = at + round * 1.3 + index * 0.16;
          nodes.push(voice(ctx, start, { type: 'triangle', frequency, duration: 1.1, peak: 0.22, attack: 0.012 }));
        });
      }
      return nodes;
    },
  },
  {
    id: 'castor',
    label: 'Castor',
    description: 'Petits couinements, grignotage et coup de queue',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      // Three rising squeaks.
      for (let squeak = 0; squeak < 3; squeak++) {
        const start = at + squeak * 0.22;
        nodes.push(
          voice(ctx, start, {
            type: 'sawtooth',
            frequency: 520,
            glideTo: 1180,
            glideDuration: 0.09,
            duration: 0.17,
            peak: 0.11,
          }),
        );
      }
      // Two wooden knocks, then the tail slapping the water.
      for (let knock = 0; knock < 2; knock++) {
        nodes.push(
          voice(ctx, at + 0.85 + knock * 0.17, {
            type: 'triangle',
            frequency: 190,
            glideTo: 120,
            glideDuration: 0.05,
            duration: 0.1,
            peak: 0.32,
          }),
        );
      }
      nodes.push(
        voice(ctx, at + 1.32, { type: 'sine', frequency: 130, glideTo: 55, duration: 0.32, peak: 0.4 }),
      );
      return nodes;
    },
  },
  {
    id: 'coucou',
    label: 'Coucou',
    description: 'Deux notes de pendule',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      for (let call = 0; call < 3; call++) {
        const start = at + call * 0.95;
        nodes.push(voice(ctx, start, { type: 'triangle', frequency: 1318.5, duration: 0.3, peak: 0.3, attack: 0.02 }));
        nodes.push(voice(ctx, start + 0.33, { type: 'triangle', frequency: 1046.5, duration: 0.4, peak: 0.3, attack: 0.02 }));
      }
      return nodes;
    },
  },
];

export function getAlarmSoundById(id: AlarmSoundId): AlarmSound {
  return ALARM_SOUNDS.find((sound) => sound.id === id) ?? ALARM_SOUNDS[0];
}

/** The sound picked in the settings, falling back to the default. */
export function getAlarmSound(): AlarmSoundId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ALARM_SOUNDS.some((sound) => sound.id === stored)) return stored as AlarmSoundId;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_ALARM_SOUND;
}

export function setAlarmSound(id: AlarmSoundId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* storage full or unavailable */
  }
}

function scheduleRing(delaySeconds: number, id: AlarmSoundId): () => void {
  const ctx = primeAlarmAudio();
  if (!ctx) return () => {};

  const nodes = getAlarmSoundById(id).schedule(ctx, ctx.currentTime + Math.max(0, delaySeconds));

  return () => {
    for (const node of nodes) {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
  };
}

/**
 * Schedules the ring in `delaySeconds`.
 * Returns a canceller, for when the timer is paused or dismissed.
 */
export function scheduleAlarmSound(delaySeconds: number, id: AlarmSoundId = getAlarmSound()): () => void {
  return scheduleRing(delaySeconds, id);
}

/** Rings right away — used to preview a sound in the settings. */
export function playAlarmSound(id: AlarmSoundId = getAlarmSound()): () => void {
  return scheduleRing(0, id);
}

/** Vibrates the device, where supported (no-op on iOS). */
export function vibrateAlarm() {
  try {
    navigator.vibrate?.(VIBRATION_PATTERN);
  } catch {
    /* unsupported */
  }
}
