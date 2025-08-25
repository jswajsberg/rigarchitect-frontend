// src/utils/searchStrategy.ts
import {
  expandSlangTerm,
  findComponentTypeFromSlang,
  COMPATIBILITY_PATTERNS,
  RAM_PATTERNS,
} from "./searchSlang";
import type { SearchFilters } from "../components/SearchBar";

export interface SearchStrategy {
  strategy: "advanced" | "type" | "compatibility" | "general";
  params: unknown;
  expandedTerm?: string;
  originalTerm?: string;
}

export function determineSearchStrategy(
  searchTerm: string,
  showAdvancedSearch: boolean,
  filters: SearchFilters,
  componentTypes: Array<{ id: string; name: string }>
): SearchStrategy | null {
  // Advanced search
  if (showAdvancedSearch) {
    const hasFilters =
      filters.type ||
      filters.brand ||
      filters.compatibilityTag ||
      filters.maxPrice ||
      filters.minStock !== "0";

    return hasFilters
      ? {
          strategy: "advanced",
          params: {
            type: filters.type,
            brand: filters.brand,
            compatibilityTag: filters.compatibilityTag,
            maxPrice: filters.maxPrice,
            minStock: filters.minStock,
          },
        }
      : null;
  }

  if (!searchTerm) return null;

  // Expand slang terms
  const { expandedTerm, wasExpanded } = expandSlangTerm(searchTerm);
  const searchTermUpper = expandedTerm.toUpperCase();
  const originalTermUpper = searchTerm.toUpperCase();

  // Check if it matches a component type (using both original and expanded terms)
  const matchingType = componentTypes.find(
    (type) =>
      type.id.toUpperCase().includes(searchTermUpper) ||
      type.name.toUpperCase().includes(searchTermUpper) ||
      type.id.toUpperCase().includes(originalTermUpper) ||
      type.name.toUpperCase().includes(originalTermUpper)
  );

  // Also check slang-to-component-type mapping
  const slangComponentType = findComponentTypeFromSlang(
    expandedTerm,
    componentTypes
  );

  if (matchingType || slangComponentType) {
    return {
      strategy: "type",
      params: matchingType?.id || slangComponentType,
      expandedTerm: wasExpanded ? expandedTerm : undefined,
      originalTerm: searchTerm,
    };
  }

  // Check if it looks like a compatibility tag
  if (
    COMPATIBILITY_PATTERNS.exact.test(expandedTerm) ||
    COMPATIBILITY_PATTERNS.exact.test(searchTerm)
  ) {
    return {
      strategy: "compatibility",
      params: searchTerm, // Use original term for compatibility searches
      expandedTerm: wasExpanded ? expandedTerm : undefined,
      originalTerm: searchTerm,
    };
  }

  // Check for partial compatibility matches
  if (
    (COMPATIBILITY_PATTERNS.partial.test(expandedTerm) ||
      COMPATIBILITY_PATTERNS.partial.test(searchTerm)) &&
    searchTerm.length >= 3
  ) {
    return {
      strategy: "compatibility",
      params: searchTerm,
      expandedTerm: wasExpanded ? expandedTerm : undefined,
      originalTerm: searchTerm,
    };
  }

  // Check for RAM-related terms (including slang)
  if (RAM_PATTERNS.test(expandedTerm) || RAM_PATTERNS.test(searchTerm)) {
    return {
      strategy: "type",
      params: "RAM",
      expandedTerm: wasExpanded ? expandedTerm : undefined,
      originalTerm: searchTerm,
    };
  }

  // Default to general search - search using expanded term
  return {
    strategy: "general",
    params: expandedTerm,
    expandedTerm: wasExpanded ? expandedTerm : undefined,
    originalTerm: searchTerm,
  };
}
