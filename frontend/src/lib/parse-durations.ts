/**
 * Detects durations written in French recipe steps ("10 min", "1h30", "45 s")
 * so they can be turned into tappable timers.
 *
 * Deliberately regex-only: no user confirmation step, so the rules stay
 * conservative — a number must be followed by an explicit time unit.
 */

export interface DurationMatch {
  /** Index of the first matched character in the source text. */
  start: number;
  /** Index just after the last matched character. */
  end: number;
  /** Raw matched text, e.g. "10 à 15 min". */
  text: string;
  /** Duration the timer should run for, in seconds (lower bound of a range). */
  seconds: number;
}

export type TextSegment =
  | { type: 'text'; text: string }
  | { type: 'duration'; match: DurationMatch };

/** Below this, a timer is more noise than help (and "1 s" is likely a false positive). */
const MIN_SECONDS = 10;
/** Above this, the match is almost certainly not a cooking timer. */
const MAX_SECONDS = 12 * 3600;

/** Optional "à 15" / "-15" upper bound of a range; only the lower bound is used. */
const RANGE = String.raw`(?:\s*(?:à|a|-|–|ou)\s*\d{1,3})?`;

const DURATION_PATTERN = new RegExp(
  [
    // "1h", "1 heure", "1h30", "2 heures 15 min" — bare minutes only when glued to the "h"
    String.raw`\b(\d{1,2})\s*(?:heures?|h)(?:(\d{1,2})\b|\s*(\d{1,2})\s*(?:minutes?|min|mn)\b)?`,
    // "10 min", "10 à 15 minutes", "3mn"
    String.raw`\b(\d{1,3})` + RANGE + String.raw`\s*(?:minutes?|min|mn)\b`,
    // "30 s", "45 secondes"
    String.raw`\b(\d{1,3})` + RANGE + String.raw`\s*(?:secondes?|sec|s)\b`,
  ].join('|'),
  'gi',
);

/** All durations found in `text`, in reading order, without overlaps. */
export function findDurations(text: string): DurationMatch[] {
  const matches: DurationMatch[] = [];
  const pattern = new RegExp(DURATION_PATTERN.source, DURATION_PATTERN.flags);

  for (let m = pattern.exec(text); m !== null; m = pattern.exec(text)) {
    const [raw, hours, gluedMinutes, spacedMinutes, minutes, seconds] = m;
    let total: number;
    if (hours !== undefined) {
      total = Number(hours) * 3600 + Number(gluedMinutes ?? spacedMinutes ?? 0) * 60;
    } else if (minutes !== undefined) {
      total = Number(minutes) * 60;
    } else {
      total = Number(seconds);
    }

    if (total < MIN_SECONDS || total > MAX_SECONDS) continue;

    matches.push({ start: m.index, end: m.index + raw.length, text: raw, seconds: total });
  }

  return matches;
}

/** Splits `text` into plain runs and duration matches, ready to render. */
export function splitDurations(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of findDurations(text)) {
    if (match.start > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, match.start) });
    }
    segments.push({ type: 'duration', match });
    cursor = match.end;
  }

  if (cursor < text.length) segments.push({ type: 'text', text: text.slice(cursor) });
  return segments;
}

/** Countdown display: "09:59", or "1:05:00" past an hour. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Human label for a duration: "10 min", "1 h 30", "45 s". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')}`;
}
