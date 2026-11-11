import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { createContext, useCallback, useContext, useEffect, useRef, useState, Suspense } from 'react';
import CatalogPage from '@/pages/CatalogPage';
import { useIsMobile } from '@/hooks/use-mobile';

interface OverlayContextValue {
  requestClose: (to: string) => void;
}

const OverlayContext = createContext<OverlayContextValue>({ requestClose: () => {} });

export function useOverlayClose() {
  return useContext(OverlayContext);
}

export default function CatalogLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [exiting, setExiting] = useState(false);
  const exitTarget = useRef('/');
  const prevPathname = useRef(location.pathname);

  const overlayRef = useRef<HTMLDivElement>(null);

  const hasOverlay = location.pathname !== '/';

  // Animate in only when navigating from catalog root. Computed during render so
  // the first render after navigation uses the correct prev pathname.
  const cameFromCatalog = prevPathname.current === '/' && hasOverlay;
  useEffect(() => {
    const prev = prevPathname.current;
    const path = location.pathname;
    prevPathname.current = path;
    setExiting(false);
    // A subpage opening over its parent (settings -> settings/avatar) or closing back to
    // it leaves the parent where it was; any other page starts at the top.
    const nested = path.startsWith(`${prev}/`) || prev.startsWith(`${path}/`);
    if (overlayRef.current && !nested) {
      overlayRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (hasOverlay) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [hasOverlay]);

  const requestClose = useCallback((to: string) => {
    if (isMobile) {
      exitTarget.current = to;
      setExiting(true);
    } else {
      navigate(to);
    }
  }, [isMobile, navigate]);

  const handleAnimationEnd = useCallback((event: React.AnimationEvent<HTMLDivElement>) => {
    // Animations inside the page (a back arrow spinning in) bubble up here too.
    if (exiting && event.target === event.currentTarget) {
      navigate(exitTarget.current);
    }
  }, [exiting, navigate]);

  return (
    <OverlayContext.Provider value={{ requestClose }}>
      <CatalogPage />
      {(hasOverlay || exiting) && (
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-40 bg-background overflow-y-auto overflow-x-hidden overscroll-none ${
            isMobile
              ? exiting
                ? 'animate-slide-out-to-right'
                : cameFromCatalog
                  ? 'animate-slide-in-from-right'
                  : ''
              : ''
          }`}
          onAnimationEnd={handleAnimationEnd}
        >
          <Suspense>
            <Outlet />
          </Suspense>
        </div>
      )}
    </OverlayContext.Provider>
  );
}
