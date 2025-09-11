/**
 * Builder context for managing PC build state and configurations
 * @module BuilderContext
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
  const [currentBuild, setCurrentBuild] = useState<BuildSlots>({});
  const [buildName, setBuildName] = useState<string>("");
  const [isModifyingExisting, setIsModifyingExisting] =
    useState<boolean>(false);

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
