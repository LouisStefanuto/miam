import { KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ tags, onTagsChange, query, onQueryChange }: SearchBarProps) {
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un ingrédient, un tag…"
          className="pl-10 pr-4 h-11 bg-card border-border font-body text-sm rounded-lg"
        />
      </div>
    </div>
  );
}
