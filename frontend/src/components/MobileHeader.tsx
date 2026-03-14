import { KeyboardEvent, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface MobileHeaderProps {
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onFiltersTap: () => void;
  hasActiveFilters?: boolean;
  inlineSearch: boolean;
  onInlineSearchChange: (open: boolean) => void;
}

export default function MobileHeader({
  searchTags, onSearchTagsChange,
  searchQuery, onSearchQueryChange,
  onFiltersTap, hasActiveFilters,
  inlineSearch, onInlineSearchChange,
}: MobileHeaderProps) {
  const { headerOffset } = useScrollDirection();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inlineSearch) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [inlineSearch]);

  const addTag = () => {
    const tag = searchQuery.trim().toLowerCase();
    if (tag && !searchTags.includes(tag)) {
      onSearchTagsChange([...searchTags, tag]);
    }
    onSearchQueryChange('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !searchQuery && searchTags.length > 0) {
      onSearchTagsChange(searchTags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (!searchQuery && searchTags.length === 0) {
      onInlineSearchChange(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-3 h-14 bg-background border-b border-border md:hidden will-change-transform"
      style={{ transform: `translateY(${headerOffset}px)` }}
    >
      <img src="/icon.png" alt="Miam" className="w-8 h-8 shrink-0" />

      <div className="flex-1 flex items-center gap-1.5 flex-wrap min-h-9 px-2.5 bg-secondary/60 border border-border rounded-lg transition-colors">
        {inlineSearch ? (
          <>
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
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder="Rechercher…"
              className="flex-1 min-w-[80px] h-9 bg-transparent font-body text-sm outline-none placeholder:text-muted-foreground"
            />
          </>
        ) : (
          <div
            className="flex-1 flex items-center gap-1.5 flex-wrap active:bg-secondary/80"
            onClick={() => onInlineSearchChange(true)}
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
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onFiltersTap(); }}
          className="ml-auto shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <SlidersHorizontal size={14} className={hasActiveFilters ? 'text-primary' : 'text-muted-foreground'} />
        </button>
      </div>

      <UserMenu />
    </header>
  );
}
