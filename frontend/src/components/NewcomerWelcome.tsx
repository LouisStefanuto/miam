import type { CSSProperties } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import PixelSprite from '@/components/PixelSprite';
import { ADD_RECIPE_MODES, AddRecipeMode } from '@/lib/add-recipe-modes';
import { PixelSpriteData, sprites } from '@/lib/pixel-sprites';

/** On phones, a sticker sits in the band above or below the text: px from the band's outer edge. */
interface NarrowSpot {
  /** Left edge, in % of the width. */
  x: number;
  top?: number;
  bottom?: number;
  scale: number;
}

/** From md, a sticker sits in the margins of the panel. */
interface WideSpot {
  /** Left and top edges, in % of the panel. */
  x: number;
  y: number;
  /** One size bigger from xl. */
  scale: number;
}

interface Sticker {
  sprite: PixelSpriteData;
  /** Left out, the sticker only shows from md. */
  narrow?: NarrowSpot;
  /** Left out, the sticker only shows on phones. */
  wide?: WideSpot;
  /** Tilt in degrees. */
  tilt: number;
}

// On phones, three stickers above the text and three below frame it, each at its own height and tilt so they
// look dropped by hand. Wide spots keep to the outer 14% on each side, and to the top band, where the text and
// cards never reach.
const STICKERS: Sticker[] = [
  { sprite: sprites.chefWithSpoon, narrow: { x: 4, top: 26, scale: 3 }, wide: { x: 2, y: 5, scale: 3.5 }, tilt: -8 },
  { sprite: sprites.kawaiiTomato, narrow: { x: 74, top: 12, scale: 3 }, wide: { x: 87, y: 7, scale: 3.5 }, tilt: 5 },
  { sprite: sprites.cheese, narrow: { x: 12, bottom: 16, scale: 2.5 }, wide: { x: 66, y: 5, scale: 3 }, tilt: 12 },
  { sprite: sprites.broccoli, narrow: { x: 37, top: 0, scale: 2.5 }, wide: { x: 26, y: 4, scale: 3 }, tilt: 10 },
  { sprite: sprites.simmeringPot, wide: { x: 88, y: 44, scale: 3 }, tilt: 4 },
  { sprite: sprites.mushroom, narrow: { x: 52, bottom: 2, scale: 2.5 }, wide: { x: 5, y: 50, scale: 3.5 }, tilt: -12 },
  { sprite: sprites.strawberry, narrow: { x: 82, bottom: 28, scale: 3 }, wide: { x: 6, y: 80, scale: 3.5 }, tilt: -4 },
  { sprite: sprites.lemon, wide: { x: 88, y: 80, scale: 3.5 }, tilt: -6 },
];

/** Cards lean a little, like stickers put on by hand. */
const CARD_TILTS = [-1.5, 2];

const [createMode, instagramMode, jsonMode] = ['/recipes/new', '/import/instagram', '/import/json'].map(
  (to) => ADD_RECIPE_MODES.find((mode) => mode.to === to) as AddRecipeMode,
);

/**
 * The two ways a newcomer most likely starts with. Manual creation takes the green of the add page's
 * JSON tile here: its orange was too loud on the welcome.
 */
const CARDS: AddRecipeMode[] = [
  { ...createMode, tile: jsonMode.tile, chip: jsonMode.chip, sub: jsonMode.sub },
  instagramMode,
];

function stickerStyle(sticker: Sticker, index: number): CSSProperties {
  const { narrow, wide } = sticker;
  return {
    '--nx': narrow && `${narrow.x}%`,
    '--nt': narrow?.top !== undefined ? `${narrow.top}px` : undefined,
    '--nb': narrow?.bottom !== undefined ? `${narrow.bottom}px` : undefined,
    '--ns': narrow?.scale,
    '--wx': wide && `${wide.x}%`,
    '--wy': wide && `${wide.y}%`,
    '--ws': wide?.scale,
    rotate: `${sticker.tilt}deg`,
    animationDelay: `${120 + index * 70}ms`,
  } as CSSProperties;
}

function StickerLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {STICKERS.map((sticker, i) => (
        <span
          key={i}
          style={stickerStyle(sticker, i)}
          className={`absolute left-[var(--nx)] top-[var(--nt,auto)] bottom-[var(--nb,auto)] [--pixel-scale:var(--ns)] md:left-[var(--wx)] md:top-[var(--wy)] md:bottom-auto md:[--pixel-scale:var(--ws)] xl:[--pixel-scale:calc(var(--ws)_+_1)] motion-safe:animate-sticker-in ${
            !sticker.narrow ? 'hidden md:block' : !sticker.wide ? 'md:hidden' : ''
          }`}
        >
          <span
            className="pixel-sticker block motion-safe:animate-sticker-bob"
            style={{ animationDelay: `${(i * 0.37).toFixed(2)}s` }}
          >
            <PixelSprite sprite={sticker.sprite} className="block" />
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * The card edge, tilt and shadow shared by every sticker card. Full-width rows on phones lean half as much.
 * Hover straightens and lifts a card. Only the way in is animated: moving from one card to the next, the
 * card left behind settles back at once, so a single card is ever in motion.
 */
const stickerCard =
  'border-4 md:border-[5px] border-[hsl(var(--sticker-edge))] [rotate:calc(var(--tilt)*0.5)] md:[rotate:var(--tilt)] [filter:drop-shadow(0_6px_10px_hsl(25_40%_20%/0.14))] md:[filter:drop-shadow(0_12px_14px_hsl(25_40%_20%/0.2))] transition-[scale] md:hover:transition-[rotate,translate,scale] duration-200 active:[scale:0.97] md:hover:[rotate:0deg] md:hover:[translate:0_-4px]';

interface NewcomerWelcomeProps {
  /** Recipes other people shared, still waiting in the inbox. */
  pendingShares: number;
  /** Opens one of the add recipe pages. */
  onAdd: (to: string) => void;
  onOpenInbox: () => void;
}

/**
 * What the catalog shows before the first recipe: stickers around a welcome, and two ways to add a recipe.
 * On phones it takes the whole screen. From md it is a panel in place of the recipe grid, under the usual
 * search bar and filters, so the page still reads as the catalog.
 */
export default function NewcomerWelcome({ pendingShares, onAdd, onOpenInbox }: NewcomerWelcomeProps) {
  return (
    <section
      aria-labelledby="newcomer-title"
      className="relative flex-1 flex flex-col items-center pb-6 md:justify-center md:min-h-[460px] md:px-8 md:py-10 md:rounded-[32px] md:border-2 md:border-dashed md:border-border md:bg-accent/30 md:overflow-hidden"
    >
      {/* On phones the text and the stickers framing it share the room above the cards, centered in it. From md the
          stickers spread over the whole panel instead, so this block stops being their frame. */}
      <div className="w-full flex-1 flex flex-col justify-center md:flex-none">
        <div className="relative pt-[96px] pb-[100px] md:static md:p-0">
          <StickerLayer />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <p className="font-hand text-[30px] md:text-[32px] xl:text-[36px] leading-none font-bold text-primary -rotate-3 motion-safe:animate-fade-in">
              Bienvenue&nbsp;!
            </p>
            <h1
              id="newcomer-title"
              className="font-display text-[34px] md:text-[44px] xl:text-[52px] leading-[1.08] font-bold tracking-tight text-foreground text-balance"
            >
              C'est l'heure d'écrire <br className="hidden md:block" />
              votre{' '}
              <span className="whitespace-nowrap">
                <span className="text-primary">première recette</span>&nbsp;!
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* On phones the cards sit at the bottom, within reach of the thumb */}
      <div className="relative pt-6 md:pt-0 md:mt-7 w-full max-w-md md:max-w-lg flex flex-col gap-3 md:gap-5">
        {pendingShares > 0 && (
          <button
            type="button"
            onClick={onOpenInbox}
            style={{ '--tilt': '0.6deg', WebkitTapHighlightColor: 'transparent' } as CSSProperties}
            className={`w-full flex items-center gap-3 p-3 md:p-4 rounded-3xl text-left bg-card bg-[linear-gradient(hsl(205_80%_60%/0.17),hsl(205_80%_60%/0.17))] text-foreground motion-safe:animate-fade-in ${stickerCard}`}
          >
            <span className="w-11 h-11 shrink-0 rounded-full grid place-items-center bg-card text-[hsl(205_70%_42%)] dark:text-[hsl(205_80%_70%)]">
              <Inbox size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-[16px] font-bold leading-tight">
                {pendingShares} recette{pendingShares > 1 ? 's' : ''} partagée{pendingShares > 1 ? 's' : ''} avec vous
              </span>
              <span className="block mt-0.5 font-body text-[13px] text-foreground/65">
                À accepter dans votre boîte de réception
              </span>
            </span>
            <ChevronRight size={20} className="shrink-0 text-foreground/50" />
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          {CARDS.map((mode, i) => (
            // The wrapper plays the entrance, so it does not hold the button's own scale on press.
            <div
              key={mode.to}
              style={{ animationDelay: `${260 + i * 90}ms` }}
              className="motion-safe:animate-sticker-in"
            >
              <button
                type="button"
                onClick={() => onAdd(mode.to)}
                style={{ '--tilt': `${CARD_TILTS[i % CARD_TILTS.length]}deg`, WebkitTapHighlightColor: 'transparent' } as CSSProperties}
                // A row on phones: chip, text, sprite. A tile from md: chip on top, text at the bottom, sprite in the corner.
                className={`relative w-full h-full flex items-center gap-3 p-3 pr-4 rounded-[22px] text-left md:min-h-[176px] md:p-5 md:rounded-3xl md:flex-col md:items-start md:justify-between ${stickerCard} ${mode.tile}`}
              >
                <span className={`w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-full grid place-items-center ${mode.chip}`}>
                  <mode.icon size={20} />
                </span>
                <span className="block min-w-0 flex-1 md:flex-none">
                  <span className="block font-body text-[16px] md:text-[17px] font-bold leading-tight">{mode.label}</span>
                  <span className={`block mt-0.5 md:mt-1 font-body text-[13px] ${mode.sub}`}>{mode.description}</span>
                </span>
                <PixelSprite
                  sprite={mode.sprite}
                  scale={mode.spriteScale}
                  className="shrink-0 md:absolute md:top-3 md:right-3"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
