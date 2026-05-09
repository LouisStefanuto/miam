import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Share2, Plus, ShoppingCart, UserRound } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { PendingSharesBadge } from '@/components/PendingSharesSheet';

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
  const isAdd = location.pathname === '/add' || location.pathname === '/recipes/new' || location.pathname.startsWith('/import');
  const isCart = location.pathname === '/cart';
  const isShares = location.pathname === '/shares' || location.pathname.startsWith('/shares/');
  const isAccount = location.pathname === '/settings';

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
          {/* Recipes */}
          <button
            onClick={() => {
              if (isRecipes) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                handleTap('recipes', '/');
              }
            }}
            className={`tap-pill ${tappedTab === 'recipes' ? 'tap-pill-active' : ''} relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isRecipes ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BookOpen size={22} strokeWidth={isRecipes ? 2.5 : 2} />
            <span className="text-[11px] font-body font-medium">Recettes</span>
          </button>

          {/* Add */}
          <button
            onClick={() => handleTap('add', '/add')}
            className={`tap-pill ${tappedTab === 'add' ? 'tap-pill-active' : ''} relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isAdd ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Plus size={22} strokeWidth={isAdd ? 2.5 : 2} />
            <span className="text-[11px] font-body font-medium">Ajouter</span>
          </button>

          {/* Cart */}
          <button
            onClick={() => handleTap('cart', '/cart')}
            className={`tap-pill ${tappedTab === 'cart' ? 'tap-pill-active' : ''} relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isCart ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="relative">
              <ShoppingCart size={22} strokeWidth={isCart ? 2.5 : 2} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </span>
            <span className="text-[11px] font-body font-medium">Panier</span>
          </button>

          {/* Shares */}
          <button
            onClick={() => handleTap('shares', '/shares')}
            className={`tap-pill ${tappedTab === 'shares' ? 'tap-pill-active' : ''} relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isShares ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="relative">
              <Share2 size={22} strokeWidth={isShares ? 2.5 : 2} />
              <PendingSharesBadge />
            </span>
            <span className="text-[11px] font-body font-medium">Partages</span>
          </button>

          {/* Account */}
          <button
            onClick={() => handleTap('account', '/settings')}
            className={`tap-pill ${tappedTab === 'account' ? 'tap-pill-active' : ''} relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              isAccount ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <UserRound size={22} strokeWidth={isAccount ? 2.5 : 2} />
            <span className="text-[11px] font-body font-medium">Compte</span>
          </button>
        </div>
      </nav>
    </>
  );
}
