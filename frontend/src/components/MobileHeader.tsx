import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/UserMenu';

interface MobileHeaderProps {
  onSearchToggle: () => void;
  searchOpen: boolean;
}

export default function MobileHeader({ onSearchToggle, searchOpen }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-background border-b border-border md:hidden">
      <h1 className="font-display text-xl font-bold text-foreground">Miam</h1>

      <div className="flex items-center gap-1.5">
        <UserMenu />

        <Button
          variant={searchOpen ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onSearchToggle}
          className="shrink-0"
        >
          <Search size={18} />
          <span className="sr-only">Rechercher</span>
        </Button>
      </div>
    </header>
  );
}
