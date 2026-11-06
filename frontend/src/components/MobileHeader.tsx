import { KeyboardEvent, useRef, useState } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useShakeEscalation } from '@/hooks/use-shake-escalation';

interface MobileHeaderProps {
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onFiltersTap: () => void;
  /** The search view is open: the logo becomes a back arrow that closes it. */
  searchOpen: boolean;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  /** Clears the search text, tags and filters. */
  onReset: () => void;
  hasActiveFilters?: boolean;
  onLogoTap?: () => void;
  onLogoLongPress?: () => void;
}

export default function MobileHeader({
  searchTags, onSearchTagsChange,
  searchQuery, onSearchQueryChange,
  onFiltersTap,
  searchOpen, onSearchOpen, onSearchClose, onReset, hasActiveFilters,
  onLogoTap, onLogoLongPress,
}: MobileHeaderProps) {
  const { headerOffset } = useScrollDirection();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { ref: logoRef, handlers: logoHandlers } = useShakeEscalation(
    () => onLogoTap?.(),
    () => onLogoLongPress?.(),
  );

  const isEmpty = !searchQuery && searchTags.length === 0;

  const addTag = () => {
    const tag = searchQuery.trim().toLowerCase();
    if (tag && !searchTags.includes(tag)) {
      onSearchTagsChange([...searchTags, tag]);
    }
    onSearchQueryChange('');
    setSelectedTag(null);
  };

  const removeTag = (tag: string) => {
    onSearchTagsChange(searchTags.filter((t) => t !== tag));
    setSelectedTag(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !searchQuery && searchTags.length > 0) {
      removeTag(selectedTag ?? searchTags[searchTags.length - 1]);
    }
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-start gap-3 px-3 py-2 min-h-14 bg-background border-b border-border md:hidden will-change-transform"
      style={{ transform: `translateY(${headerOffset}px)` }}
    >
      {searchOpen ? (
        <button
          type="button"
          onClick={() => {
            inputRef.current?.blur();
            setSelectedTag(null);
            onSearchClose();
          }}
          className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center rounded-full text-foreground active:bg-secondary/80 motion-safe:animate-search-arrow-in"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Fermer la recherche"
        >
          <ArrowLeft size={22} />
        </button>
      ) : (
        <img
          ref={logoRef}
          src="/icon.png"
          alt="Miam"
          className="w-8 h-8 shrink-0 mt-1 select-none"
          style={{ WebkitTouchCallout: 'none' }}
          draggable={false}
          {...logoHandlers}
        />
      )}

      <div
        onClick={() => {
          setSelectedTag(null);
          inputRef.current?.focus();
        }}
        className={`relative flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 border rounded-lg cursor-text transition-colors duration-300 ${
          searchOpen ? 'border-primary/50' : 'border-border'
        }`}
      >
        {/* Reset and filter buttons pinned top-right, only in the search view */}
        {searchOpen && (
          <div
            className={`absolute right-1 flex items-center ${
              searchTags.length > 0 ? 'top-1' : 'top-1/2 -translate-y-1/2'
            }`}
          >
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTag(null);
                  onReset();
                  inputRef.current?.focus();
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Effacer la recherche"
              >
                <X size={18} className="text-muted-foreground motion-safe:animate-scale-in" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onFiltersTap(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Filtres"
            >
              {/* The icon animates, not the button: the wrapper's transform centers it. */}
              <SlidersHorizontal size={16} className="text-muted-foreground motion-safe:animate-scale-in" />
            </button>
          </div>
        )}

        {/* Tags + input flow inline; wrap only when no room. Right padding leaves space for the buttons. */}
        <div
          className={`flex flex-wrap items-center gap-1.5 min-h-7 ${
            searchOpen ? (hasActiveFilters ? 'pr-14' : 'pr-8') : ''
          }`}
        >
          {isEmpty && <Search className="text-muted-foreground shrink-0" size={18} />}

          {searchTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTag(isSelected ? null : tag);
                  inputRef.current?.focus();
                }}
                className={`shrink-0 inline-flex items-center max-w-full px-2.5 py-0.5 rounded-full text-xs font-body font-medium capitalize transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/40'
                    : 'bg-primary/15 text-primary'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="truncate">{tag}</span>
              </button>
            );
          })}

          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onSearchOpen}
            placeholder={isEmpty ? (searchOpen ? 'Rechercher un ingrédient, un tag…' : 'Rechercher') : ''}
            className="flex-1 min-w-[80px] h-7 bg-transparent font-body text-base outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </header>
  );
}
