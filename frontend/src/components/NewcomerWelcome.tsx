import type { CSSProperties } from 'react';
import { ChevronRight, Inbox } from 'lucide-react';
import PixelSprite from '@/components/PixelSprite';
import { ADD_RECIPE_MODES } from '@/lib/add-recipe-modes';
import { PixelSpriteData, sprites } from '@/lib/pixel-sprites';

/** Where a sticker sits: left edge in % of the stage width, top edge in px, and screen pixels per sprite pixel. */
interface StickerSpot {
  x: number;
  y: number;
  scale: number;
}

interface Sticker {
  sprite: PixelSpriteData;
  /** Below lg: in the strip above the text, one step bigger on tablets. Left out, the sticker only shows on wide screens. */
  narrow?: StickerSpot;
  /** From lg: around the centered text, in a 420px tall stage. Left out, the sticker only shows on narrow screens. */
  wide?: StickerSpot;
  /** Tilt in degrees. */
  tilt: number;
}

const STICKERS: Sticker[] = [
  { sprite: sprites.chefWithSpoon, narrow: { x: 3, y: 16, scale: 3 }, wide: { x: 4, y: 30, scale: 5 }, tilt: -6 },
  { sprite: sprites.cheese, narrow: { x: 39, y: 4, scale: 2.5 }, wide: { x: 62, y: 18, scale: 4 }, tilt: 8 },
  { sprite: sprites.kawaiiTomato, narrow: { x: 74, y: 20, scale: 3 }, wide: { x: 84, y: 26, scale: 5 }, tilt: 8 },
  { sprite: sprites.strawberry, narrow: { x: 57, y: 54, scale: 2.5 }, wide: { x: 26, y: 350, scale: 4 }, tilt: -6 },
  { sprite: sprites.mushroom, narrow: { x: 86, y: 68, scale: 2.5 }, wide: { x: 9, y: 262, scale: 4 }, tilt: -8 },
  { sprite: sprites.broccoli, wide: { x: 31, y: 8, scale: 4 }, tilt: -4 },
  { sprite: sprites.simmeringPot, wide: { x: 86, y: 206, scale: 4 }, tilt: 4 },
  { sprite: sprites.lemon, wide: { x: 66, y: 356, scale: 4 }, tilt: -6 },
];

/** Cards lean a little, like stickers put on by hand. */
const CARD_TILTS = [-1.5, 2, -2];

/** Opens straight from the catalog, so only the ways that work today. */
const MODES = ADD_RECIPE_MODES.filter((mode) => !mode.comingSoon);

function stickerStyle(sticker: Sticker, index: number): CSSProperties {
  const { narrow, wide } = sticker;
  return {
    '--nx': narrow && `${narrow.x}%`,
    '--ny': narrow && `${narrow.y}px`,
    '--ns': narrow?.scale,
    '--wx': wide && `${wide.x}%`,
    '--wy': wide && `${wide.y}px`,
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
          className={`absolute left-[var(--nx)] top-[var(--ny)] [--pixel-scale:var(--ns)] md:[--pixel-scale:calc(var(--ns)_+_1)] lg:left-[var(--wx)] lg:top-[var(--wy)] lg:[--pixel-scale:var(--ws)] motion-safe:animate-sticker-in ${
            !sticker.narrow ? 'hidden lg:block' : !sticker.wide ? 'lg:hidden' : ''
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

/** Hand-drawn underline, drawn in once the title is up. */
function Squiggle() {
  return (
    <svg
      viewBox="0 0 100 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute left-0 -bottom-[0.14em] w-full h-[0.26em] overflow-visible"
    >
      <path
        d="M 2 8 Q 26 2, 50 7 T 98 5"
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="motion-safe:animate-stroke-draw [animation-delay:500ms]"
      />
    </svg>
  );
}

/** The card edge, tilt and shadow shared by every sticker card. Hover straightens it. */
const stickerCard =
  'border-[5px] border-[hsl(var(--sticker-edge))] [rotate:var(--tilt)] [filter:drop-shadow(0_12px_14px_hsl(25_40%_20%/0.22))] transition-[rotate,translate,scale] duration-200 active:[scale:0.97] md:hover:[rotate:0deg] md:hover:[translate:0_-4px]';

interface NewcomerWelcomeProps {
  /** Recipes other people shared, still waiting in the inbox. */
  pendingShares: number;
  /** Opens one of the add recipe pages. */
  onAdd: (to: string) => void;
  onOpenInbox: () => void;
}

/** What the catalog shows before the first recipe: stickers around a welcome, and the ways to add a recipe. */
export default function NewcomerWelcome({ pendingShares, onAdd, onOpenInbox }: NewcomerWelcomeProps) {
  return (
    <section
      aria-labelledby="newcomer-title"
      className="flex-1 flex flex-col items-center pb-6 md:justify-center lg:pb-10"
    >
      <div className="relative w-full pt-[104px] md:pt-[124px] lg:pt-0 lg:h-[420px] lg:flex lg:items-center lg:justify-center">
        <StickerLayer />
        <div className="relative flex flex-col items-center gap-3 text-center lg:gap-4">
          <p className="font-hand text-[30px] lg:text-[40px] leading-none font-bold text-primary -rotate-3 motion-safe:animate-fade-in">
            Bienvenue&nbsp;!
          </p>
          <h1
            id="newcomer-title"
            className="font-display text-[34px] md:text-5xl lg:text-[56px] leading-[1.08] font-bold tracking-tight text-foreground text-balance"
          >
            Votre livre de recettes <br className="hidden md:block" />
            est{' '}
            <span className="relative inline-block whitespace-nowrap text-primary">
              tout neuf
              <Squiggle />
            </span>
          </h1>
          <p className="mt-1 max-w-[30ch] font-body text-[17px] lg:text-xl text-muted-foreground">
            Choisissez comment ajouter votre première recette.
          </p>
        </div>
      </div>

      <div className="mt-8 lg:mt-0 w-full max-w-md md:max-w-3xl flex flex-col gap-4 md:gap-5">
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {MODES.map((mode, i) => (
            // The wrapper plays the entrance, so it does not hold the button's own scale on press.
            <div
              key={mode.to}
              style={{ animationDelay: `${260 + i * 90}ms` }}
              className={`motion-safe:animate-sticker-in ${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <button
                type="button"
                onClick={() => onAdd(mode.to)}
                style={{ '--tilt': `${CARD_TILTS[i % CARD_TILTS.length]}deg`, WebkitTapHighlightColor: 'transparent' } as CSSProperties}
                className={`relative w-full h-full min-h-[128px] md:min-h-[176px] p-4 md:p-5 rounded-3xl flex flex-col justify-between gap-3 text-left ${stickerCard} ${mode.tile}`}
              >
                <span className={`w-10 h-10 md:w-12 md:h-12 rounded-full grid place-items-center ${mode.chip}`}>
                  <mode.icon size={20} />
                </span>
                <PixelSprite sprite={mode.sprite} scale={mode.spriteScale} className="absolute top-3 right-3" />
                <span className="block min-w-0">
                  <span className="block font-body text-[17px] font-bold leading-tight">{mode.label}</span>
                  <span className={`block mt-1 font-body text-[13px] ${mode.sub}`}>{mode.description}</span>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
