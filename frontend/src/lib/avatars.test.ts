import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readdirSync } from 'fs';
import path from 'path';
import { AVATARS, AVATAR_GROUPS, getAvatar, setAvatar, subscribeToAvatar } from './avatars';

describe('avatar catalog', () => {
  it('matches the images in public/avatars one to one', () => {
    const files = readdirSync(path.resolve(__dirname, '../../public/avatars'))
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.replace(/\.svg$/, ''));
    expect(AVATARS.map((avatar) => avatar.id).sort()).toEqual(files.sort());
  });

  it('gives every avatar a known group', () => {
    const groups = new Set(AVATAR_GROUPS.map((group) => group.id));
    expect(AVATARS.every((avatar) => groups.has(avatar.group))).toBe(true);
  });
});

describe('avatar storage', () => {
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

  it('falls back to the account photo when nothing is picked', () => {
    expect(getAvatar('ana@example.com')).toBeNull();
  });

  it('keeps one pick per account', () => {
    setAvatar('ana@example.com', 'fraise');
    setAvatar('bob@example.com', 'grande-toque');
    expect(getAvatar('ana@example.com')).toBe('fraise');
    expect(getAvatar('bob@example.com')).toBe('grande-toque');
  });

  it('goes back to the account photo when cleared', () => {
    setAvatar('ana@example.com', 'fraise');
    setAvatar('ana@example.com', null);
    expect(getAvatar('ana@example.com')).toBeNull();
  });

  it('ignores an id that is no longer in the catalog', () => {
    localStorage.setItem('miam-avatar:ana@example.com', 'ancien-avatar');
    expect(getAvatar('ana@example.com')).toBeNull();
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAvatar(listener);
    setAvatar('ana@example.com', 'fraise');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setAvatar('ana@example.com', 'citron');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
