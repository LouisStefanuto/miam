import { Search, ShoppingCart, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppearanceSheet from '@/components/AppearanceSheet';
import CartSheet from '@/components/CartSheet';
import UserMenu from '@/components/UserMenu';
import { useCart } from '@/contexts/CartContext';

interface MobileHeaderProps {
  onSearchToggle: () => void;
  searchOpen: boolean;
}

export default function MobileHeader({ onSearchToggle, searchOpen }: MobileHeaderProps) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-background border-b border-border md:hidden">
      <h1 className="font-display text-xl font-bold text-foreground">Miam</h1>

      <div className="flex items-center gap-1.5">
        <UserMenu />

        <AppearanceSheet
          trigger={
            <Button variant="ghost" size="icon" className="shrink-0">
              <Palette size={18} />
              <span className="sr-only">Apparence</span>
            </Button>
          }
        />

        <Button
          variant={searchOpen ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onSearchToggle}
          className="shrink-0"
        >
          <Search size={18} />
          <span className="sr-only">Rechercher</span>
        </Button>

        <CartSheet
          trigger={
            <Button variant="ghost" size="icon" className="shrink-0 relative">
              <ShoppingCart size={18} />
              <span className="sr-only">Panier</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Button>
          }
        />
      </div>
    </header>
  );
}
