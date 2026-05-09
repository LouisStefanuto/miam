import { KeyboardEvent, useRef, useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ tags, onTagsChange, query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
    <div className="w-full max-w-xl">
      <div
        className="flex items-center gap-1.5 flex-wrap min-h-11 px-3 bg-card border border-border rounded-lg cursor-text"
        onClick={() => {
          setSelectedTag(null);
          inputRef.current?.focus();
        }}
      >
        <Search className="text-muted-foreground shrink-0" size={18} />
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
              className={`flex items-center text-xs font-body font-medium px-2 py-0.5 rounded-full capitalize transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/40'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              {tag}
            </button>
          );
        })}
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
