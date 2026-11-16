import { lazy, Suspense, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PixelSprite from '@/components/PixelSprite';
import PageHeader from '@/components/PageHeader';
import { useOverlayClose } from '@/components/CatalogLayout';
import { ADD_RECIPE_MODES } from '@/lib/add-recipe-modes';
import type { AddFlowState } from '@/components/AddFlowLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShakeEscalation } from '@/hooks/use-shake-escalation';

const BeaverCatchGame = lazy(() => import('@/components/BeaverCatchGame'));

/**
 * The tile whose carrot hides the beaver game on phones: held down, the carrot wiggles harder and harder
 * until the game opens after 5 s. A tap still opens the JSON import.
 */
const GAME_TILE = '/import/json';

const AddRecipePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { requestClose } = useOverlayClose();
  const [showGame, setShowGame] = useState(false);

  const openMode = useCallback(
    (to: string) => navigate(to, { state: { fromAddMenu: true } satisfies AddFlowState }),
    [navigate],
  );
  const { ref: carrotRef, handlers: gameTileHandlers } = useShakeEscalation<HTMLSpanElement>(
    () => openMode(GAME_TILE),
    () => setShowGame(true),
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Nouvelle recette" onBack={() => requestClose('/')} backLabel="Retour au catalogue" />
      <main className="max-w-lg mx-auto px-4 py-8 pb-24">
        <p className="font-body text-muted-foreground mb-6 text-sm">Choisissez comment l'ajouter.</p>

        <div className="grid grid-cols-2 gap-3">
          {ADD_RECIPE_MODES.map((mode) => {
            const hidesGame = isMobile && mode.to === GAME_TILE;
            return (
              <button
                key={mode.label}
                disabled={mode.comingSoon}
                {...(hidesGame ? gameTileHandlers : { onClick: () => openMode(mode.to) })}
                // A long press must not select the text or open the system menu.
                style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: hidesGame ? 'none' : undefined }}
                className={`relative min-h-[184px] p-4 rounded-3xl flex flex-col justify-between text-left transition-transform duration-200 enabled:active:scale-[0.97] md:enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed ${hidesGame ? 'select-none' : ''} ${mode.tile}`}
              >
                <span className={`w-12 h-12 rounded-full grid place-items-center ${mode.chip}`}>
                  <mode.icon size={22} />
                </span>
                <span ref={hidesGame ? carrotRef : undefined} className="absolute top-3 right-3">
                  <PixelSprite
                    sprite={mode.sprite}
                    scale={mode.spriteScale}
                    className={`block ${mode.comingSoon ? 'opacity-60' : ''}`}
                  />
                </span>

                <span className="block min-w-0">
                  <span className="block font-body text-[17px] font-bold leading-tight">
                    {mode.label}
                    {mode.comingSoon && (
                      <span className="ml-2 align-middle text-[11px] font-semibold bg-secondary text-muted-foreground rounded-full px-2 py-0.5">
                        Bientôt
                      </span>
                    )}
                  </span>
                  <span className={`block mt-1 font-body text-[13px] ${mode.sub}`}>{mode.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Portalled to the body because this page sits in the catalog overlay, whose transform would trap a fixed element */}
      {showGame &&
        createPortal(
          <Suspense>
            <BeaverCatchGame onClose={() => setShowGame(false)} />
          </Suspense>,
          document.body,
        )}
    </div>
  );
};

export default AddRecipePage;
