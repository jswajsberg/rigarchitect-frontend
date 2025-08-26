// src/contexts/BuilderContext.tsx - Persist in-memory builder state across navigation
import React, { createContext, useContext, useState } from "react";
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
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
  const [currentBuild, setCurrentBuild] = useState<BuildSlots>({});
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: 0,
    max: 5000,
  });
  const [buildName, setBuildName] = useState<string>("");
  const [isModifyingExisting, setIsModifyingExisting] =
    useState<boolean>(false);

  const clearBuildState = () => {
    setSelectedBuildId(null);
    setCurrentBuild({});
    setPriceRange({ min: 0, max: 5000 });
    setBuildName("");
    setIsModifyingExisting(false);
  };

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
