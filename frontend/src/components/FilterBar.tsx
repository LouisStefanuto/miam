import { useRef, useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpDown, Leaf, Check, Zap } from 'lucide-react';

export interface Filters {
  type: string;
  season: string;
  difficulty: string;
  sort: string;
  tested: string;
  vegetarian: string;
  rapido: string;
}

export const defaultFilters: Filters = {
  type: 'tous',
  season: 'toutes',
  difficulty: 'toutes',
  sort: 'recent',
  tested: 'off',
  vegetarian: 'off',
  rapido: 'off',
};

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  topTags?: string[];
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
}

const types = ['tous', 'apéro', 'entrée', 'plat', 'pâtes', 'dessert', 'boisson'];
const seasons = ['toutes', 'printemps', 'été', 'automne', 'hiver'];
const difficulties = ['toutes', 'facile', 'moyen', 'difficile'];
const sorts = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'rating', label: 'Mieux noté' },
  { value: 'alpha', label: 'A → Z' },
  { value: 'time', label: 'Plus rapide' },
];

export default function FilterBar({ filters, onChange, topTags = [], selectedTags = [], onTagClick }: FilterBarProps) {
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  const toggleFilter = (key: keyof Filters) => {
    set(key, filters[key] === 'on' ? 'off' : 'on');
  };

  const filtersRef = useRef<HTMLDivElement>(null);
  const [maxTagWidth, setMaxTagWidth] = useState<number>(0);

  const measure = useCallback(() => {
    if (!filtersRef.current) return;
    // Measure the right edge of the last chip (Rapido) to get the left-content width
    const container = filtersRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    // Last child is the ml-auto sort div — we want the one before it
    const lastChip = children[children.length - 2];
    if (lastChip) {
      const containerRect = container.getBoundingClientRect();
      const chipRect = lastChip.getBoundingClientRect();
      setMaxTagWidth(chipRect.right - containerRect.left);
    }
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (filtersRef.current) observer.observe(filtersRef.current);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="space-y-2">
      <div ref={filtersRef} className="flex flex-wrap gap-2 items-center">
        <FilterSelect placeholder="Type" value={filters.type} defaultValue="tous" options={types} onValueChange={(v) => set('type', v)} />
        <FilterSelect placeholder="Saison" value={filters.season} defaultValue="toutes" options={seasons} onValueChange={(v) => set('season', v)} />
        <FilterSelect placeholder="Difficulté" value={filters.difficulty} defaultValue="toutes" options={difficulties} onValueChange={(v) => set('difficulty', v)} />

        {/* Toggle: Testé */}
        <ToggleChip
          active={filters.tested === 'on'}
          onClick={() => toggleFilter('tested')}
          icon={<Check size={13} />}
          label="Testé"
          activeClass="bg-primary/10 border-primary/30 text-primary"
        />

        {/* Toggle: Végétarien */}
        <ToggleChip
          active={filters.vegetarian === 'on'}
          onClick={() => toggleFilter('vegetarian')}
          icon={<Leaf size={13} />}
          label="Végé"
          activeClass="bg-success/15 border-success/40 text-success"
        />

        {/* Toggle: Rapido */}
        <ToggleChip
          active={filters.rapido === 'on'}
          onClick={() => toggleFilter('rapido')}
          icon={<Zap size={13} />}
          label="Rapido"
          activeClass="bg-primary/10 border-primary/30 text-primary"
          tooltip="Préparation + cuisson ≤ 20 min"
        />

        {/* Sort */}
        <div className="ml-auto">
          <Select value={filters.sort} onValueChange={(v) => set('sort', v)}>
            <SelectTrigger className="w-auto min-w-[140px] h-9 text-xs font-body bg-secondary border-0 gap-1.5">
              <ArrowUpDown size={13} className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs font-body">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick tag filters */}
      {topTags.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 overflow-hidden"
          style={maxTagWidth > 0 ? { maxWidth: maxTagWidth, maxHeight: '2rem' } : undefined}
        >
          {topTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border font-body capitalize transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-secondary border-transparent text-secondary-foreground hover:bg-primary/10'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleChip({ active, onClick, icon, label, activeClass, tooltip }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
  tooltip?: string;
}) {
  const chip = (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-body font-medium transition-colors ${
        active ? activeClass : 'bg-card border-input text-muted-foreground hover:bg-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  if (!tooltip) return chip;

  return (
    <TooltipProvider delayDuration={800}>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FilterSelect({
  placeholder,
  value,
  defaultValue,
  options,
  onValueChange,
}: {
  placeholder: string;
  value: string;
  defaultValue: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  const isActive = value !== defaultValue;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`w-auto min-w-[120px] h-9 text-xs font-body capitalize ${isActive ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card'}`}>
        <SelectValue placeholder={placeholder}>
          {isActive ? options.find((o) => o === value) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="capitalize text-xs font-body">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
