import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readdirSync } from 'fs';
import path from 'path';
import {
  ACCOUNT_PHOTO,
  AVATARS,
  AVATAR_GROUPS,
  DEFAULT_AVATAR,
  getAvatar,
  getAvatarById,
  MIAM_LOGO,
  setAvatar,
  subscribeToAvatar,
} from './avatars';

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

  it('keeps the logo and account photo values apart from the avatar ids', () => {
    expect(getAvatarById(MIAM_LOGO)).toBeUndefined();
    expect(getAvatarById(ACCOUNT_PHOTO)).toBeUndefined();
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

  it('shows the Miam logo when nothing is picked', () => {
    expect(DEFAULT_AVATAR).toBe(MIAM_LOGO);
    expect(getAvatar('ana@example.com')).toBe(MIAM_LOGO);
  });

  it('keeps one pick per account', () => {
    setAvatar('ana@example.com', 'fraise');
    setAvatar('bob@example.com', 'grande-toque');
    expect(getAvatar('ana@example.com')).toBe('fraise');
    expect(getAvatar('bob@example.com')).toBe('grande-toque');
  });

  it('keeps the account photo or the logo when picked', () => {
    setAvatar('ana@example.com', 'fraise');
    setAvatar('ana@example.com', ACCOUNT_PHOTO);
    expect(getAvatar('ana@example.com')).toBe(ACCOUNT_PHOTO);
    setAvatar('ana@example.com', MIAM_LOGO);
    expect(getAvatar('ana@example.com')).toBe(MIAM_LOGO);
  });

  it('ignores an id that is no longer in the catalog', () => {
    localStorage.setItem('miam-avatar:ana@example.com', 'ancien-avatar');
    expect(getAvatar('ana@example.com')).toBe(DEFAULT_AVATAR);
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
