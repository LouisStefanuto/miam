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
  r: '#e5483a', // tomato, strawberry
  R: '#b3301f', // tomato shade
  h: '#ff9f8a', // tomato highlight
  y: '#c98a4b', // wood
  Y: '#8c5a2b', // wood shade
  X: '#3d3a40', // lid knob
  G: '#a8d8ec', // glass
  n: '#f6cd4f', // lemon, sand, seeds
  N: '#d39a28', // lemon shade
  E: '#fff4e0', // cream
  F: '#e8d2ae', // cream shade
  M: '#f5efe4', // garlic
  f: '#f6c945', // cheese
  '7': '#e0aa2c', // cheese rind
  '8': '#c98f1e', // cheese holes
  q: '#e8507f', // radish
  Q: '#b02e5c', // radish shade
  v: '#7a4ab0', // eggplant
  V: '#522e80', // eggplant shade
  u: '#a8643a', // mushroom cap
  U: '#74401f', // mushroom cap shade
  a: '#c9e27a', // avocado flesh
  A: '#4f7a2a', // avocado skin
  P: '#8a5a30', // avocado pit
  T: '#cf6a40', // terracotta pot
  j: '#7a5232', // soil
  J: '#4f3420', // soil shade, pot shade
  z: '#b5a898', // steam
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
  // Kitchen counter on the welcome page
  /** Chef beaver holding a wooden spoon. */
  chefWithSpoon: {
    rows: [
      '....kk.kkkk.kk..........',
      '...kwwkwwwwkwwk....kkk..',
      '..kwwwwwwwwwwwwk..kyyyk.',
      '..kwwwwwwwwwwwwk.kyEyyyk',
      '...kwwwwwwwwwwk..kyyyyYk',
      '..kkggggggggggkk.kyyyyYk',
      '.kbbkkkkkkkkkkbbk.kyyYk.',
      'kbpbBBbbbbbbBBbpbk.kyYk.',
      'kbbbbBbbbbbbBbbbbk.kyYk.',
      'kbbbbbbbbbbbbbbbbk.kyYk.',
      'kbbbwebbbbbbwebbbk.kyYk.',
      'kbbbeebbbbbbeebbbk.kyYk.',
      'kbcbbbbmmmmbbbbcbk.kyYk.',
      'kdbbbbmmeemmbbbbdk.kyYk.',
      '.kdbbbmmmmmmbbbdk..kyYk.',
      '.kdbbbbmwwmbbbbdk..kYYk.',
      '..kddbbbwwbbbddk....kk..',
      '...kkddddddddkk.........',
      '.....kkkkkkkk...........',
    ],
  },
  /** Orange casserole with steam rising. */
  simmeringPot: {
    rows: [
      '.....z....z....z....',
      '......z....z....z...',
      '.....z...kz....z....',
      '......kkkXXkkk......',
      '....kkooooooookk....',
      '...kooooooooooOOk...',
      '..kOOOOOOOOOOOOOOk..',
      '.kXoooooooooooooOXk.',
      'kXXohoooooooooooOXXk',
      '.kXohoooooooooooOXk.',
      '..kohoooooooooOOOk..',
      '..koooooooooooOOOk..',
      '...kOOOOOOOOOOOOk...',
      '....kkkkkkkkkkkk....',
    ],
  },
  bunchOfCarrots: {
    rows: [
      '.....k..kkk..k.....',
      '....kLkklllkkLk....',
      '....kLLklllkLLk....',
      '.....kLLlklLLk.....',
      '.....kLLOoOLLk.....',
      '......kOoooOk......',
      '......kOooOok......',
      '.....koOoOoook.....',
      '....koOoOoooOok....',
      '....kooOoOoOook....',
      '...kooooOkOooook...',
      '..koOooOk.kOooOok..',
      '..kooOOk...kOOook..',
      '.kooOkk.....kkOook.',
      'koOkk.........kkOok',
      '.kk.............kk.',
    ],
  },
  cherryTomatoes: {
    rows: [
      '.............kk.',
      '..kkkkkkkkkkkLlk',
      '.kLLLLLLLLLLLLk.',
      '..kLkkkLkkLkkk..',
      '..kLk.kLkrLrk...',
      '.krLrkkLrhrrrk..',
      'krhrrrkLrrrrRk..',
      'krrrrRkLrrrRRk..',
      'krrrRRkLkRRRk...',
      '.kRRRkkLkkkk....',
      '..kkkkrLrk......',
      '....krhrrrk.....',
      '....krrrrRk.....',
      '....krrrRRk.....',
      '.....kRRRk......',
      '......kkk.......',
    ],
  },
  eggplant: {
    rows: [
      '.....kk....',
      '....kLLk...',
      '...kLLLLk..',
      '..kLvLLvLk.',
      '..kvvvvvvk.',
      '.kvwvvvvVk.',
      '.kvwvvvvVk.',
      'kvvvvvvvVVk',
      'kvvvvvvvVVk',
      'kvvvvvvvVVk',
      '.kvvvvvVVk.',
      '..kvvVVVk..',
      '...kkkkk...',
    ],
  },
  mushroom: {
    rows: [
      '.....kkkkk.....',
      '...kkuuuuukk...',
      '..kuuuuuuuuuk..',
      '.kuuBBuuuuuuUk.',
      'kuuBuuuuuuuuUUk',
      'kUUUUUUUUUUUUUk',
      '.kkkEEEEEEEkkk.',
      '...kEEEEEEFk...',
      '..kEEEEEEEEFk..',
      '..kEEEEEEEEFk..',
      '...kEEEEEEFk...',
      '....kkkkkkk....',
    ],
  },
  strawberry: {
    rows: [
      '....k.k.k....',
      '...kLkLkLk...',
      '..kLLLLLLLk..',
      '.krLLrLrLLrk.',
      'krrrrrrrrrrRk',
      'krnrrnrrnrrRk',
      'krrrrrrrrrRRk',
      '.krnrrnrrnRk.',
      '.krrrrrrrRRk.',
      '..krnrrnrRk..',
      '...krrrRRk...',
      '....krRRk....',
      '.....kRk.....',
      '......k......',
    ],
  },
  avocado: {
    rows: [
      '.....kkk.....',
      '....kAAAk....',
      '...kAaaaAk...',
      '..kAaaaaaAk..',
      '..kAaaaaaAk..',
      '.kAaaaaaaaAk.',
      '.kAaaPPPaaAk.',
      'kAaaPyyPPaaAk',
      'kAaaPPPPPaaAk',
      'kAaaPPPPPaaAk',
      'kAaaaPPPaaaAk',
      '.kAaaaaaaaAk.',
      '.kAAaaaaaAAk.',
      '..kAAAAAAAk..',
      '...kkkkkkk...',
    ],
  },
  lemon: {
    rows: [
      '...........kk....',
      '..........kLLk...',
      '.....kkkkkLLlk...',
      '...kknnnnnnLkk...',
      '..knnnnnnnnnnnk..',
      '.knwwnnnnnnnnnNk.',
      'knnwnnnnnnnnnnNNk',
      '.knnnnnnnnnnnNNk.',
      '..knnnnnnnnnNNk..',
      '...kkNNNNNNNkk...',
      '.....kkkkkkk.....',
    ],
  },
  garlic: {
    rows: [
      '......k......',
      '.....kMk.....',
      '.....kMk.....',
      '....kMMMk....',
      '...kMMMMMk...',
      '..kMMgMgMMk..',
      '.kMMMgMgMMMk.',
      'kMMMMgMgMMgMk',
      'kMMMgMMMgMgMk',
      'kMMMgMMMgMgMk',
      '.kMMgMMMggMk.',
      '..kMMMMMMgk..',
      '...kFgFgFk...',
      '....kkkkk....',
    ],
  },
  hourglass: {
    rows: [
      '.kkkkkkkkkkk.',
      'kyyyyyyyyyyyk',
      '.kYYYYYYYYYk.',
      '.kyGGGGGGGyk.',
      '.kyGnnnnnGyk.',
      '.kykGnnnGkyk.',
      '.kykkGnGkkyk.',
      '.kyk.knk.kyk.',
      '.kykkGnGkkyk.',
      '.kykGGGGGkyk.',
      '.kyGGnnnGGyk.',
      '.kyGnnnnnGyk.',
      '.kYYYYYYYYYk.',
      'kyyyyyyyyyyyk',
      '.kkkkkkkkkkk.',
    ],
  },
  cheese: {
    rows: [
      '...........kk.....',
      '........kkkffk....',
      '.....kkkfffffEk...',
      '..kkkfffffffffEk..',
      '.kfffffffffffffEk.',
      'k7777777777777777k',
      'kffff8ffffffff8ffk',
      'kff888fffffff88f7k',
      'kfff8ffff8fffff77k',
      'kffffffff88ffff77k',
      'kffffff8fffffff77k',
      'k7777777777777777k',
      '.kkkkkkkkkkkkkkkk.',
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
