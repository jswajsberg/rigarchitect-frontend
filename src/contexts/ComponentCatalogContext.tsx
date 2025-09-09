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
  type ReactNode,
} from "react";
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
  // Initialize state with persisted value or fallback to defaults
  const [catalogState, setCatalogState] = useState<ComponentCatalogState>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CATALOG_STATE_STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          // Merge with defaults to handle new properties in updates
          return { ...defaultState, ...parsedState };
        }
      } catch (error) {
        console.warn("Failed to load persisted catalog state:", error);
      }
    }
    return defaultState;
  });

  // Persist state changes to localStorage
  const persistState = (newState: ComponentCatalogState) => {
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
    setCatalogState(prevState => {
      const newState = { ...prevState, searchTerm };
      persistState(newState);
      return newState;
    });
  };

  const setShowFilters = (showFilters: boolean) => {
    setCatalogState(prevState => {
      const newState = { ...prevState, showFilters };
      persistState(newState);
      return newState;
    });
  };

  const setSelectedType = (selectedType: string | null) => {
    setCatalogState(prevState => {
      const newState = { ...prevState, selectedType };
      persistState(newState);
      return newState;
    });
  };

  const setFilters = (filtersOrUpdater: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
    setCatalogState(prevState => {
      const newFilters = typeof filtersOrUpdater === 'function' 
        ? filtersOrUpdater(prevState.filters)
        : filtersOrUpdater;
      const newState = { ...prevState, filters: newFilters };
      persistState(newState);
      return newState;
    });
  };

  const setInStockOnly = (inStockOnly: boolean) => {
    setCatalogState(prevState => {
      const newState = { ...prevState, inStockOnly };
      persistState(newState);
      return newState;
    });
  };

  const setCurrentPage = (currentPage: number) => {
    setCatalogState(prevState => {
      const newState = { ...prevState, currentPage };
      persistState(newState);
      return newState;
    });
  };

  const setUsePagination = (usePagination: boolean) => {
    setCatalogState(prevState => {
      const newState = { ...prevState, usePagination };
      persistState(newState);
      return newState;
    });
  };

  // Helper functions
  const resetPagination = () => {
    setCurrentPage(0);
  };

  const clearAllFilters = () => {
    setCatalogState(prevState => {
      const newState = {
        ...prevState,
        searchTerm: "",
        selectedType: null,
        filters: defaultFilters,
        inStockOnly: false,
        currentPage: 0,
      };
      persistState(newState);
      return newState;
    });
  };

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