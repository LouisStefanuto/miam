import { createContext, Suspense, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

/** Navigation state for the pages that add a recipe: the new recipe page and the imports. */
export interface AddFlowState {
  /** Opened straight from the catalog, skipping the add menu: back slides out to the catalog. */
  fromCatalog?: boolean;
  /** Opened from the add menu: the page slides in over the menu, and back slides out to it. */
  fromAddMenu?: boolean;
}

/** Closes the page on top of the add menu, set while one is open. */
const AddMenuLayerContext = createContext<(() => void) | null>(null);

/**
 * Goes back to the add menu: over the menu, the page slides out to uncover it, like the settings subpages.
 * Anywhere else, the menu just opens.
 */
export function useBackToAddMenu() {
  const close = useContext(AddMenuLayerContext);
  const navigate = useNavigate();
  return useCallback(() => (close ? close() : navigate('/add')), [close, navigate]);
}

function AddMenuLayer({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [exiting, setExiting] = useState(false);

  const close = useCallback(() => {
    if (isMobile) setExiting(true);
    else navigate('/add');
  }, [isMobile, navigate]);

  const handleAnimationEnd = useCallback(
    (event: React.AnimationEvent<HTMLDivElement>) => {
      if (exiting && event.target === event.currentTarget) navigate('/add');
    },
    [exiting, navigate],
  );

  const slideClass = isMobile ? (exiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right') : '';

  // Portalled to the body because the menu sits in the catalog overlay, whose transform would trap a fixed element.
  return createPortal(
    <AddMenuLayerContext.Provider value={close}>
      <div
        className={`fixed inset-0 z-50 bg-background overflow-y-auto overflow-x-hidden overscroll-none ${slideClass}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* Its own boundary, so the menu underneath stays up while the page loads */}
        <Suspense>{children}</Suspense>
      </div>
    </AddMenuLayerContext.Provider>,
    document.body,
  );
}

/**
 * Parent route of the add menu and the pages it opens. A page opened from the menu slides in on a layer of
 * its own, with the menu kept underneath, so it covers the menu as it comes in and uncovers it on the way back.
 */
export default function AddFlowLayout({ menu }: { menu: ReactNode }) {
  const location = useLocation();
  const fromAddMenu = (location.state as AddFlowState | null)?.fromAddMenu ?? false;

  if (!fromAddMenu) return <Outlet />;
  return (
    <>
      {menu}
      <AddMenuLayer key={location.pathname}>
        <Outlet />
      </AddMenuLayer>
    </>
  );
}
