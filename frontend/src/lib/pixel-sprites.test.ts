import { describe, expect, it } from 'vitest';
import { PIXEL_PALETTE, sprites, spriteRuns } from './pixel-sprites';

describe('pixel sprites', () => {
  it.each(Object.entries(sprites))('%s has rows of equal length and only known colors', (_, sprite) => {
    const widths = new Set(sprite.rows.map((row) => row.length));
    expect(widths.size).toBe(1);
    for (const key of sprite.rows.join('').replace(/\./g, '')) {
      expect(PIXEL_PALETTE).toHaveProperty(key);
    }
  });
});

describe('spriteRuns', () => {
  it('merges same-color pixels on a row and skips transparent ones', () => {
    expect(spriteRuns(['.kkw', 'ww..'])).toEqual([
      { x: 1, y: 0, length: 2, color: PIXEL_PALETTE.k },
      { x: 3, y: 0, length: 1, color: PIXEL_PALETTE.w },
      { x: 0, y: 1, length: 2, color: PIXEL_PALETTE.w },
    ]);
  });
});
