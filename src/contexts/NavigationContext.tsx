/* eslint-disable react-refresh/only-export-components */
// src/contexts/NavigationContext.tsx - Enhanced with tab persistence
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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
  // Initialize state with persisted value or fallback to cart
  const [activeTab, setActiveTabState] = useState<string>(() => {
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
    // Default fallback remains cart for first-time users
    return "cart";
  });

  // Enhanced setActiveTab that persists the selection
  const setActiveTab = (tab: string) => {
    if (isValidTab(tab)) {
      setActiveTabState(tab);

      // Persist to localStorage for refresh retention
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
        } catch (error) {
          console.warn("Failed to persist tab state:", error);
          // Continue without persistence rather than breaking functionality
        }
      }
    } else {
      console.warn(`Invalid tab attempted: ${tab}. Falling back to cart.`);
      setActiveTabState("cart");
    }
  };

  // Cleanup effect for potential future storage management
  useEffect(() => {
    // Validate stored tab on mount in case invalid data was manually set
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      if (stored && !isValidTab(stored)) {
        localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
        setActiveTabState("cart");
      }
    }
  }, []);

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
