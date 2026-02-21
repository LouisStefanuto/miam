import { useState, KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function SearchBar({ tags, onTagsChange }: SearchBarProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full max-w-xl space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher un ingrédient, un tag… puis Entrée"
          className="pl-10 pr-4 h-11 bg-card border-border font-body text-sm rounded-lg"
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-body text-xs gap-1 pl-2.5 pr-1.5 py-1 capitalize">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors ml-0.5">
                <X size={12} />
              </button>
            </Badge>
          ))}
          <button onClick={() => onTagsChange([])} className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors px-1">
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
}
