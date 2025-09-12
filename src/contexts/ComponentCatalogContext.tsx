/**
 * Component Catalog context for managing filter state persistence across tab switching
 * @module ComponentCatalogContext
 */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import type { SearchFilters } from "../components/SearchBar";

export interface ComponentCatalogState {
  searchTerm: string;
  showFilters: boolean;
  selectedType: string | null;
  filters: SearchFilters;
  inStockOnly: boolean;
  currentPage: number;
  usePagination: boolean;
}

interface ComponentCatalogContextType {
  catalogState: ComponentCatalogState;
  setSearchTerm: (searchTerm: string) => void;
  setShowFilters: (showFilters: boolean) => void;
  setSelectedType: (selectedType: string | null) => void;
  setFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void;
  setInStockOnly: (inStockOnly: boolean) => void;
  setCurrentPage: (currentPage: number) => void;
  setUsePagination: (usePagination: boolean) => void;
  resetPagination: () => void;
  clearAllFilters: () => void;
}

const ComponentCatalogContext = createContext<ComponentCatalogContextType | undefined>(
  undefined
);

interface ComponentCatalogProviderProps {
  children: ReactNode;
}

// Storage key for persisting component catalog state
const CATALOG_STATE_STORAGE_KEY = "rigarchitect_catalog_state";

// Default filter state
const defaultFilters: SearchFilters = {
  type: "",
  brand: "",
  compatibilityTag: "",
  maxPrice: "",
  minStock: "0",
};

const defaultState: ComponentCatalogState = {
  searchTerm: "",
  showFilters: false,
  selectedType: null,
  filters: defaultFilters,
  inStockOnly: false,
  currentPage: 0,
  usePagination: true,
};

export const ComponentCatalogProvider: React.FC<ComponentCatalogProviderProps> = ({
  children,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializingRef = useRef(true);

  // Initialize state from URL parameters or fallback to defaults
  const getInitialState = (): ComponentCatalogState => {
    const urlSearchTerm = searchParams.get('search') || '';
    const urlSelectedType = searchParams.get('type') || null;
    const urlPageParam = searchParams.get('page');
    const urlCurrentPage = urlPageParam ? Math.max(0, parseInt(urlPageParam) - 1) : 0;
    const urlUsePagination = searchParams.get('paginated') === 'true';
    const urlInStockOnly = searchParams.get('inStock') === 'true';
    const urlShowFilters = searchParams.get('filters') === 'true';

    // Get filters from URL
    const urlFilters: SearchFilters = {
      type: searchParams.get('filterType') || '',
      brand: searchParams.get('brand') || '',
      compatibilityTag: searchParams.get('compatibility') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minStock: searchParams.get('minStock') || '0',
    };

    // Check if there are any filter values present
    const hasFilterValues = urlFilters.type || urlFilters.brand || urlFilters.compatibilityTag || 
                          urlFilters.maxPrice || (urlFilters.minStock && urlFilters.minStock !== '0');

    // Auto-open filters panel if filter values are present or explicitly requested
    const shouldShowFilters = urlShowFilters || hasFilterValues;

    // If URL has parameters, use them
    if (urlSearchTerm || urlSelectedType || urlPageParam || urlUsePagination || urlInStockOnly || shouldShowFilters) {
      return {
        searchTerm: urlSearchTerm,
        showFilters: shouldShowFilters,
        selectedType: urlSelectedType,
        filters: urlFilters,
        inStockOnly: urlInStockOnly,
        currentPage: urlCurrentPage,
        usePagination: searchParams.has('paginated') ? urlUsePagination : true, // Use URL value if present, otherwise default to true
      };
    }

    // Fallback to localStorage if no URL params
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CATALOG_STATE_STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          return { ...defaultState, ...parsedState };
        }
      } catch (error) {
        console.warn("Failed to load persisted catalog state:", error);
      }
    }

    return defaultState;
  };

  const [catalogState, setCatalogState] = useState<ComponentCatalogState>(getInitialState);

  // Update URL parameters when state changes
  const updateURLParams = (newState: ComponentCatalogState) => {
    const newSearchParams = new URLSearchParams();
    
    // Only keep the tab parameter from existing params
    const currentTab = searchParams.get('tab');
    if (currentTab) {
      newSearchParams.set('tab', currentTab);
    }

    // Add catalog parameters only if they differ from defaults
    if (newState.searchTerm) newSearchParams.set('search', newState.searchTerm);
    if (newState.selectedType) newSearchParams.set('type', newState.selectedType);
    if (newState.currentPage >= 0) newSearchParams.set('page', (newState.currentPage + 1).toString());
    if (!newState.usePagination) newSearchParams.set('paginated', 'false');
    if (newState.inStockOnly) newSearchParams.set('inStock', 'true');
    if (newState.showFilters) newSearchParams.set('filters', 'true');
    
    // Add filter parameters
    if (newState.filters.type) newSearchParams.set('filterType', newState.filters.type);
    if (newState.filters.brand) newSearchParams.set('brand', newState.filters.brand);
    if (newState.filters.compatibilityTag) newSearchParams.set('compatibility', newState.filters.compatibilityTag);
    if (newState.filters.maxPrice) newSearchParams.set('maxPrice', newState.filters.maxPrice);
    if (newState.filters.minStock && newState.filters.minStock !== '0') newSearchParams.set('minStock', newState.filters.minStock);

    setSearchParams(newSearchParams, { replace: true });
  };

  // Persist state changes to localStorage and URL
  const persistState = (newState: ComponentCatalogState) => {
    updateURLParams(newState);
    
    // Also persist to localStorage as backup
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CATALOG_STATE_STORAGE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.warn("Failed to persist catalog state:", error);
      }
    }
  };

  // Individual setters that update specific parts of the state
  const setSearchTerm = (searchTerm: string) => {
    setCatalogState(prevState => ({ ...prevState, searchTerm }));
  };

  const setShowFilters = (showFilters: boolean) => {
    setCatalogState(prevState => ({ ...prevState, showFilters }));
  };

  const setSelectedType = (selectedType: string | null) => {
    setCatalogState(prevState => ({ ...prevState, selectedType }));
  };

  const setFilters = (filtersOrUpdater: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
    setCatalogState(prevState => {
      const newFilters = typeof filtersOrUpdater === 'function' 
        ? filtersOrUpdater(prevState.filters)
        : filtersOrUpdater;
      return { ...prevState, filters: newFilters };
    });
  };

  const setInStockOnly = (inStockOnly: boolean) => {
    setCatalogState(prevState => ({ ...prevState, inStockOnly }));
  };

  const setCurrentPage = (currentPage: number) => {
    setCatalogState(prevState => ({ ...prevState, currentPage }));
  };

  const setUsePagination = (usePagination: boolean) => {
    setCatalogState(prevState => ({ ...prevState, usePagination }));
  };

  // Helper functions
  const resetPagination = () => {
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setCatalogState(prevState => ({
      ...prevState,
      searchTerm: "",
      showFilters: false,
      selectedType: null,
      filters: defaultFilters,
      inStockOnly: false,
      currentPage: 0,
    }));
  };

  // Update URL and localStorage when state changes (but not during initialization)
  useEffect(() => {
    if (!isInitializingRef.current) {
      // Debounce the persist operation to prevent rapid URL updates
      const timeoutId = setTimeout(() => {
        persistState(catalogState);
      }, 100); // 100ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [catalogState]);

  // Sync with URL changes (browser back/forward) - only for component tab
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    // Only update state when switching TO the components tab or when already on it
    if (currentTab === 'components') {
      const newState = getInitialState();
      // Only update state if it's actually different to prevent unnecessary renders
      const stateChanged = JSON.stringify(newState) !== JSON.stringify(catalogState);
      if (stateChanged) {
        setCatalogState(newState);
      }
    }
    isInitializingRef.current = false;
  }, [searchParams.get('tab')]); // Only watch the tab parameter specifically

  // Cleanup effect for storage management
  useEffect(() => {
    // Validate stored state on mount and clean up if corrupted
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CATALOG_STATE_STORAGE_KEY);
        if (stored) {
          JSON.parse(stored); // Just validate it's parseable
        }
      } catch (error) {
        console.warn("Invalid stored catalog state, clearing:", error);
        localStorage.removeItem(CATALOG_STATE_STORAGE_KEY);
        setCatalogState(defaultState);
      }
    }
  }, []);

  return (
    <ComponentCatalogContext.Provider
      value={{
        catalogState,
        setSearchTerm,
        setShowFilters,
        setSelectedType,
        setFilters,
        setInStockOnly,
        setCurrentPage,
        setUsePagination,
        resetPagination,
        clearAllFilters,
      }}
    >
      {children}
    </ComponentCatalogContext.Provider>
  );
};

export const useComponentCatalog = () => {
  const context = useContext(ComponentCatalogContext);
  if (!context) {
    throw new Error("useComponentCatalog must be used within ComponentCatalogProvider");
  }
  return context;
};