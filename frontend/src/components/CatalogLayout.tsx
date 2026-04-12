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

  const hasOverlay = location.pathname !== '/';

  // Determine if we should animate: only when navigating from catalog root
  const cameFromCatalog = useRef(false);
  useEffect(() => {
    cameFromCatalog.current = prevPathname.current === '/';
    prevPathname.current = location.pathname;
    setExiting(false);
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

  const handleAnimationEnd = useCallback(() => {
    if (exiting) {
      navigate(exitTarget.current);
    }
  }, [exiting, navigate]);

  return (
    <OverlayContext.Provider value={{ requestClose }}>
      <CatalogPage />
      {(hasOverlay || exiting) && (
        <div
          className={`fixed inset-0 z-40 bg-background overflow-y-auto overscroll-none ${
            isMobile
              ? exiting
                ? 'animate-slide-out-to-right'
                : cameFromCatalog.current
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
