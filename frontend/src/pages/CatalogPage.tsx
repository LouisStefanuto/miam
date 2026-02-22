import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PenLine, Camera, Instagram, Download, FileJson } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { useCatalogFilters } from '@/contexts/CatalogFilterContext';
import HeroSection from '@/components/HeroSection';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
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

const CatalogPage = () => {
  const navigate = useNavigate();
  const { data: recipes = [], isLoading } = useRecipes();
  const { searchQuery, setSearchQuery, searchTags, setSearchTags, filters, setFilters, currentPage, setCurrentPage } = useCatalogFilters();
  const [customTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    customTags.forEach((t) => tagSet.add(t));
    return Array.from(tagSet).sort();
  }, [recipes, customTags]);

  // Keep allTags available but unused for now — catalog doesn't render tags directly
  void allTags;

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
      <HeroSection />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Search + Add button on same line */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchBar tags={searchTags} onTagsChange={setSearchTags} query={searchQuery} onQueryChange={setSearchQuery} />
          <Button onClick={() => navigate('/export')} variant="outline" className="font-body font-semibold gap-2 ml-auto shrink-0">
            <Download size={18} />
            Exporter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gradient-warm text-primary-foreground font-body font-semibold gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 shrink-0">
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
              <DropdownMenuItem disabled className="gap-2 cursor-pointer opacity-50">
                <Instagram size={16} />
                Importer depuis Instagram
                <span className="text-xs text-muted-foreground ml-auto">Bientôt</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-body">
          {filtered.length} recette{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
        </p>

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
    </div>
  );
};

export default CatalogPage;
