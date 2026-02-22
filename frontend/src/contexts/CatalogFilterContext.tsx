import { createContext, useContext, useState, ReactNode } from 'react';
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
};

const CatalogFilterContext = createContext<CatalogFilterState | null>(null);

export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

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
