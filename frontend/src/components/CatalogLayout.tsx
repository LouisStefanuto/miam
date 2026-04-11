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

  const hasOverlay = location.pathname !== '/';

  // Reset exiting flag once navigation has completed
  useEffect(() => {
    setExiting(false);
  }, [location.pathname]);

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
          className={`fixed inset-0 z-40 bg-background overflow-y-auto overscroll-contain ${
            isMobile
              ? exiting
                ? 'animate-slide-out-to-right'
                : 'animate-slide-in-from-right'
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
