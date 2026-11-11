import { useState, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Share2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { PendingSharesBadge } from '@/components/PendingSharesSheet';
import UserAvatar from '@/components/UserAvatar';

export default function MobileBottomBar() {
  const { hidden } = useScrollDirection();
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { user } = useAuth();
  const [tappedTab, setTappedTab] = useState<string | null>(null);

  const handleTap = useCallback((tab: string, path: string) => {
    setTappedTab(tab);
    navigate(path);
    setTimeout(() => setTappedTab(null), 400);
  }, [navigate]);

  if (!user) return null;

  const isRecipes = location.pathname === '/';
  const isCart = location.pathname === '/cart';
  const isShares = location.pathname === '/shares' || location.pathname.startsWith('/shares/');
  const isAccount = location.pathname === '/settings' || location.pathname.startsWith('/settings/');

  return (
    <>
      <style>{`
        @keyframes pill-flash {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1); }
        }
        .tap-pill::after {
          content: '';
          position: absolute;
          inset: 6px 8px;
          border-radius: 12px;
          background: hsl(var(--primary) / 0.15);
          opacity: 0;
          pointer-events: none;
        }
        .tap-pill-active::after {
          animation: pill-flash 400ms ease-out forwards;
        }
      `}</style>
      <nav className={`fixed bottom-0 inset-x-0 z-30 md:hidden bg-background border-t border-border transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
          <Tab
            label="Recettes"
            active={isRecipes}
            tapped={tappedTab === 'recipes'}
            onClick={() => {
              if (isRecipes) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                handleTap('recipes', '/');
              }
            }}
          >
            <BookOpen size={24} strokeWidth={isRecipes ? 2.5 : 2} />
          </Tab>

          <Tab label="Panier" active={isCart} tapped={tappedTab === 'cart'} onClick={() => handleTap('cart', '/cart')}>
            <ShoppingCart size={24} strokeWidth={isCart ? 2.5 : 2} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Tab>

          <Tab label="Partages" active={isShares} tapped={tappedTab === 'shares'} onClick={() => handleTap('shares', '/shares')}>
            <Share2 size={24} strokeWidth={isShares ? 2.5 : 2} />
            <PendingSharesBadge />
          </Tab>

          <Tab label="Compte" active={isAccount} tapped={tappedTab === 'account'} onClick={() => handleTap('account', '/settings')}>
            {/* Slightly smaller than the icons so its ring doesn't crowd the label. */}
            <UserAvatar
              className={`h-[22px] w-[22px] shrink-0 rounded-full text-[10px] ${
                isAccount ? 'ring-2 ring-primary' : 'ring-1 ring-border'
              }`}
            />
          </Tab>
        </div>
      </nav>
    </>
  );
}

interface TabProps {
  label: string;
  active: boolean;
  tapped: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** A 24px icon over a small bold label, both in the accent color when active. */
function Tab({ label, active, tapped, onClick, children }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`tap-pill ${tapped ? 'tap-pill-active' : ''} relative flex flex-1 h-full flex-col items-center justify-center gap-1 transition-colors ${
        active ? 'text-primary' : 'text-foreground/75'
      }`}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">{children}</span>
      <span className="font-body text-[10px] font-semibold leading-none">{label}</span>
    </button>
  );
}
