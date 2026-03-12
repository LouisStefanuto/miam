import { KeyboardEvent, useRef } from 'react';
import { Search, X } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

interface MobileHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
}

export default function MobileHeader({ searchQuery, onSearchQueryChange, searchTags, onSearchTagsChange }: MobileHeaderProps) {
  const { headerOffset } = useScrollDirection();
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-3 h-14 bg-background border-b border-border md:hidden will-change-transform"
      style={{ transform: `translateY(${headerOffset}px)` }}
    >
      <img src="/icon.png" alt="Miam" className="w-8 h-8 shrink-0" />

      <div
        className="flex-1 flex items-center gap-1.5 flex-wrap min-h-9 px-2.5 bg-secondary/60 border border-border rounded-lg cursor-text"
        onClick={() => inputRef.current?.focus()}
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
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchTags.length === 0 ? 'Rechercher…' : ''}
          className="flex-1 min-w-[60px] h-8 bg-transparent font-body text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <UserMenu />
    </header>
  );
}
