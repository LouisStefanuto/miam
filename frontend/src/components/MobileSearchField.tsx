import { KeyboardEvent, RefObject, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface MobileSearchFieldProps {
  inputRef: RefObject<HTMLInputElement>;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onFocus?: () => void;
  /** Shows the clear button, which calls onReset. */
  canReset: boolean;
  onReset: () => void;
  onFiltersTap: () => void;
  /** Animate the buttons as they appear. Off where the field must not change on mount. */
  animateButtons?: boolean;
  className?: string;
}

/**
 * The mobile search box: tags and text inline, with clear and filter buttons
 * pinned top-right. Shared by the catalog header and the filters screen so the
 * two look the same and the box does not move when switching between them.
 */
export default function MobileSearchField({
  inputRef, tags, onTagsChange, query, onQueryChange, onFocus,
  canReset, onReset, onFiltersTap, animateButtons = false, className = '',
}: MobileSearchFieldProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const isEmpty = !query && tags.length === 0;
  const iconAnimation = animateButtons ? 'motion-safe:animate-scale-in' : '';

  const addTag = () => {
    const tag = query.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    onQueryChange('');
    setSelectedTag(null);
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
    setSelectedTag(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !query && tags.length > 0) {
      removeTag(selectedTag ?? tags[tags.length - 1]);
    }
  };

  return (
    <div
      onClick={() => {
        setSelectedTag(null);
        inputRef.current?.focus();
      }}
      className={`relative flex-1 min-w-0 px-2.5 py-1.5 bg-secondary/60 border border-border rounded-lg cursor-text ${className}`}
    >
      {/* Clear and filter buttons pinned top-right */}
      <div
        className={`absolute right-1 flex items-center ${
          tags.length > 0 ? 'top-1' : 'top-1/2 -translate-y-1/2'
        }`}
      >
        {canReset && (
          <button
            type="button"
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
            <X size={18} className={`text-muted-foreground ${iconAnimation}`} />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFiltersTap(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label="Filtres"
        >
          {/* The icon animates, not the button: the wrapper's transform centers it. */}
          <SlidersHorizontal size={16} className={`text-muted-foreground ${iconAnimation}`} />
        </button>
      </div>

      {/* Tags + input flow inline; wrap only when no room. Right padding leaves space for the buttons. */}
      <div className={`flex flex-wrap items-center gap-1.5 min-h-7 ${canReset ? 'pr-14' : 'pr-8'}`}>
        {isEmpty && <Search className="text-muted-foreground shrink-0" size={18} />}

        {tags.map((tag) => {
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
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={isEmpty ? 'Rechercher' : ''}
          className="flex-1 min-w-[80px] h-7 bg-transparent font-body text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
