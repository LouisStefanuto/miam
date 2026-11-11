import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ACCOUNT_PHOTO, AVATARS, MIAM_LOGO, getAvatar } from '@/lib/avatars';
import AvatarPicker from './AvatarPicker';

const EMAIL = 'ana@example.com';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Ana', email: 'ana@example.com' } }),
}));

describe('AvatarPicker', () => {
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

  it('offers the logo, the account photo and every avatar, with the logo checked', () => {
    render(<AvatarPicker />);
    expect(screen.getAllByRole('radio')).toHaveLength(AVATARS.length + 2);
    expect(screen.getByRole('radio', { name: /Logo Miam/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Photo du compte/ })).not.toBeChecked();
  });

  it('persists the picked avatar', () => {
    render(<AvatarPicker />);

    act(() => {
      screen.getByRole('radio', { name: 'Grande toque' }).click();
    });

    expect(getAvatar(EMAIL)).toBe('grande-toque');
    expect(screen.getByRole('radio', { name: 'Grande toque' })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Photo du compte/ })).not.toBeChecked();
  });

  it('switches to the account photo', () => {
    render(<AvatarPicker />);

    act(() => {
      screen.getByRole('radio', { name: 'Fraise' }).click();
    });
    act(() => {
      screen.getByRole('radio', { name: /Photo du compte/ }).click();
    });

    expect(getAvatar(EMAIL)).toBe(ACCOUNT_PHOTO);
    expect(screen.getByRole('radio', { name: /Photo du compte/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Fraise' })).not.toBeChecked();
  });

  it('goes back to the logo', () => {
    render(<AvatarPicker />);

    act(() => {
      screen.getByRole('radio', { name: 'Fraise' }).click();
    });
    expect(screen.getByRole('radio', { name: /Logo Miam/ })).not.toBeChecked();

    act(() => {
      screen.getByRole('radio', { name: /Logo Miam/ }).click();
    });

    expect(getAvatar(EMAIL)).toBe(MIAM_LOGO);
    expect(screen.getByRole('radio', { name: /Logo Miam/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Fraise' })).not.toBeChecked();
  });
});
