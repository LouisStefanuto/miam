import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PixelSprite from '@/components/PixelSprite';
import { PixelSpriteData, sprites } from '@/lib/pixel-sprites';

/* ── Rotating headline words ── */
const ROTATING_WORDS = [
  'de grand-mère',
  'pour les frigos vides',
  'de la flemme',
  'pour ton date',
  'qui réchauffent',
  'de saison',
  'du dimanche',
];

function useTypewriter(words: string[], pauseMs = 1100) {
  const [displayed, setDisplayed] = useState(words[0]);
  const wordIdx = useRef(0);
  const charIdx = useRef(words[0].length);
  const phase = useRef<'pause' | 'deleting' | 'typing'>('pause');

  useEffect(() => {
    const DELETE_SPEED = 25;
    const TYPE_SPEED = 45;

    const tick = () => {
      if (phase.current === 'pause') {
        phase.current = 'deleting';
        return pauseMs;
      }

      if (phase.current === 'deleting') {
        charIdx.current--;
        const currentWord = words[wordIdx.current];
        setDisplayed(currentWord.slice(0, charIdx.current));

        if (charIdx.current === 0) {
          phase.current = 'typing';
          wordIdx.current = (wordIdx.current + 1) % words.length;
          return TYPE_SPEED + 200;
        }
        return DELETE_SPEED + Math.random() * 30;
      }

      // typing
      const nextWord = words[wordIdx.current];
      charIdx.current++;
      setDisplayed(nextWord.slice(0, charIdx.current));

      if (charIdx.current === nextWord.length) {
        phase.current = 'pause';
        return pauseMs;
      }
      return TYPE_SPEED + Math.random() * 35;
    };

    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = tick();
      timer = setTimeout(schedule, delay);
    };
    timer = setTimeout(schedule, pauseMs);

    return () => clearTimeout(timer);
  }, [words, pauseMs]);

  return displayed;
}

/* ── Pixel-art kitchen counter ── */
const TOP_SHELF = [sprites.lemon, sprites.garlic, sprites.hourglass, sprites.cheese, sprites.radish];
const MIDDLE_SHELF = [sprites.cherryTomatoes, sprites.eggplant, sprites.mushroom, sprites.strawberry, sprites.avocado];

/** Tiled wall: grout lines in the page background color over the accent surface, so it follows the theme. */
const WALL_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(hsl(var(--background) / 0.7) 2px, transparent 2px), linear-gradient(90deg, hsl(var(--background) / 0.7) 2px, transparent 2px)',
  backgroundSize: 'var(--tile) var(--tile)',
  backgroundPosition: '-1px -1px',
};

function Shelf({ items, className = '' }: { items: PixelSpriteData[]; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-end justify-around px-1">
        {items.map((sprite, i) => (
          <PixelSprite key={i} sprite={sprite} className="block" />
        ))}
      </div>
      <div className="h-3 rounded-sm bg-[#c98a4b] shadow-[inset_0_-4px_0_#8c5a2b,0_7px_0_hsl(25_40%_20%/0.1)]" />
    </div>
  );
}

function KitchenCounter() {
  return (
    <div
      aria-hidden="true"
      style={WALL_STYLE}
      className="anim-hero order-first lg:order-none flex flex-col justify-end gap-6 lg:gap-10 overflow-hidden rounded-3xl lg:rounded-[32px] bg-accent pt-5 px-4 lg:pt-11 lg:px-8 [--tile:34px] lg:[--tile:44px] [--pixel-scale:3] md:[--pixel-scale:4] xl:[--pixel-scale:5]"
    >
      {/* The top shelf only fits beside the text on wide screens */}
      <Shelf items={TOP_SHELF} className="hidden lg:block" />
      <Shelf items={MIDDLE_SHELF} />
      <div>
        <div className="flex items-end justify-center gap-3 md:gap-5">
          <span className="[--pixel-scale:4] min-[380px]:[--pixel-scale:5] md:[--pixel-scale:6] lg:[--pixel-scale:7] xl:[--pixel-scale:8]">
            <PixelSprite sprite={sprites.chefWithSpoon} className="block" />
          </span>
          <PixelSprite sprite={sprites.simmeringPot} className="block" />
          <PixelSprite sprite={sprites.bunchOfCarrots} className="block" />
        </div>
        <div className="-mx-4 lg:-mx-8 h-[26px] lg:h-[34px] bg-[#b07040] shadow-[inset_0_5px_0_#d29a5e,inset_0_-7px_0_#7a4a24]" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const typed = useTypewriter(ROTATING_WORDS);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (credential: string) => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle(credential);
      navigate('/', { replace: true });
    } catch {
      setIsLoggingIn(false);
      toast.error('Échec de la connexion. Veuillez réessayer.');
    }
  };

  const googleButton = (width: string) =>
    isLoggingIn ? (
      <p className="text-sm text-muted-foreground">Connexion en cours...</p>
    ) : (
      <GoogleLogin
        onSuccess={(r) => { if (r.credential) handleLogin(r.credential); }}
        onError={() => toast.error('Échec de la connexion Google.')}
        theme="filled_black"
        size="large"
        text="continue_with"
        shape="pill"
        width={width}
      />
    );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden font-body">
      <style>{`
        @keyframes hero-in {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-hero  { animation: hero-in .8s cubic-bezier(.16,1,.3,1) both; }
        .anim-hero3 { animation: hero-in .8s cubic-bezier(.16,1,.3,1) .24s both; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        .typewriter-cursor::after {
          content: '|';
          display: inline-block;
          margin-left: 2px;
          font-weight: 300;
          color: hsl(var(--primary));
          animation: blink 0.8s step-end infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-hero, .anim-hero3 { animation: none; }
        }
      `}</style>

      {/* ─────────────── NAV BAR ─────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="flex items-center h-14 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="Miam" className="w-9 h-9 rounded-lg" />
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              Miam
            </span>
          </Link>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <main className="flex-1 w-full max-w-xl lg:max-w-7xl mx-auto flex flex-col gap-6 px-4 pt-[72px] pb-5 lg:grid lg:grid-cols-[1fr_1.12fr] lg:gap-14 lg:pl-16 lg:pr-10 lg:pt-24 lg:pb-9">
        <div className="anim-hero3 flex flex-col gap-3.5 lg:gap-5 lg:self-center">
          <h1 className="font-display text-[2.5rem] leading-[1.08] lg:text-[4.125rem] font-bold text-foreground tracking-tight">
            Mes recettes{' '}
            <span className="block min-h-[2.2em] text-primary typewriter-cursor">{typed}</span>
          </h1>
          <p className="text-[17px] lg:text-xl text-muted-foreground leading-relaxed">
            Importez, organisez et partagez vos recettes.
          </p>
          <div className="mt-1.5">
            <div className="md:hidden">{googleButton('280')}</div>
            <div className="hidden md:block">{googleButton('360')}</div>
          </div>
        </div>

        <KitchenCounter />
      </main>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="py-6 px-5 text-center">
        <p className="text-xs text-muted-foreground/40 font-body">
          Fait avec amour pour les gourmands
        </p>
      </footer>
    </div>
  );
}
