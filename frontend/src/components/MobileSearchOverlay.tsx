import { KeyboardEvent, useRef, useEffect, useState } from 'react';
import { ArrowLeft, Search, X, Check, Leaf, Zap, ArrowUpDown, UtensilsCrossed, Sun, Gauge, RotateCcw } from 'lucide-react';
import { Filters, defaultFilters } from '@/components/FilterBar';

interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchTags: string[];
  onSearchTagsChange: (tags: string[]) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  topTags: string[];
  resultCount: number;
}

const types = [
  { value: 'tous', label: 'Tous' },
  { value: 'apéro', label: 'Apéro' },
  { value: 'entrée', label: 'Entrée' },
  { value: 'plat', label: 'Plat' },
  { value: 'pâtes', label: 'Pâtes' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'boisson', label: 'Boisson' },
];

const seasons = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'printemps', label: 'Printemps' },
  { value: 'été', label: 'Été' },
  { value: 'automne', label: 'Automne' },
  { value: 'hiver', label: 'Hiver' },
];

const difficulties = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'facile', label: 'Facile' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'difficile', label: 'Difficile' },
];

const sorts = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'rating', label: 'Mieux noté' },
  { value: 'alpha', label: 'A → Z' },
  { value: 'time', label: 'Plus rapide' },
];

export default function MobileSearchOverlay({
  open,
  onClose,
  searchQuery,
  onSearchQueryChange,
  searchTags,
  onSearchTagsChange,
  filters,
  onFiltersChange,
  topTags,
  resultCount,
}: MobileSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      // Mount then animate in on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && visible) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, visible]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

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

  const handleTagClick = (tag: string) => {
    if (searchTags.includes(tag)) {
      onSearchTagsChange(searchTags.filter((t) => t !== tag));
    } else {
      onSearchTagsChange([...searchTags, tag]);
    }
  };

  const set = (key: keyof Filters, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  const toggle = (key: keyof Filters) =>
    set(key, filters[key] === 'on' ? 'off' : 'on');

  const hasActiveFilters =
    searchTags.length > 0 ||
    filters.type !== defaultFilters.type ||
    filters.season !== defaultFilters.season ||
    filters.difficulty !== defaultFilters.difficulty ||
    filters.tested !== defaultFilters.tested ||
    filters.vegetarian !== defaultFilters.vegetarian ||
    filters.rapido !== defaultFilters.rapido;

  const resetAll = () => {
    onSearchQueryChange('');
    onSearchTagsChange([]);
    onFiltersChange({ ...defaultFilters, sort: filters.sort });
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-background flex flex-col md:hidden transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Search header */}
      <div className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border">
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full active:bg-secondary/80 text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 flex items-center gap-2 flex-wrap min-h-12 px-3 bg-secondary/50 rounded-xl">

          <Search className="text-muted-foreground shrink-0" size={18} />
          {searchTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-sm font-body font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary capitalize"
            >
              {tag}
              <button
                onClick={() => onSearchTagsChange(searchTags.filter((t) => t !== tag))}
                className="active:text-primary/60"
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchTags.length === 0 ? 'Rechercher un ingrédient, un tag…' : ''}
            className="flex-1 min-w-[80px] h-10 bg-transparent font-body text-base outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Scrollable filter content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pt-5 pb-6 space-y-6">

          {/* Quick tags — outline ghost pills */}
          {topTags.length > 0 && (
            <Section title="Tags populaires">
              <div className="flex flex-wrap gap-2">
                {topTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`text-[13px] px-3.5 py-2 rounded-full border font-body font-medium capitalize transition-all duration-150 active:scale-95 ${
                      searchTags.includes(tag)
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-transparent border-border text-muted-foreground active:border-foreground/30 active:text-foreground'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Type — two-row segmented */}
          <Section title="Type" icon={<UtensilsCrossed size={14} />}>
            <TwoRowSegmented
              options={types}
              value={filters.type}
              onChange={(v) => set('type', v)}
            />
          </Section>

          {/* Season — segmented control */}
          <Section title="Saison" icon={<Sun size={14} />}>
            <SegmentedControl
              options={seasons}
              value={filters.season}
              onChange={(v) => set('season', v)}
            />
          </Section>

          {/* Difficulty — segmented control */}
          <Section title="Difficulté" icon={<Gauge size={14} />}>
            <SegmentedControl
              options={difficulties}
              value={filters.difficulty}
              onChange={(v) => set('difficulty', v)}
            />
          </Section>

          {/* Toggle filters — cards */}
          <Section title="Préférences">
            <div className="grid grid-cols-3 gap-2.5">
              <ToggleCard
                active={filters.tested === 'on'}
                onClick={() => toggle('tested')}
                icon={<Check size={18} />}
                label="Testé"
                activeColor="bg-primary/12 border-primary/35 text-primary"
              />
              <ToggleCard
                active={filters.vegetarian === 'on'}
                onClick={() => toggle('vegetarian')}
                icon={<Leaf size={18} />}
                label="Végé"
                activeColor="bg-success/12 border-success/35 text-success"
              />
              <ToggleCard
                active={filters.rapido === 'on'}
                onClick={() => toggle('rapido')}
                icon={<Zap size={18} />}
                label="Rapido"
                subtitle="≤ 20 min"
                activeColor="bg-primary/12 border-primary/35 text-primary"
              />
            </div>
          </Section>

          {/* Sort — text row with underline */}
          <Section title="Trier par" icon={<ArrowUpDown size={14} />}>
            <SortRow
              options={sorts}
              value={filters.sort}
              onChange={(v) => set('sort', v)}
            />
          </Section>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 bg-background">
        <button
          onClick={resetAll}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-border text-muted-foreground active:bg-secondary"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="flex-1 gradient-warm text-primary-foreground font-body font-semibold py-3 rounded-xl text-[15px] active:opacity-90 transition-opacity"
        >
          Voir {resultCount} recette{resultCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

/* ── Subcomponents ── */

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

function TwoRowSegmented({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const mid = Math.ceil(options.length / 2);
  const row1 = options.slice(0, mid);
  const row2 = options.slice(mid);

  const Row = ({ items }: { items: typeof options }) => (
    <div className="flex gap-1">
      {items.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`flex-1 text-[13px] py-2 rounded-lg font-body font-medium transition-all duration-150 ${
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground active:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-secondary/70 rounded-xl p-1 space-y-1">
      <Row items={row1} />
      <Row items={row2} />
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-secondary/70 rounded-xl p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`flex-1 text-[13px] py-2 rounded-lg font-body font-medium transition-all duration-150 ${
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground active:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SortRow({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-4">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`text-sm font-body pb-1 transition-all duration-150 ${
              active
                ? 'text-foreground font-semibold border-b-2 border-primary'
                : 'text-muted-foreground active:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleCard({ active, onClick, icon, label, subtitle, activeColor }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`flex flex-col items-center justify-center gap-1 py-3.5 rounded-xl border transition-all duration-150 active:scale-95 ${
        active
          ? activeColor
          : 'bg-card border-border text-muted-foreground active:bg-secondary'
      }`}
    >
      {icon}
      <span className="text-xs font-body font-semibold">{label}</span>
      {subtitle && <span className="text-[10px] font-body opacity-60 -mt-0.5">{subtitle}</span>}
    </button>
  );
}
