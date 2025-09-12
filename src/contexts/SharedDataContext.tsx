/**
 * Shared data context for managing common data across components
 * Prevents duplicate API calls and improves performance
 * @module SharedDataContext
 */
import React, { createContext, useContext } from "react";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { ComponentResponse } from "../api/model";

interface SharedDataContextType {
  allComponents: ComponentResponse[] | undefined;
  allComponentsLoading: boolean;
  allComponentsError: any;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export const SharedDataProvider: React.FC<{ children: React.ReactNode }> = React.memo(({
  children,
}) => {
  // Fetch all components once at the top level
  const { data: allComponents, isLoading: allComponentsLoading, error: allComponentsError } = useGetAllComponents();

  const value: SharedDataContextType = {
    allComponents: allComponents?.data,
    allComponentsLoading,
    allComponentsError,
  };

  return (
    <SharedDataContext.Provider value={value}>
      {children}
    </SharedDataContext.Provider>
  );
});

SharedDataProvider.displayName = 'SharedDataProvider';

export const useSharedData = () => {
  const context = useContext(SharedDataContext);
  if (!context) {
    throw new Error("useSharedData must be used within SharedDataProvider");
  }
  return context;
};