import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

function useTypewriter(words: string[], pauseMs = 1800) {
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

/* ── Post-it notes data ── */
const HANDWRITING_FONTS = [
  "'Patrick Hand', cursive",
  "'Indie Flower', cursive",
  "'Shadows Into Light', cursive",
  "'Kalam', cursive",
  "'Architects Daughter', cursive",
  "'Reenie Beanie', cursive",
  "'Caveat', cursive",
];

interface PostItData {
  bg: string;
  rotate: number;
  top?: string; bottom?: string; left?: string; right?: string;
  content: 'list' | 'beaver';
  lines?: string[];
  hideOnMobile?: boolean;
  size?: 'sm' | 'md';
}

const POST_ITS: PostItData[] = [
  { bg: '#f5f0e8', rotate: -4,  top: '10%',  left: '8%',   content: 'list', lines: ['Courses:', '- Tomates', '- Basilic', '- Mozza', '- Huile d\'olive', '- Pain de campagne'], hideOnMobile: true },
  { bg: '#fef3e2', rotate: 3,   top: '8%',   right: '10%', content: 'list', lines: ['Menu semaine:', 'Lun: Pâtes carbo', 'Mar: Soupe poireaux', 'Mer: Gratin dauphinois', 'Jeu: Salade niçoise', 'Ven: Pizza maison !'], hideOnMobile: true },
  { bg: '#ede7db', rotate: 5,   bottom: '10%', right: '12%', content: 'list', lines: ['Recette Mamie:', '- Farine 250g', '- 3 oeufs', '- Sucre 100g', '- Beurre 80g', '- Levure 1 sachet'], hideOnMobile: true },
  { bg: '#fef0db', rotate: -3,  bottom: '8%',  left: '10%',  content: 'beaver', hideOnMobile: true },
  { bg: '#f0ebe3', rotate: -5,  top: '45%',  right: '3%',  content: 'list', lines: ['Anniv\' Sam:', '- Gâteau choco', '- Bougies !!!', '- Chantilly', '- Déco table', '♥ ♥ ♥'], hideOnMobile: true },
];

/* ── Child-drawn beaver SVG — black sketch style ── */
function ChildBeaver() {
  const s = '#333'; // sketch stroke
  return (
    <svg viewBox="0 0 80 90" className="w-full h-full" aria-hidden>
      {/* body - wobbly scribble */}
      <path d="M18 56 Q16 42 28 40 Q40 37 52 40 Q64 43 62 57 Q60 72 40 74 Q20 72 18 56Z" fill="none" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
      {/* head - lopsided */}
      <path d="M24 32 Q22 16 40 14 Q58 16 56 32 Q54 46 40 47 Q26 46 24 32Z" fill="none" stroke={s} strokeWidth="1.8" strokeLinejoin="round" />
      {/* eyes - uneven dots */}
      <circle cx="33" cy="28" r="2.5" fill={s} />
      <circle cx="47" cy="27" r="3" fill={s} />
      {/* eye shine */}
      <circle cx="34" cy="27" r="0.8" fill="white" />
      <circle cx="48" cy="26" r="0.8" fill="white" />
      {/* nose */}
      <ellipse cx="40" cy="34" rx="3.5" ry="2.5" fill={s} />
      {/* teeth - big goofy rectangles */}
      <path d="M36 38 L36 44 L40 44 L40 38" fill="none" stroke={s} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M40 38 L40 45 L44.5 45 L44.5 38" fill="none" stroke={s} strokeWidth="1.3" strokeLinejoin="round" />
      {/* chef hat - scribbled */}
      <path d="M23 22 Q20 6 32 4 Q40 2 48 4 Q60 6 57 22" fill="none" stroke={s} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M23 22 L57 22" stroke={s} strokeWidth="1.2" />
      <path d="M35 22 Q36 18 40 17 Q44 18 45 22" fill="none" stroke={s} strokeWidth="0.8" />
      {/* tail - flat oval */}
      <path d="M60 62 Q72 58 74 66 Q72 74 60 70" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
      {/* cross-hatch on tail */}
      <line x1="63" y1="63" x2="69" y2="69" stroke={s} strokeWidth="0.7" />
      <line x1="65" y1="62" x2="71" y2="68" stroke={s} strokeWidth="0.7" />
      <line x1="67" y1="63" x2="70" y2="66" stroke={s} strokeWidth="0.7" />
      {/* arms - stick lines */}
      <path d="M20 50 Q14 44 10 46" fill="none" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M60 48 Q66 42 70 44" fill="none" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
      {/* feet - scribbled ovals */}
      <path d="M26 74 Q28 80 34 80 Q38 78 36 74" fill="none" stroke={s} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M46 75 Q48 81 54 81 Q58 79 56 75" fill="none" stroke={s} strokeWidth="1.3" strokeLinejoin="round" />
      {/* whiskers */}
      <line x1="22" y1="33" x2="30" y2="34" stroke={s} strokeWidth="0.7" />
      <line x1="21" y1="36" x2="29" y2="36" stroke={s} strokeWidth="0.7" />
      <line x1="50" y1="33" x2="58" y2="32" stroke={s} strokeWidth="0.7" />
      <line x1="51" y1="36" x2="59" y2="35" stroke={s} strokeWidth="0.7" />
    </svg>
  );
}

function PostIt({ note, index }: { note: PostItData; index: number }) {
  return (
    <div
      className={`postit postit-enter absolute rounded-[3px] p-4 md:p-5 w-[160px] md:w-[190px] select-none pointer-events-none ${note.hideOnMobile ? 'hidden md:block' : ''}`}
      style={{
        background: note.bg,
        fontFamily: HANDWRITING_FONTS[index % HANDWRITING_FONTS.length],
        top: note.top,
        bottom: note.bottom,
        left: note.left,
        right: note.right,
        transform: `rotate(${note.rotate}deg)`,
        animationDelay: `${0.05 * index}s`,
      }}
    >
      {note.content === 'beaver' ? (
        <div className="flex flex-col items-center">
          <div className="w-[110px] h-[120px] md:w-[130px] md:h-[140px]">
            <ChildBeaver />
          </div>
          <span className="text-[13px] text-stone-500 mt-1">Le chef Luigi</span>
        </div>
      ) : (
        <div className="text-[13px] md:text-[14px] leading-[1.4] text-stone-600 whitespace-pre-line">
          {note.lines?.map((line, i) => (
            <div key={i} className={i === 0 ? 'font-bold text-[14px] md:text-[15px] text-stone-700 mb-1' : ''}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const typed = useTypewriter(ROTATING_WORDS);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const startGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      setIsLoggingIn(true);
      try {
        await loginWithGoogle(code);
        navigate('/', { replace: true });
      } catch {
        setIsLoggingIn(false);
        toast.error('Échec de la connexion. Veuillez réessayer.');
      }
    },
    onError: () => toast.error('Échec de la connexion Google.'),
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-x-hidden font-body">
      <style>{`
        /* ── entrance animations ── */
        @keyframes hero-in {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-hero  { animation: hero-in .8s cubic-bezier(.16,1,.3,1) both; }
        .anim-hero3 { animation: hero-in .8s cubic-bezier(.16,1,.3,1) .24s both; }
        .anim-hero4 { animation: hero-in .8s cubic-bezier(.16,1,.3,1) .36s both; }

        /* ── typewriter cursor ── */
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

        /* ── pencil strikethrough on "Les" ── */
        @keyframes draw-line {
          from { stroke-dashoffset: 120; }
          to   { stroke-dashoffset: 0; }
        }
        .strike-line {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: draw-line .4s cubic-bezier(.4,0,.2,1) .4s forwards;
        }
        @keyframes hand-appear {
          from { opacity: 0; transform: translateY(6px) rotate(-4deg); }
          to   { opacity: 1; transform: translateY(0) rotate(-4deg); }
        }
        .hand-mes {
          opacity: 0;
          animation: hand-appear .35s cubic-bezier(.16,1,.3,1) .7s forwards;
        }

        /* ── post-it pop-in ── */
        @keyframes postit-pop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .postit-enter {
          animation: postit-pop .4s ease-out both;
        }


        /* ── post-it curled shadow + corner fold ── */
        .postit {
          background-image:
            linear-gradient(160deg, transparent 88%, rgba(0,0,0,0.03) 94%, rgba(0,0,0,0.07) 100%);
          box-shadow:
            1px 1px 3px rgba(0,0,0,0.06),
            0 6px 12px -4px rgba(0,0,0,0.10),
            0 12px 8px -10px rgba(0,0,0,0.08);
        }

        /* ── CTA button ── */
        .cta-btn {
          background: hsl(var(--foreground));
          box-shadow: 0 4px 20px -4px hsl(var(--foreground) / 0.25);
        }
        .cta-btn:hover {
          box-shadow: 0 8px 28px -4px hsl(var(--foreground) / 0.35);
        }
      `}</style>

      {/* ─────────────── NAV BAR ─────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/icon.png" alt="Miam" className="w-9 h-9 rounded-lg" />
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              Miam
            </span>
          </Link>
          {/* Desktop: navbar login */}
          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => startGoogleLogin()}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-body font-semibold transition-all hover:bg-foreground/85 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Se connecter
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────────── HERO ─────────────── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-5 pt-20 pb-16">
        {/* ── Post-its scattered ── */}
        <div className="absolute inset-0 pointer-events-none">
          {POST_ITS.map((note, i) => (
            <PostIt key={i} note={note} index={i} />
          ))}
        </div>

        <div className="relative z-20 max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h1 className="anim-hero font-display text-[2.75rem] leading-[1.1] md:text-7xl md:leading-[1.08] font-bold text-foreground tracking-tight">
            <span className="inline-flex items-baseline">
              <span className="relative inline-block mr-2 md:mr-3">
                <span className="hand-mes absolute -top-8 md:-top-12 left-1/2 font-hand text-primary text-[2rem] md:text-5xl font-bold whitespace-nowrap" style={{ transform: 'translateX(-60%) rotate(-4deg)' }}>
                  Mes
                </span>
                <span className="relative text-muted-foreground/40">
                  Les
                  <svg
                    className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M -4 28 Q 30 12, 55 20 T 104 14"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="strike-line"
                    />
                  </svg>
                </span>
              </span>
              recettes
            </span>
            <br />
            <span className="block min-h-[2.5em] md:min-h-[1.2em]">
              <span className="text-primary typewriter-cursor">
                {typed}
              </span>
            </span>
          </h1>

          <p className="anim-hero3 mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed hidden md:block">
            Importez, organisez et partagez vos recettes.
          </p>

          {/* CTA */}
          <div className="anim-hero4 mt-10 flex flex-col items-center gap-3">
            {/* Desktop CTA */}
            <div className="hidden md:block">
              {isLoggingIn ? (
                <p className="text-sm text-muted-foreground">Connexion en cours...</p>
              ) : (
                <button
                  type="button"
                  onClick={() => startGoogleLogin()}
                  className="cta-btn inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-white font-body font-semibold text-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
            {/* Mobile CTA */}
            <div className="md:hidden">
              {isLoggingIn ? (
                <p className="text-sm text-muted-foreground">Connexion en cours...</p>
              ) : (
                <button
                  type="button"
                  onClick={() => startGoogleLogin()}
                  className="inline-flex items-center justify-center gap-2 w-[280px] py-3.5 rounded-full bg-primary text-white font-body font-semibold text-base active:scale-[0.98] transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                  </svg>
                  Se connecter
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="py-6 px-5 text-center">
        <p className="text-xs text-muted-foreground/40 font-body">
          Fait avec amour pour les gourmands
        </p>
      </footer>
    </div>
  );
}
