import { Search, X, SlidersHorizontal } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface MobileHeaderProps {
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  onSearchTap: () => void;
  hasActiveFilters?: boolean;
}

export default function MobileHeader({ searchTags, onSearchTagsChange, onSearchTap, hasActiveFilters }: MobileHeaderProps) {
  const { headerOffset } = useScrollDirection();

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-3 h-14 bg-background border-b border-border md:hidden will-change-transform"
      style={{ transform: `translateY(${headerOffset}px)` }}
    >
      <img src="/icon.png" alt="Miam" className="w-8 h-8 shrink-0" />

      <div
        className="flex-1 flex items-center gap-1.5 flex-wrap min-h-9 px-2.5 bg-secondary/60 border border-border rounded-lg active:bg-secondary/80 transition-colors"
        onClick={onSearchTap}
      >
        <Search className="text-muted-foreground shrink-0" size={16} />
        {searchTags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs font-body font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSearchTagsChange(searchTags.filter((t) => t !== tag));
              }}
              className="hover:text-primary/70"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {searchTags.length === 0 && (
          <span className="flex-1 text-sm font-body text-muted-foreground">Rechercher…</span>
        )}
        {hasActiveFilters && (
          <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <SlidersHorizontal size={11} className="text-primary-foreground" />
          </span>
        )}
      </div>

      <UserMenu />
    </header>
  );
}
