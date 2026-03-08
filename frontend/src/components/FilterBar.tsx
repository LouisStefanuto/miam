import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpDown, Leaf, Check, Zap, UtensilsCrossed, Sun, Gauge } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const isMobile = useIsMobile();
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  const toggleFilter = (key: keyof Filters) => {
    set(key, filters[key] === 'on' ? 'off' : 'on');
  };

  return (
    <div>
      <div className="flex gap-1 md:gap-2 lg:flex-wrap items-center">
        <FilterSelect placeholder="Type" value={filters.type} defaultValue="tous" options={types} onValueChange={(v) => set('type', v)} icon={<UtensilsCrossed size={13} />} />
        <FilterSelect placeholder="Saison" value={filters.season} defaultValue="toutes" options={seasons} onValueChange={(v) => set('season', v)} icon={<Sun size={13} />} />
        <FilterSelect placeholder="Difficulté" value={filters.difficulty} defaultValue="toutes" options={difficulties} onValueChange={(v) => set('difficulty', v)} icon={<Gauge size={13} />} />

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
        <div className="flex-1 lg:flex-none flex justify-end lg:ml-auto">
          <Select value={filters.sort} onValueChange={(v) => set('sort', v)}>
            <SelectTrigger className="w-auto lg:min-w-[140px] h-8 md:h-9 px-2 md:px-3 text-xs font-body bg-secondary border-0 gap-1.5 focus:ring-0 focus:ring-offset-0">
              <ArrowUpDown size={13} className="text-muted-foreground" />
              {!isMobile && <SelectValue />}
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs font-body">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
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
  const isMobile = useIsMobile();
  const chip = (
    <button
      onClick={(e) => { onClick(); e.currentTarget.blur(); }}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`flex items-center gap-1.5 h-8 md:h-9 px-2.5 md:px-3 rounded-md border text-xs font-body font-medium md:transition-colors outline-none ${
        active ? activeClass : 'bg-card border-input text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:bg-secondary'
      }`}
    >
      <span className="md:hidden lg:inline">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  if (!tooltip || isMobile) return chip;

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
  icon,
}: {
  placeholder: string;
  value: string;
  defaultValue: string;
  options: string[];
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  const isActive = value !== defaultValue;
  const isMobile = useIsMobile();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-auto lg:min-w-[120px] h-8 md:h-9 px-2 md:px-3 text-xs font-body capitalize bg-card focus:ring-0 focus:ring-offset-0">
        {icon && <span className="text-muted-foreground shrink-0 md:hidden lg:inline">{icon}</span>}
        {!isMobile && (
          <SelectValue placeholder={placeholder}>
            {isActive ? options.find((o) => o === value) : placeholder}
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="capitalize text-xs font-body">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
