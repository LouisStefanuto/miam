/**
 * Small pixel-art sprites in the style of the Miam beaver logo: flat colors with a dark outline.
 * Each row is one line of pixels; '.' is transparent and every other character is a key of PIXEL_PALETTE.
 */
export const PIXEL_PALETTE: Record<string, string> = {
  k: '#2b1d14', // outline
  e: '#2b1d14', // eyes, nose, mouth
  b: '#a0602e', // beaver fur
  B: '#b97a42', // fur highlight
  d: '#7d4520', // fur shade
  m: '#e3b383', // muzzle
  p: '#6b3a1c', // inner ear
  c: '#f2928a', // blush
  w: '#ffffff', // chef hat, teeth
  g: '#d8d2cb', // hat shade
  o: '#f28c28', // carrot, casserole
  O: '#c8641a', // carrot shade
  l: '#7cc04a', // leaf
  L: '#3f8f2c', // leaf shade
  q: '#e8507f', // radish
  Q: '#b02e5c', // radish shade
  T: '#cf6a40', // terracotta pot
  j: '#7a5232', // soil
  J: '#4f3420', // soil shade, pot shade
};

export interface PixelSpriteData {
  rows: string[];
}

export const sprites = {
  // Add-recipe tiles
  /** The logo beaver with a small chef hat. */
  chefBeaver: {
    rows: [
      '....kk.kkkk.kk....',
      '...kwwkwwwwkwwk...',
      '..kwwwwwwwwwwwwk..',
      '..kwwwwwwwwwwwwk..',
      '...kwwwwwwwwwwk...',
      '..kkggggggggggkk..',
      '.kbbkkkkkkkkkkbbk.',
      'kbpbBBbbbbbbBBbpbk',
      'kbbbbBbbbbbbBbbbbk',
      'kbbbbbbbbbbbbbbbbk',
      'kbbbwebbbbbbwebbbk',
      'kbbbeebbbbbbeebbbk',
      'kbcbbbbmmmmbbbbcbk',
      'kdbbbbmmeemmbbbbdk',
      '.kdbbbmmmmmmbbbdk.',
      '.kdbbbbmwwmbbbbdk.',
      '..kddbbbwwbbbddk..',
      '...kkddddddddkk...',
      '.....kkkkkkkk.....',
    ],
  },
  /** Radish, also on the welcome page shelf. */
  radish: {
    rows: [
      '..k.kkk..',
      '.klkLllk.',
      'klllklLLk',
      '.klLLLlk.',
      '..kLLLk..',
      '.kqqqqqk.',
      'kqqqqqqQk',
      'kqwqqqqQk',
      'kqqqqqqQk',
      '.kqqqqQk.',
      '..kwwgk..',
      '...kwk...',
      '....k....',
    ],
  },
  kawaiiCarrot: {
    rows: [
      '....k.k.k....',
      '...klkLklk...',
      '..kllkLkllk..',
      '...klLLLlk...',
      '..koooooook..',
      '.koooooooook.',
      'kooooooooooOk',
      'koooeoooeooOk',
      'koocooeoocoOk',
      '.kooooooooOk.',
      '.kooooooooOk.',
      '..kooooooOk..',
      '..kooooooOk..',
      '...kooooOk...',
      '....koook....',
      '.....kok.....',
      '......k......',
    ],
  },
  /** Seedling in a pot, for features still growing. */
  sprout: {
    rows: [
      '.......kk...',
      '...kk.kLLk..',
      '..kllkLLLk..',
      '.kllllkLLk..',
      '..klllkLk...',
      '...kkkLk....',
      '.kkkkkLkkkk.',
      'kTjjjjjjjjJk',
      'kTTTTTTTTTJk',
      '.kTTTTTTTJk.',
      '.kTTTTTTTJk.',
      '..kTTTTTJk..',
      '...kkkkkk...',
    ],
  },
} satisfies Record<string, PixelSpriteData>;

export interface PixelRun {
  x: number;
  y: number;
  length: number;
  color: string;
}

/** Splits each row into runs of one color, so a sprite draws with one rect per run instead of per pixel. */
export function spriteRuns(rows: string[]): PixelRun[] {
  const runs: PixelRun[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let length = 1;
      while (row[x + length] === key) length++;
      if (key !== '.') runs.push({ x, y, length, color: PIXEL_PALETTE[key] });
      x += length;
    }
  });
  return runs;
}
