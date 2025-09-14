/**
 * Navigation context for managing active tab state with persistence
 * @module NavigationContext
 */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

interface NavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

interface NavigationProviderProps {
  children: ReactNode;
}

// Storage key for persisting active tab
const ACTIVE_TAB_STORAGE_KEY = "rigarchitect_active_tab";

// Valid tab names to prevent invalid stored values
const VALID_TABS = ["components", "builds", "orders", "cart"] as const;
type ValidTab = (typeof VALID_TABS)[number];

const isValidTab = (tab: string): tab is ValidTab => {
  return VALID_TABS.includes(tab as ValidTab);
};

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get tab from URL or fallback to localStorage then default
  const getInitialTab = (): string => {
    // First priority: URL parameter
    const urlTab = searchParams.get('tab');
    if (urlTab && isValidTab(urlTab)) {
      return urlTab;
    }

    // Second priority: localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
        if (stored && isValidTab(stored)) {
          return stored;
        }
      } catch (error) {
        console.warn("Failed to load persisted tab state:", error);
      }
    }

    // Default fallback
    return "builds";
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  // Enhanced setActiveTab that updates URL and persists the selection
  const setActiveTab = (tab: string) => {
    if (isValidTab(tab)) {
      // Only update if tab is actually changing
      if (tab === activeTab) return;
      
      setActiveTabState(tab);

      // Define tab-specific parameters that should be preserved
      const tabParamMap: Record<string, string[]> = {
        'components': ['search', 'type', 'page', 'paginated', 'inStock', 'filters', 'filterType', 'brand', 'compatibility', 'maxPrice', 'minStock'],
        'builds': ['build', 'step', 'edit'],
        'cart': ['view'],
        'orders': ['filter', 'sort']
      };

      // Create clean URL with tab parameter
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('tab', tab);

      // Preserve parameters for the target tab
      const preserveParams = tabParamMap[tab] || [];
      preserveParams.forEach(param => {
        const value = searchParams.get(param);
        if (value) newSearchParams.set(param, value);
      });

      // Update URL immediately without requestAnimationFrame to prevent delay
      setSearchParams(newSearchParams, { replace: true });

      // Persist to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
        } catch (error) {
          console.warn("Failed to persist tab state:", error);
        }
      }
    } else {
      console.warn(`Invalid tab attempted: ${tab}. Falling back to components.`);
      setActiveTab("components");
    }
  };

  // Sync with URL changes (browser back/forward) - prevent feedback loop
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && isValidTab(urlTab) && urlTab !== activeTab) {
      setActiveTabState(urlTab);
      // Also update localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, urlTab);
        } catch (error) {
          console.warn("Failed to persist tab state:", error);
        }
      }
    }
  }, [searchParams]); // Remove activeTab dependency to prevent feedback loop

  // Set initial URL if no tab parameter exists - run once on mount
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (!urlTab) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', activeTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep empty dependency array to run only once on mount

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
