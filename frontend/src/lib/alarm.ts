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

export type AlarmSoundId =
  | 'cloche'
  | 'bip'
  | 'carillon'
  | 'coucou'
  | 'castor'
  | 'grignotage'
  | 'ronchon'
  | 'arbre'
  | 'ressort';

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

let noiseCache: { ctx: AudioContext; buffer: AudioBuffer } | null = null;

/** One second of white noise, reused by every noisy voice of a context. */
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseCache?.ctx === ctx) return noiseCache.buffer;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate), ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  noiseCache = { ctx, buffer };
  return buffer;
}

interface NoiseOptions {
  duration: number;
  peak: number;
  /** bandpass for dry clicks, lowpass for splashes. */
  type: BiquadFilterType;
  frequency: number;
  /** Filter sweep target, reached at the end of the note. */
  frequencyTo?: number;
  q?: number;
  attack?: number;
}

/**
 * Schedules a burst of filtered noise. Oscillators alone sound synthetic; noise
 * is what makes gnawing and splashing read as physical.
 */
function noise(ctx: AudioContext, at: number, options: NoiseOptions): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.setValueAtTime(options.frequency, at);
  if (options.frequencyTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(options.frequencyTo, at + options.duration);
  }
  if (options.q !== undefined) filter.Q.value = options.q;
  const gain = ctx.createGain();
  const attack = options.attack ?? 0.004;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(options.peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + options.duration);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(at);
  source.stop(at + options.duration + 0.05);
  return source;
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
  {
    id: 'castor',
    label: 'Castor bavard',
    description: 'Babillage aigu, puis grignotage de bois',
    schedule: (ctx, at) => {
      const nodes: AudioScheduledSourceNode[] = [];
      // Fast babble: each squeak slides up, from a slightly different pitch.
      const chatter = [760, 980, 840, 1120, 900, 1240];
      chatter.forEach((frequency, index) => {
        nodes.push(
          voice(ctx, at + index * 0.1, {
            type: 'sawtooth',
            frequency,
            glideTo: frequency * 1.3,
            glideDuration: 0.05,
            duration: 0.09,
            peak: 0.08,
          }),
        );
      });
      // Teeth on a branch: dry, tight clicks.
      for (let bite = 0; bite < 5; bite++) {
        nodes.push(
          noise(ctx, at + 0.78 + bite * 0.075, {
            type: 'bandpass',
            frequency: 2600,
            q: 9,
            duration: 0.045,
            peak: 0.55,
          }),
        );
      }
      // Two last happy squeaks.
      for (let squeak = 0; squeak < 2; squeak++) {
        nodes.push(
          voice(ctx, at + 1.22 + squeak * 0.22, {
            type: 'sawtooth',
            frequency: 700 + squeak * 80,
            glideTo: 1200 + squeak * 120,
            glideDuration: 0.1,
            duration: 0.17,
            peak: 0.09,
          }),
        );
      }
      return nodes;
    },
  },
  {
    id: 'grignotage',
    label: 'Grignotage',
    description: 'Il ronge de plus en plus vite, puis le bois craque',
    schedule: (ctx, at) => {
      const nodes: AudioScheduledSourceNode[] = [];
      // Nibbling that speeds up: the gap between bites shrinks each time.
      let cursor = at;
      for (let bite = 0; bite < 9; bite++) {
        nodes.push(
          noise(ctx, cursor, {
            type: 'bandpass',
            frequency: bite % 2 === 0 ? 2400 : 3000,
            q: 9,
            duration: 0.04,
            peak: 0.55,
          }),
        );
        cursor += 0.115 - bite * 0.008;
      }
      // The branch giving way.
      nodes.push(
        noise(ctx, cursor + 0.1, { type: 'lowpass', frequency: 3000, frequencyTo: 420, duration: 0.2, peak: 0.45 }),
      );
      nodes.push(
        voice(ctx, cursor + 0.1, { type: 'triangle', frequency: 160, glideTo: 75, duration: 0.24, peak: 0.3 }),
      );
      return nodes;
    },
  },
  {
    id: 'ronchon',
    label: 'Castor ronchon',
    description: 'Il grommelle, vexé que ce ne soit pas encore prêt',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      // Grumbles wobbling around a low pitch.
      const grumbles = [180, 148, 205, 140];
      grumbles.forEach((frequency, index) => {
        const start = at + index * 0.29;
        nodes.push(
          voice(ctx, start, {
            type: 'sawtooth',
            frequency,
            glideTo: frequency * 0.78,
            duration: 0.24,
            peak: 0.15,
            attack: 0.03,
          }),
        );
        // A quiet upper voice gives the grumble its nasal edge.
        nodes.push(
          voice(ctx, start, {
            type: 'square',
            frequency: frequency * 1.5,
            glideTo: frequency * 1.2,
            duration: 0.22,
            peak: 0.04,
            attack: 0.03,
          }),
        );
      });
      // One last long sigh.
      nodes.push(
        voice(ctx, at + 1.24, { type: 'sawtooth', frequency: 200, glideTo: 88, duration: 0.45, peak: 0.16, attack: 0.05 }),
      );
      return nodes;
    },
  },
  {
    id: 'arbre',
    label: 'Arbre qui tombe',
    description: 'Trois craquements, la chute, et le tronc au sol',
    schedule: (ctx, at) => {
      const nodes: AudioScheduledSourceNode[] = [];
      // Trunk cracking.
      for (let crack = 0; crack < 3; crack++) {
        nodes.push(
          noise(ctx, at + crack * 0.16, { type: 'bandpass', frequency: 1800, q: 4, duration: 0.07, peak: 0.5 }),
        );
      }
      // The fall: a whoosh sweeping down through the branches.
      nodes.push(
        noise(ctx, at + 0.6, { type: 'lowpass', frequency: 950, frequencyTo: 200, duration: 0.4, peak: 0.32 }),
      );
      // Landing: low thud plus debris.
      nodes.push(voice(ctx, at + 1.0, { type: 'sine', frequency: 95, glideTo: 38, duration: 0.45, peak: 0.5 }));
      nodes.push(
        noise(ctx, at + 1.0, { type: 'lowpass', frequency: 420, frequencyTo: 130, duration: 0.3, peak: 0.4 }),
      );
      return nodes;
    },
  },
  {
    id: 'ressort',
    label: 'Ressort',
    description: 'Boing de dessin animé',
    schedule: (ctx, at) => {
      const nodes: OscillatorNode[] = [];
      for (let boing = 0; boing < 3; boing++) {
        const start = at + boing * 0.5;
        nodes.push(
          voice(ctx, start, { type: 'triangle', frequency: 900, glideTo: 130, glideDuration: 0.32, duration: 0.36, peak: 0.28 }),
        );
        // A quieter octave below thickens the boing.
        nodes.push(
          voice(ctx, start + 0.04, { type: 'sine', frequency: 450, glideTo: 90, glideDuration: 0.3, duration: 0.34, peak: 0.14 }),
        );
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
