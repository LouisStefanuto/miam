import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, ShoppingCart } from 'lucide-react';
import CartSheet from '@/components/CartSheet';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileBottomBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { user } = useAuth();

  if (!user) return null;

  const isRecipes = location.pathname === '/';
  const isAdd = location.pathname === '/add' || location.pathname === '/recipes/new' || location.pathname.startsWith('/import');

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-background border-t border-border">
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
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
        >
          <span className={`w-11 h-11 rounded-full flex items-center justify-center gradient-warm text-primary-foreground shadow-md ${
            isAdd ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : ''
          }`}>
            <Plus size={24} strokeWidth={2.5} />
          </span>
        </button>

        {/* Cart */}
        <CartSheet
          trigger={
            <button
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
                'text-muted-foreground'
              }`}
            >
              <span className="relative">
                <ShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-body font-medium">Panier</span>
            </button>
          }
        />
      </div>
    </nav>
  );
}
