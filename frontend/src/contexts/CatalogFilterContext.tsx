import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { Filters } from '@/components/FilterBar';

interface CatalogFilterState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchTags: string[];
  setSearchTags: (tags: string[]) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const defaultFilters: Filters = {
  type: 'tous',
  season: 'toutes',
  difficulty: 'toutes',
  sort: 'recent',
  tested: 'off',
  vegetarian: 'off',
  rapido: 'off',
  ownership: 'all',
};

const CatalogFilterContext = createContext<CatalogFilterState | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchTags, setSearchTagsState] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // A new search or filter goes back to page 1. This lives in the setters, not in
  // an effect on the catalog page, so that leaving the catalog (e.g. to /cart) and
  // coming back remounts it on the page the user was on.
  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    // Enter on an empty search box sets '' again; that is not a new search.
    if (q !== searchQuery) setCurrentPage(1);
  }, [searchQuery]);
  const setSearchTags = useCallback((tags: string[]) => {
    setSearchTagsState(tags);
    setCurrentPage(1);
  }, []);
  const setFilters = useCallback((f: Filters) => {
    setFiltersState(f);
    setCurrentPage(1);
  }, []);

  return (
    <CatalogFilterContext.Provider
      value={{ searchQuery, setSearchQuery, searchTags, setSearchTags, filters, setFilters, currentPage, setCurrentPage }}
    >
      {children}
    </CatalogFilterContext.Provider>
  );
}

export function useCatalogFilters() {
  const ctx = useContext(CatalogFilterContext);
  if (!ctx) throw new Error('useCatalogFilters must be used within CatalogFilterProvider');
  return ctx;
}
