import { createContext, useCallback, useContext, useRef, useState, MutableRefObject, ReactNode } from 'react';
import { Filters, defaultFilters } from '@/components/FilterBar';
import { newShuffleSeed } from '@/lib/recipe-ranking';

interface CatalogFilterState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchTags: string[];
  setSearchTags: (tags: string[]) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  /** Window scroll position of the catalog, kept while the user is on another page. */
  savedScrollY: MutableRefObject<number | null>;
  /** Seed of the "Suggestions" order: new on each app load, kept while browsing. */
  shuffleSeed: number;
}

const CatalogFilterContext = createContext<CatalogFilterState | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchTags, setSearchTagsState] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const savedScrollY = useRef<number | null>(null);
  const [shuffleSeed] = useState(newShuffleSeed);

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
      value={{ searchQuery, setSearchQuery, searchTags, setSearchTags, filters, setFilters, currentPage, setCurrentPage, savedScrollY, shuffleSeed }}
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
