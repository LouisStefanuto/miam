import { useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EDGE_ZONE = 30; // px from left edge to start swipe
const MIN_DISTANCE = 80; // px minimum swipe distance to trigger
const MAX_Y_DRIFT = 80; // px max vertical drift allowed

export default function SwipeBack({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= EDGE_ZONE) {
      touchRef.current = { startX: touch.clientX, startY: touch.clientY };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchRef.current.startX;
    const dy = Math.abs(touch.clientY - touchRef.current.startY);
    touchRef.current = null;

    // Don't navigate back if already on home
    if (location.pathname === '/' || location.pathname === '/login') return;

    if (dx >= MIN_DISTANCE && dy <= MAX_Y_DRIFT) {
      navigate(-1);
    }
  }, [navigate, location.pathname]);

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
