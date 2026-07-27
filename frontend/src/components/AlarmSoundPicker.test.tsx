import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { DEFAULT_ALARM_SOUND, getAlarmSound } from '@/lib/alarm';
import AlarmSoundPicker from './AlarmSoundPicker';

describe('AlarmSoundPicker', () => {
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

  it('lists the sounds and checks the current one', () => {
    render(<AlarmSoundPicker />);
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /Clochette/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Castor/ })).toBeInTheDocument();
  });

  it('persists the picked sound', () => {
    render(<AlarmSoundPicker />);
    expect(getAlarmSound()).toBe(DEFAULT_ALARM_SOUND);

    act(() => {
      screen.getByRole('radio', { name: /Castor/ }).click();
    });

    expect(getAlarmSound()).toBe('castor');
    expect(screen.getByRole('radio', { name: /Castor/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Clochette/ })).not.toBeChecked();
  });
});
