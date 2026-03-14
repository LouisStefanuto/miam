import { useMemo, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PenLine, Camera, Instagram, Download, FileJson, X, ArrowUpDown, Check } from 'lucide-react';
import { useShake } from '@/hooks/use-shake';

const BeaverCatchGame = lazy(() => import('@/components/BeaverCatchGame'));
import CartSheet from '@/components/CartSheet';
import UserMenu from '@/components/UserMenu';
import MobileHeader from '@/components/MobileHeader';
import MobileSearchOverlay from '@/components/MobileSearchOverlay';
import { useRecipes } from '@/hooks/use-recipes';
import { useCatalogFilters } from '@/contexts/CatalogFilterContext';
import HeroSection from '@/components/HeroSection';
import SearchBar from '@/components/SearchBar';
import FilterBar, { defaultFilters } from '@/components/FilterBar';
import RecipeCard from '@/components/RecipeCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const RECIPES_PER_PAGE = 20;

const sortOptions = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'rating', label: 'Mieux noté' },
  { value: 'alpha', label: 'A → Z' },
  { value: 'time', label: 'Plus rapide' },
];

const sortLabels: Record<string, string> = Object.fromEntries(
  sortOptions.map((o) => [o.value, o.label])
);

const CatalogPage = () => {
  const navigate = useNavigate();
  const { data: recipes = [], isLoading } = useRecipes();
  const { searchQuery, setSearchQuery, searchTags, setSearchTags, filters, setFilters, currentPage, setCurrentPage } = useCatalogFilters();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [inlineSearch, setInlineSearch] = useState(false);
  const [showBeaverGame, setShowBeaverGame] = useState(false);
  const openBeaverGame = useCallback(() => setShowBeaverGame(true), []);
  useShake(openBeaverGame);

  // Dev shortcut: Shift+B to test the easter egg on desktop
  useEffect(() => {
    if (import.meta.env.PROD) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'B' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setShowBeaverGame(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const filtered = useMemo(() => {
    let result = recipes.filter((r) => {
      const liveQuery = searchQuery.trim().toLowerCase();
      const allTerms = [...searchTags, ...(liveQuery ? [liveQuery] : [])];
      const matchSearch =
        allTerms.length === 0 ||
        allTerms.every((q) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );

      const matchType = filters.type === 'tous' || r.type === filters.type;
      const matchSeason = filters.season === 'toutes' || r.season === filters.season;
      const matchDifficulty = filters.difficulty === 'toutes' || r.difficulty === filters.difficulty;
      const matchTested = filters.tested === 'off' || r.tested;
      const matchVegetarian = filters.vegetarian === 'off' || r.diets.includes('végétarien');
      const matchRapido = filters.rapido === 'off' || (r.prepTime + r.cookTime) <= 20;

      return matchSearch && matchType && matchSeason && matchDifficulty && matchTested && matchVegetarian && matchRapido;
    });

    switch (filters.sort) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'alpha':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'time':
        result.sort((a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime));
        break;
      case 'recent':
      default:
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return result;
  }, [recipes, searchQuery, searchTags, filters]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of recipes) {
      for (const t of r.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [recipes]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchTags.length > 0 ||
    filters.type !== defaultFilters.type ||
    filters.season !== defaultFilters.season ||
    filters.difficulty !== defaultFilters.difficulty ||
    filters.tested !== defaultFilters.tested ||
    filters.vegetarian !== defaultFilters.vegetarian ||
    filters.rapido !== defaultFilters.rapido;

  const resetAll = () => {
    setSearchQuery('');
    setSearchTags([]);
    setFilters({ ...defaultFilters, sort: filters.sort });
  };

  const handleTagClick = (tag: string) => {
    if (searchTags.includes(tag)) {
      setSearchTags(searchTags.filter((t) => t !== tag));
    } else {
      setSearchTags([...searchTags, tag]);
    }
  };

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchTags, filters, setCurrentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / RECIPES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecipes = filtered.slice(
    (safePage - 1) * RECIPES_PER_PAGE,
    safePage * RECIPES_PER_PAGE,
  );

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <MobileHeader
        searchTags={searchTags}
        onSearchTagsChange={setSearchTags}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onFiltersTap={() => setShowMobileSearch(true)}
        hasActiveFilters={hasActiveFilters}
        inlineSearch={inlineSearch}
        onInlineSearchChange={setInlineSearch}
      />

      {/* Mobile search overlay */}
      <MobileSearchOverlay
        open={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchTags={searchTags}
        onSearchTagsChange={setSearchTags}
        filters={filters}
        onFiltersChange={setFilters}
        topTags={topTags}
        resultCount={filtered.length}
      />

      {/* Desktop hero + action buttons (hidden on mobile) */}
      <div className="relative hidden md:block">
        <HeroSection />
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <UserMenu />
          <Button onClick={() => navigate('/export')} variant="outline" className="font-body font-semibold gap-2 shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <Download size={18} />
            Exporter
          </Button>
          <CartSheet hotkey="p" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-8 pb-20 md:pb-8 space-y-3 md:space-y-6">

        <div className="space-y-2">
          {/* Search + Add button on same line */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Desktop only — mobile search is in the header */}
            <div className="hidden md:contents">
              <SearchBar tags={searchTags} onTagsChange={setSearchTags} query={searchQuery} onQueryChange={setSearchQuery} />
            </div>
            {hasActiveFilters && (
              <button onClick={resetAll} className="hidden md:flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-body font-medium transition-colors shrink-0 h-11">
                <X size={14} />
                Réinitialiser
              </button>
            )}
            {/* Desktop add recipe dropdown (hidden on mobile, FAB replaces it) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gradient-warm text-primary-foreground font-body font-semibold gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 shrink-0 ml-auto hidden md:inline-flex">
                  <Plus size={18} />
                  Ajouter une recette
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-body">
                <DropdownMenuItem onClick={() => navigate('/recipes/new')} className="gap-2 cursor-pointer">
                  <PenLine size={16} />
                  Créer manuellement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/import/ocr')} className="gap-2 cursor-pointer">
                  <Camera size={16} />
                  Importer depuis des photos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/import/json')} className="gap-2 cursor-pointer">
                  <FileJson size={16} />
                  Importer depuis un JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/import/instagram')} className="gap-2 cursor-pointer">
                  <Instagram size={16} />
                  Importer depuis Instagram
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick tag filters (desktop only) */}
          {topTags.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-1.5">
              {topTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-body capitalize transition-colors ${
                    searchTags.includes(tag)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-secondary border-transparent text-secondary-foreground hover:bg-primary/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="hidden md:block">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Results count + sort + reset */}
        <div className="flex items-center justify-between md:justify-start gap-2">
          <p className="text-sm text-muted-foreground font-body">
            {filtered.length} recette{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowUpDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, sort: opt.value })}
                    className="flex items-center gap-3 text-xs font-body"
                  >
                    <Check size={14} className={filters.sort === opt.value ? 'text-foreground' : 'opacity-0'} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {hasActiveFilters && (
              <button onClick={resetAll} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-body font-medium transition-colors shrink-0">
                <X size={14} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">Chargement des recettes…</p>
          </div>
        ) : paginatedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => navigate(`/recipes/${recipe.id}`)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-muted-foreground mb-2">Aucune recette trouvée</p>
            <p className="font-body text-muted-foreground">Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="pt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                  className={safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {getPageNumbers().map((page, idx) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === safePage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                  className={safePage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>

      {showBeaverGame && (
        <Suspense>
          <BeaverCatchGame onClose={() => setShowBeaverGame(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default CatalogPage;
