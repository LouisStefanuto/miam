/**
 * Timer alarm: a short synthesized bell plus a vibration pattern.
 *
 * The bell is scheduled on the audio clock as soon as the timer starts, so it
 * still rings when the tab is in the background (where `setInterval` throttles).
 * Vibration can only be triggered live, from a foreground tick.
 */

const CHIMES = 3;
/** Delay between chimes, in seconds. */
const CHIME_GAP = 0.75;
/** Two-tone doorbell-ish ring (C6 / G6). */
const CHIME_TONES = [1046.5, 1568];
const CHIME_DECAY = 0.9;
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

/** Queues one bell stroke at the given audio-clock time. */
function scheduleChime(ctx: AudioContext, at: number): OscillatorNode[] {
  return CHIME_TONES.map((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    // The upper partial stays quieter, which is what makes it read as a bell.
    const peak = index === 0 ? 0.4 : 0.18;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + CHIME_DECAY);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + CHIME_DECAY + 0.05);
    return oscillator;
  });
}

function scheduleRing(delaySeconds: number): () => void {
  const ctx = primeAlarmAudio();
  if (!ctx) return () => {};

  const start = ctx.currentTime + Math.max(0, delaySeconds);
  const scheduled: OscillatorNode[] = [];
  for (let i = 0; i < CHIMES; i++) scheduled.push(...scheduleChime(ctx, start + i * CHIME_GAP));

  return () => {
    for (const oscillator of scheduled) {
      try {
        oscillator.stop();
      } catch {
        /* already stopped */
      }
    }
  };
}

/**
 * Schedules the bell to ring in `delaySeconds`.
 * Returns a canceller, for when the timer is paused or dismissed.
 */
export function scheduleAlarmSound(delaySeconds: number): () => void {
  return scheduleRing(delaySeconds);
}

/** Rings the bell right away. */
export function playAlarmSound(): () => void {
  return scheduleRing(0);
}

/** Vibrates the device, where supported (no-op on iOS). */
export function vibrateAlarm() {
  try {
    navigator.vibrate?.(VIBRATION_PATTERN);
  } catch {
    /* unsupported */
  }
}
