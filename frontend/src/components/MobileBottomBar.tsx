import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ShoppingCart, UserRound } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

export default function MobileBottomBar() {
  const { hidden } = useScrollDirection();
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { user } = useAuth();

  if (!user) return null;

  const isRecipes = location.pathname === '/';
  const isAdd = location.pathname === '/add' || location.pathname === '/recipes/new' || location.pathname.startsWith('/import');
  const isCart = location.pathname === '/cart';

  return (
    <nav className={`fixed bottom-0 inset-x-0 z-30 md:hidden bg-background border-t border-border transition-transform duration-300 ${hidden ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {/* Recipes */}
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            isRecipes ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <BookOpen size={22} strokeWidth={isRecipes ? 2.5 : 2} />
          <span className="text-[11px] font-body font-medium">Recettes</span>
        </button>

        {/* Add */}
        <button
          onClick={() => navigate('/add')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            isAdd ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Plus size={22} strokeWidth={isAdd ? 2.5 : 2} />
          <span className="text-[11px] font-body font-medium">Ajouter</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => navigate('/cart')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
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

        {/* Account */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <UserRound size={22} strokeWidth={location.pathname === '/settings' ? 2.5 : 2} />
          <span className="text-[11px] font-body font-medium">Compte</span>
        </button>
      </div>
    </nav>
  );
}
