import { useMemo, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PenLine, Camera, Instagram, Download, FileDown, FileText, FileJson, X, ArrowUpDown, Check, Share2, Inbox, BookOpen } from 'lucide-react';


const BeaverCatchGame = lazy(() => import('@/components/BeaverCatchGame'));
import CartSheet from '@/components/CartSheet';
import PendingSharesSheet, { PendingSharesBadge, PendingSharesInlineBadge } from '@/components/PendingSharesSheet';
import BatchShareDialog from '@/components/BatchShareDialog';
import UserMenu from '@/components/UserMenu';
import MobileHeader from '@/components/MobileHeader';
import MobileSearchOverlay from '@/components/MobileSearchOverlay';
import { useRecipes } from '@/hooks/use-recipes';
import { useShakeEscalation } from '@/hooks/use-shake-escalation';
import { useCatalogFilters } from '@/contexts/CatalogFilterContext';
import SearchBar from '@/components/SearchBar';
import FilterBar, { defaultFilters } from '@/components/FilterBar';
import RecipeCard from '@/components/RecipeCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PointerTooltip from '@/components/PointerTooltip';
import { Button } from '@/components/ui/button';
import { exportToMarkdown, exportToWord } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
  const [showBeaverGame, setShowBeaverGame] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [showBatchShare, setShowBatchShare] = useState(false);
  const [pendingSharesOpen, setPendingSharesOpen] = useState(false);
  const [exporting, setExporting] = useState<'markdown' | 'word' | null>(null);
  const { toast } = useToast();

  const handleExport = useCallback(async (format: 'markdown' | 'word') => {
    setExporting(format);
    try {
      if (format === 'markdown') await exportToMarkdown();
      else await exportToWord();
      toast({ title: 'Export réussi !', description: `Recettes exportées en ${format === 'markdown' ? 'Markdown' : 'Word'}.` });
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'exporter les recettes.", variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  }, [toast]);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedRecipes(new Set());
  }, []);
  const openBeaverGame = useCallback(() => setShowBeaverGame(true), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  const { ref: desktopLogoRef, handlers: desktopLogoHandlers } = useShakeEscalation<HTMLButtonElement>(
    scrollToTop,
    openBeaverGame,
  );

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
      const matchSeason = filters.season === 'toutes' || r.season === null || r.season === filters.season;
      const matchDifficulty = filters.difficulty === 'toutes' || r.difficulty === filters.difficulty;
      const matchTested = filters.tested === 'off' || r.tested;
      const matchVegetarian = filters.vegetarian === 'off' || r.diets.includes('végétarien');
      const matchRapido = filters.rapido === 'off' || (r.prepTime + r.cookTime) <= 20;
      const matchOwnership = filters.ownership === 'all' || (filters.ownership === 'shared' && r.userRole && r.userRole !== 'owner');

      return matchSearch && matchType && matchSeason && matchDifficulty && matchTested && matchVegetarian && matchRapido && matchOwnership;
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

  const shareableRecipeIds = useMemo(() =>
    filtered.filter(r => !r.userRole || r.userRole === 'owner' || r.userRole === 'editor').map(r => r.id),
    [filtered]
  );

  const selectAll = useCallback(() => {
    setSelectedRecipes(new Set(shareableRecipeIds));
  }, [shareableRecipeIds]);

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
    filters.rapido !== defaultFilters.rapido ||
    filters.ownership !== defaultFilters.ownership;

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

  const displayedRecipes = selectionMode
    ? filtered.filter(r => !r.userRole || r.userRole === 'owner' || r.userRole === 'editor')
    : filtered;
  const totalPages = Math.max(1, Math.ceil(displayedRecipes.length / RECIPES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecipes = displayedRecipes.slice(
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile header */}
      <MobileHeader
        searchTags={searchTags}
        onSearchTagsChange={setSearchTags}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onFiltersTap={() => setShowMobileSearch(true)}
        hasActiveFilters={hasActiveFilters}
        onLogoTap={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onLogoLongPress={openBeaverGame}
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

      {/* Desktop top banner (hidden on mobile) */}
      <header className="hidden md:flex items-center justify-between h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <button
          ref={desktopLogoRef}
          type="button"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          aria-label="Miam — Retour en haut"
          style={{ WebkitTouchCallout: 'none' }}
          draggable={false}
          {...desktopLogoHandlers}
        >
          <img src="/icon.png" alt="" className="w-9 h-9 rounded-lg pointer-events-none" draggable={false} />
          <span className="font-display text-2xl font-bold text-foreground tracking-tight pointer-events-none">
            Miam
          </span>
        </button>
        <div className="flex items-center gap-1.5 [&_button]:bg-transparent [&_button]:border-transparent [&_button]:text-muted-foreground [&_button:hover]:bg-accent [&_button:hover]:text-primary [&_button:active]:text-primary">
          {/* Cart */}
          <PointerTooltip label="Ma liste de courses">
            <div><CartSheet hotkey="p" /></div>
          </PointerTooltip>

          {/* Share dropdown */}
          <PointerTooltip label="Partage de recettes">
            <span className="inline-flex">
              <DropdownMenu open={shareDropdownOpen} onOpenChange={setShareDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative font-body font-semibold shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
                  >
                    <Share2 size={18} />
                    <PendingSharesBadge />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="font-body">
                  <DropdownMenuItem onClick={() => { setSelectionMode(true); setSelectedRecipes(new Set()); }} className="gap-2 cursor-pointer">
                    <Share2 size={16} />
                    Partager des recettes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPendingSharesOpen(true)} className="gap-2 cursor-pointer">
                    <Inbox size={16} />
                    Boîte de réception
                    <PendingSharesInlineBadge />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </PointerTooltip>
          <PendingSharesSheet
            open={pendingSharesOpen}
            onOpenChange={setPendingSharesOpen}
          />

          {/* Export dropdown */}
          <PointerTooltip label="Exporter mes recettes">
            <span className="inline-flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="font-body font-semibold shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3">
                    <Download size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="font-body">
                  <DropdownMenuItem onClick={() => handleExport('word')} disabled={exporting !== null} className="gap-2 cursor-pointer">
                    <FileDown size={16} />
                    Exporter en Word
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('markdown')} disabled={exporting !== null} className="gap-2 cursor-pointer">
                    <FileText size={16} />
                    Exporter en Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </PointerTooltip>

          {/* Account */}
          <PointerTooltip label="Mon compte">
            <UserMenu />
          </PointerTooltip>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-1 md:py-8 pb-20 md:pb-8 space-y-1.5 md:space-y-6 flex-1 flex flex-col">

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

        {/* Results count + reset + sort */}
        <div className="flex items-center justify-between md:justify-start gap-2 py-1 md:py-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-body">
              {filtered.length} recette{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
            </p>
            {hasActiveFilters && (
              <button onClick={resetAll} className="md:hidden flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-body font-medium transition-colors shrink-0">
                <X size={14} />
                Réinitialiser
              </button>
            )}
          </div>
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowUpDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setFilters({ ...filters, sort: opt.value })}
                    className="flex items-center gap-3 text-sm font-body"
                  >
                    <Check size={14} className={filters.sort === opt.value ? 'text-foreground' : 'opacity-0'} />
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Selection mode bar */}
        {selectionMode && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Button variant="outline" size="sm" className="font-body" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button
              size="sm"
              className="font-body"
              disabled={selectedRecipes.size === 0}
              onClick={() => setShowBatchShare(true)}
            >
              <Share2 size={14} className="mr-1" />
              Partager {selectedRecipes.size > 0 ? `${selectedRecipes.size} recette${selectedRecipes.size > 1 ? 's' : ''}` : ''}
            </Button>
            <Button variant="ghost" size="sm" className="font-body ml-auto" onClick={exitSelectionMode}>
              <X size={14} className="mr-1" />
              Annuler
            </Button>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">Chargement des recettes…</p>
          </div>
        ) : paginatedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                selectionMode={selectionMode}
                selected={selectedRecipes.has(recipe.id)}
                onSelect={toggleSelection}
              />
            ))}
          </div>
        ) : recipes.length === 0 && !hasActiveFilters ? (
          <div className="flex-1 md:flex-none flex flex-col items-center justify-center text-center px-6 gap-6 md:py-20">
            <BookOpen size={48} className="text-muted-foreground/40" strokeWidth={1.5} />
            <div className="space-y-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-body font-semibold bg-primary/10 text-primary uppercase tracking-wider">
                Bienvenue
              </span>
              <p className="font-display text-2xl font-bold text-foreground">Votre livre de recettes <br className="md:hidden" />est tout neuf</p>
              <p className="font-body text-muted-foreground">
                Ajoutez votre première recette pour <br className="md:hidden" />commencer à cuisiner !
              </p>
              <Button onClick={() => navigate('/recipes/new')} className="font-body md:hidden">
                <Plus size={16} className="mr-1.5" /> Ajouter ma première recette
              </Button>
            </div>
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

      <BatchShareDialog
        recipeIds={Array.from(selectedRecipes)}
        open={showBatchShare}
        onOpenChange={(open) => {
          setShowBatchShare(open);
          if (!open) exitSelectionMode();
        }}
      />

      {showBeaverGame && (
        <Suspense>
          <BeaverCatchGame onClose={() => setShowBeaverGame(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default CatalogPage;
