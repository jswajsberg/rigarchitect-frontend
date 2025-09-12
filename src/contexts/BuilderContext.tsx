/**
 * Builder context for managing PC build state and configurations
 * @module BuilderContext
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { BuildSlots } from "../utils/compatibilityChecker";

type PriceRange = { min: number; max: number };

interface BuilderContextType {
  selectedBuildId: number | null;
  setSelectedBuildId: React.Dispatch<React.SetStateAction<number | null>>;

  currentBuild: BuildSlots;
  setCurrentBuild: React.Dispatch<React.SetStateAction<BuildSlots>>;

  priceRange: PriceRange;
  setPriceRange: React.Dispatch<React.SetStateAction<PriceRange>>;

  buildName: string;
  setBuildName: React.Dispatch<React.SetStateAction<string>>;

  isModifyingExisting: boolean;
  setIsModifyingExisting: React.Dispatch<React.SetStateAction<boolean>>;

  clearBuildState: () => void;
}

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user: authUser, mode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitializedFromURL = React.useRef(false);

  // Get initial build state from URL or default
  const getInitialBuildId = (): number | null => {
    const urlBuild = searchParams.get('build');
    if (urlBuild && urlBuild !== 'new') {
      const buildId = parseInt(urlBuild);
      return isNaN(buildId) ? null : buildId;
    }
    return null;
  };

  const [selectedBuildId, setSelectedBuildIdState] = useState<number | null>(getInitialBuildId);
  const [currentBuild, setCurrentBuild] = useState<BuildSlots>({});
  const [buildName, setBuildName] = useState<string>("");
  const [isModifyingExisting, setIsModifyingExisting] = useState<boolean>(false);

  // Enhanced setSelectedBuildId that updates URL only when on builds tab
  const setSelectedBuildId = (buildId: number | null) => {
    setSelectedBuildIdState(buildId);
    
    // Only update URL if we're currently on the builds tab
    const currentTab = searchParams.get('tab');
    if (currentTab === 'builds') {
      const newSearchParams = new URLSearchParams(searchParams);
      
      if (buildId) {
        newSearchParams.set('build', buildId.toString());
      } else {
        newSearchParams.delete('build');
        newSearchParams.delete('edit');
      }
      
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  // Initialize price range based on user budget
  const getInitialPriceRange = (): PriceRange => {
    const budget = authUser?.budget || 5000;
    return {
      min: 0,
      max: budget,
    };
  };

  const [priceRange, setPriceRange] =
    useState<PriceRange>(getInitialPriceRange);

  const clearBuildState = useCallback(() => {
    const budget = authUser?.budget || 5000;
    setSelectedBuildId(null);
    setCurrentBuild({});
    setPriceRange({ min: 0, max: budget }); // Reset to budget-based range
    setBuildName("");
    setIsModifyingExisting(false);
  }, [authUser?.budget]);

  // Update price range when user budget changes
  useEffect(() => {
    if (authUser?.budget) {
      const budget = authUser.budget;
      // Only update if current settings would exceed budget
      setPriceRange((prev) => ({
        min: Math.min(prev.min, budget),
        max: Math.min(prev.max, budget),
      }));
    }
  }, [authUser?.budget]);

  // Sync with URL changes (browser back/forward) - but only when on builds tab and not during initialization
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    
    // Only process if we're on the builds tab
    if (currentTab !== 'builds') return;
    
    if (hasInitializedFromURL.current) {
      const urlBuildId = getInitialBuildId();
      // Only update if there's a meaningful difference
      if (urlBuildId !== selectedBuildId) {
        setSelectedBuildIdState(urlBuildId);
      }
    } else {
      // Mark as initialized when we first visit builds tab
      hasInitializedFromURL.current = true;
    }
  }, [searchParams.get('tab'), searchParams.get('build'), selectedBuildId]);

  // Clear build state when switching to guest mode
  useEffect(() => {
    if (mode === 'guest') {
      clearBuildState();
    }
  }, [mode, clearBuildState]);

  return (
    <BuilderContext.Provider
      value={{
        selectedBuildId,
        setSelectedBuildId,
        currentBuild,
        setCurrentBuild,
        priceRange,
        setPriceRange,
        buildName,
        setBuildName,
        isModifyingExisting,
        setIsModifyingExisting,
        clearBuildState,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within a BuilderProvider");
  return ctx;
};
