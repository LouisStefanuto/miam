import { KeyboardEvent, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ tags, onTagsChange, query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const tag = query.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    onQueryChange('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !query && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-xl">
      <div
        className="flex items-center gap-1.5 flex-wrap min-h-11 px-3 bg-card border border-border rounded-lg cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="text-muted-foreground shrink-0" size={18} />
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs font-body font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary capitalize"
          >
            {tag}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTagsChange(tags.filter((t) => t !== tag));
              }}
              className="hover:text-primary/70"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Rechercher un ingrédient, un tag…' : ''}
          className="flex-1 min-w-[120px] h-9 bg-transparent font-body text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
