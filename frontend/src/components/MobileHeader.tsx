import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import MobileSearchField from '@/components/MobileSearchField';
import UserAvatar from '@/components/UserAvatar';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useShakeEscalation } from '@/hooks/use-shake-escalation';

interface MobileHeaderProps {
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onFiltersTap: () => void;
  /** The search view is open: the avatar becomes a back arrow and the search icon becomes the search bar. */
  searchOpen: boolean;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  /** Clears the search text, tags and filters. */
  onReset: () => void;
  hasActiveFilters?: boolean;
  /** Opens the add recipe page. */
  onAddTap: () => void;
  /** Opens the account settings. */
  onAvatarTap: () => void;
  onAvatarLongPress?: () => void;
}

export default function MobileHeader({
  searchTags, onSearchTagsChange,
  searchQuery, onSearchQueryChange,
  onFiltersTap,
  searchOpen, onSearchOpen, onSearchClose, onReset, hasActiveFilters,
  onAddTap, onAvatarTap, onAvatarLongPress,
}: MobileHeaderProps) {
  const { headerOffset } = useScrollDirection();
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref: avatarRef, handlers: avatarHandlers } = useShakeEscalation<HTMLButtonElement>(
    onAvatarTap,
    () => onAvatarLongPress?.(),
  );

  // Render the bar first, then focus it within the tap: iOS only opens the
  // keyboard for a focus made during the user gesture.
  const openSearchAndFocus = () => {
    flushSync(onSearchOpen);
    inputRef.current?.focus();
  };

  const iconButtonClass =
    'w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-foreground active:bg-secondary/80';

  return (
    <header
      className="sticky top-0 z-20 flex items-start gap-3 px-3 py-2 min-h-14 bg-background border-b border-border md:hidden will-change-transform"
      style={{ transform: `translateY(${headerOffset}px)` }}
    >
      {!searchOpen ? (
        <>
          <button
            ref={avatarRef}
            type="button"
            className="shrink-0 mt-1 rounded-full select-none"
            style={{ WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent' }}
            aria-label="Mon compte"
            {...avatarHandlers}
          >
            <UserAvatar className="h-8 w-8 rounded-full text-sm pointer-events-none" />
          </button>
          {/* Same height as the search bar, so opening it does not shift the page */}
          <div className="ml-auto h-[42px] flex items-center gap-1">
            <button
              type="button"
              onClick={onAddTap}
              className={iconButtonClass}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Ajouter une recette"
            >
              <Plus size={22} />
            </button>
            <button
              type="button"
              onClick={openSearchAndFocus}
              className={iconButtonClass}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Rechercher"
            >
              <Search size={22} />
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              inputRef.current?.blur();
              onSearchClose();
            }}
            className="w-8 h-8 shrink-0 mt-1 flex items-center justify-center rounded-full text-foreground active:bg-secondary/80 motion-safe:animate-back-arrow-in"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label="Fermer la recherche"
          >
            <ArrowLeft size={22} />
          </button>

          <MobileSearchField
            inputRef={inputRef}
            tags={searchTags}
            onTagsChange={onSearchTagsChange}
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onFocus={onSearchOpen}
            canReset={!!hasActiveFilters}
            onReset={onReset}
            onFiltersTap={onFiltersTap}
            animateButtons
            className="origin-right motion-safe:animate-scale-in"
          />
        </>
      )}
    </header>
  );
}
