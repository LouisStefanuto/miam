import { describe, it, expect } from 'vitest';
import { findDurations, formatClock, formatDuration, splitDurations } from './parse-durations';

const secondsIn = (text: string) => findDurations(text).map((match) => match.seconds);
const textsIn = (text: string) => findDurations(text).map((match) => match.text);

describe('findDurations', () => {
  it('detects minutes in every common spelling', () => {
    expect(secondsIn('Faites cuire les pâtes 10 minutes.')).toEqual([600]);
    expect(secondsIn('Cuire 10 min à feu vif.')).toEqual([600]);
    expect(secondsIn('Cuire 10min.')).toEqual([600]);
    expect(secondsIn('Cuire 3 mn.')).toEqual([180]);
  });

  it('detects hours, with and without minutes', () => {
    expect(secondsIn('Laisser reposer 1 h.')).toEqual([3600]);
    expect(secondsIn('Laisser reposer 2 heures.')).toEqual([7200]);
    expect(secondsIn('Cuire 1h30.')).toEqual([5400]);
    expect(secondsIn('Cuire 1 h 30 min.')).toEqual([5400]);
    expect(secondsIn('Cuire 1h30min.')).toEqual([5400]);
  });

  it('detects seconds', () => {
    expect(secondsIn('Mixer 30 s.')).toEqual([30]);
    expect(secondsIn('Mixer 45 secondes.')).toEqual([45]);
  });

  it('uses the lower bound of a range', () => {
    expect(secondsIn('Cuire 10 à 15 minutes.')).toEqual([600]);
    expect(secondsIn('Cuire 10-15 min.')).toEqual([600]);
    expect(textsIn('Cuire 10 à 15 minutes.')).toEqual(['10 à 15 minutes']);
  });

  it('finds several durations in one step', () => {
    expect(secondsIn('Saisir 2 min puis enfourner 25 min.')).toEqual([120, 1500]);
  });

  it('ignores numbers that are not durations', () => {
    expect(secondsIn('Préchauffer le four à 180 °C.')).toEqual([]);
    expect(secondsIn('Ajouter 200 g de farine et 20 cl de lait.')).toEqual([]);
    expect(secondsIn('Ajouter 3 sachets de levure.')).toEqual([]);
    expect(secondsIn('Compter 2 salades et 4 cm de gingembre.')).toEqual([]);
    expect(secondsIn('Pour 4 personnes.')).toEqual([]);
  });

  it('does not glue an unrelated number to an hour', () => {
    expect(secondsIn('Cuire 1 h puis ajouter 30 g de beurre.')).toEqual([3600]);
  });

  it('ignores implausible durations', () => {
    expect(secondsIn('Mixer 2 s.')).toEqual([]); // too short to be worth a timer
    expect(secondsIn('Laisser 48 heures.')).toEqual([]); // beyond a cooking timer
  });

  it('does not match a number embedded in a longer one', () => {
    expect(secondsIn('Chauffer à 180h')).toEqual([]);
  });
});

describe('splitDurations', () => {
  it('keeps the surrounding text intact', () => {
    expect(splitDurations('Cuire 10 min puis reposer.')).toEqual([
      { type: 'text', text: 'Cuire ' },
      { type: 'duration', match: { start: 6, end: 12, text: '10 min', seconds: 600 } },
      { type: 'text', text: ' puis reposer.' },
    ]);
  });

  it('returns a single text segment when there is no duration', () => {
    expect(splitDurations('Mélanger le tout.')).toEqual([{ type: 'text', text: 'Mélanger le tout.' }]);
  });
});

describe('formatting', () => {
  it('formats the countdown', () => {
    expect(formatClock(600_000)).toBe('10:00');
    expect(formatClock(59_400)).toBe('01:00'); // rounds up, so it never shows 00:59 too early
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(3_900_000)).toBe('1:05:00');
  });

  it('formats duration labels', () => {
    expect(formatDuration(45)).toBe('45 s');
    expect(formatDuration(600)).toBe('10 min');
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(5400)).toBe('1 h 30');
  });
});
