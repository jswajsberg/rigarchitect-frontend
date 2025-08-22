import React, { useState, useMemo } from "react";
import type { ComponentResponse } from "../api/model";
import SearchBar from "../components/SearchBar";
import ComponentCard from "../components/ComponentCard";
import QuantityModal from "../modals/QuantityModal";
import type { SearchFilters } from "../components/SearchBar";
import { useCart } from "../contexts/CartContext";
import {
  useGetAllComponents,
  useGetComponentsByType,
} from "../api/component-controller/component-controller";

const ComponentCatalog: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const { addToCart, showToast, currentCart } = useCart();

  // Modal state for quantity selection
  const [quantityModal, setQuantityModal] = useState<{
    isOpen: boolean;
    component: ComponentResponse | null;
    actionType: "build" | "buy";
  }>({
    isOpen: false,
    component: null,
    actionType: "build",
  });

  // Advanced search filters
  const [filters, setFilters] = useState<SearchFilters>({
    type: "",
    brand: "",
    compatibilityTag: "",
    maxPrice: "",
    minStock: "0",
  });
  const [inStockOnly, setInStockOnly] = useState(false);

  // Define component types first
  const componentTypes = [
    { id: "CPU", name: "CPU", description: "Processors and chips" },
    { id: "GPU", name: "GPU", description: "Graphics cards" },
    { id: "RAM", name: "RAM", description: "Memory modules" },
    { id: "SSD", name: "SSD", description: "Solid state drives" },
    { id: "HDD", name: "HDD", description: "Hard disk drives" },
    { id: "Motherboard", name: "Motherboard", description: "Main boards" },
    { id: "PSU", name: "PSU", description: "Power supplies" },
    { id: "Case", name: "Case", description: "PC cases" },
    { id: "Cooler", name: "Cooler", description: "CPU coolers" },
  ];

  // Fetch all components for counts
  const { data: components, isLoading, error, refetch } = useGetAllComponents();

  // Fetch components of selected type
  const {
    data: typeComponents,
    isLoading: isTypeLoading,
    error: typeError,
  } = useGetComponentsByType(selectedType as any, {
    query: { enabled: !!selectedType && !searchTerm && !showAdvancedSearch },
  });

  // Determine search strategy and parameters
  const searchStrategy = useMemo(() => {
    if (showAdvancedSearch) {
      // Use advanced search with multiple filters
      const hasFilters =
        filters.type ||
        filters.brand ||
        filters.compatibilityTag ||
        filters.maxPrice ||
        filters.minStock !== "0";
      return hasFilters
        ? {
            strategy: "advanced" as const,
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

    // Simple search - try to determine the best endpoint to use
    const searchTermUpper = searchTerm.toUpperCase();

    // Check if it matches a component type
    const matchingType = componentTypes.find(
      (type) =>
        type.id.toUpperCase().includes(searchTermUpper) ||
        type.name.toUpperCase().includes(searchTermUpper)
    );

    if (matchingType) {
      return { strategy: "type" as const, params: matchingType.id };
    }

    // Check if it looks like a compatibility tag (common patterns)
    const compatibilityPatterns =
      /^(AM[45]|LGA\d+|DDR[3456]|ATX|mATX|ITX|PCIe[0-9.]+|SATA[36]|M\.2|NVMe|Socket\s+\w+|FM\d+|TR\d+)$/i;
    if (compatibilityPatterns.test(searchTerm)) {
      return { strategy: "compatibility" as const, params: searchTerm };
    }

    // Check for partial compatibility matches with common patterns
    const partialCompatibilityPatterns =
      /^(AM[45]|LGA|DDR\d|ATX|PCIe|SATA|FM\d|TR\d)/i;
    if (
      partialCompatibilityPatterns.test(searchTerm) &&
      searchTerm.length >= 3
    ) {
      return { strategy: "compatibility" as const, params: searchTerm };
    }

    // Check for RAM-related terms (DDR, memory, etc.)
    const ramPatterns = /^(DDR\d?|SDRAM|DIMM|SO-DIMM|memory)/i;
    if (ramPatterns.test(searchTerm)) {
      return { strategy: "type" as const, params: "RAM" };
    }

    // Default to general search - search in name, brand, and compatibility fields
    return { strategy: "general" as const, params: searchTerm };
  }, [searchTerm, showAdvancedSearch, filters, componentTypes]);

  // Type search (reuse existing hook)
  const {
    data: typeSearchResults,
    isLoading: isTypeSearchLoading,
    error: typeSearchError,
  } = useGetComponentsByType(
    searchStrategy?.strategy === "type" ? (searchStrategy.params as any) : null,
    {
      query: { enabled: searchStrategy?.strategy === "type" },
    }
  );

  const getComponentCount = (type: string): number => {
    if (!components?.data || !Array.isArray(components.data)) return 0;
    return components.data.filter((c: ComponentResponse) => c.type === type)
      .length;
  };

  const handleBrowseType = (typeId: string) => {
    setSelectedType(selectedType === typeId ? null : typeId);
    setSearchTerm("");
    setShowAdvancedSearch(false);
    setInStockOnly(false);
  };

  const handleSimpleSearch = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setSelectedType(null);
      setShowAdvancedSearch(false);
    }
  };

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
    setSearchTerm("");
    setSelectedType(null);
    setInStockOnly(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleInStockOnlyChange = (value: boolean) => {
    setInStockOnly(value);
    if (value) {
      setSearchTerm("");
      setSelectedType(null);
      setShowAdvancedSearch(false);
    }
  };

  // Updated cart handlers with modal
  const handleAddToBuildCart = async (component: ComponentResponse) => {
    if (!currentCart) {
      showToast("Please select a cart in Cart Management first!", "error");
      return;
    }

    setQuantityModal({
      isOpen: true,
      component,
      actionType: "build",
    });
  };

  const handleAddToCheckoutCart = async (component: ComponentResponse) => {
    if (!currentCart) {
      showToast("Please select a cart in Cart Management first!", "error");
      return;
    }

    setQuantityModal({
      isOpen: true,
      component,
      actionType: "buy",
    });
  };

  // Handle quantity confirmation from modal
  const handleQuantityConfirm = async (quantity: number) => {
    if (!quantityModal.component) return;

    await addToCart(quantityModal.component, quantity);

    if (quantityModal.actionType === "buy") {
      showToast(
        `${quantityModal.component.name} added! Go to Cart tab to checkout.`,
        "info"
      );
    }
  };

  // Close modal
  const closeModal = () => {
    setQuantityModal({
      isOpen: false,
      component: null,
      actionType: "build",
    });
  };

  const clearAllFilters = () => {
    setFilters({
      type: "",
      brand: "",
      compatibilityTag: "",
      maxPrice: "",
      minStock: "0",
    });
    setSearchTerm("");
    setSelectedType(null);
    setShowAdvancedSearch(false);
    setInStockOnly(false);
  };

  // Get the appropriate results based on search strategy with client-side filtering
  const displayedComponents = useMemo(() => {
    let results: ComponentResponse[] = [];

    // Get base results based on search/browse strategy
    if (searchStrategy) {
      switch (searchStrategy.strategy) {
        case "advanced":
          results = components?.data || [];

          if (searchStrategy.params.type) {
            results = results.filter(
              (c: ComponentResponse) => c.type === searchStrategy.params.type
            );
          }

          if (searchStrategy.params.brand) {
            results = results.filter((c: ComponentResponse) =>
              c.brand
                ?.toLowerCase()
                .includes(searchStrategy.params.brand.toLowerCase())
            );
          }

          if (searchStrategy.params.compatibilityTag) {
            results = results.filter((c: ComponentResponse) => {
              const searchTag =
                searchStrategy.params.compatibilityTag.toLowerCase();

              const tagMatch = c.compatibilityTag
                ?.toLowerCase()
                .includes(searchTag);
              const socketMatch = c.socket?.toLowerCase().includes(searchTag);
              const ramMatch = c.ramType?.toLowerCase().includes(searchTag);
              const formFactorMatch = c.formFactor
                ?.toLowerCase()
                .includes(searchTag);
              const psuFormFactorMatch = c.psuFormFactor
                ?.toLowerCase()
                .includes(searchTag);

              return (
                tagMatch ||
                socketMatch ||
                ramMatch ||
                formFactorMatch ||
                psuFormFactorMatch
              );
            });
          }

          if (searchStrategy.params.maxPrice) {
            const maxPrice = parseFloat(searchStrategy.params.maxPrice);
            results = results.filter(
              (c: ComponentResponse) =>
                c.price !== undefined && c.price <= maxPrice
            );
          }

          if (
            searchStrategy.params.minStock &&
            searchStrategy.params.minStock !== "0"
          ) {
            const minStock = parseInt(searchStrategy.params.minStock);
            results = results.filter(
              (c: ComponentResponse) =>
                c.stockQuantity !== undefined && c.stockQuantity >= minStock
            );
          }
          break;

        case "general":
          results =
            components?.data?.filter((c: ComponentResponse) => {
              const searchLower = (
                searchStrategy.params as string
              ).toLowerCase();
              const nameMatch = c.name?.toLowerCase().includes(searchLower);
              const brandMatch = c.brand?.toLowerCase().includes(searchLower);
              const compatibilityMatch = c.compatibilityTag
                ?.toLowerCase()
                .includes(searchLower);
              const socketMatch = c.socket?.toLowerCase().includes(searchLower);
              const ramMatch = c.ramType?.toLowerCase().includes(searchLower);
              const formFactorMatch = c.formFactor
                ?.toLowerCase()
                .includes(searchLower);
              const psuFormFactorMatch = c.psuFormFactor
                ?.toLowerCase()
                .includes(searchLower);

              return (
                nameMatch ||
                brandMatch ||
                compatibilityMatch ||
                socketMatch ||
                ramMatch ||
                formFactorMatch ||
                psuFormFactorMatch
              );
            }) || [];
          break;

        case "compatibility":
          results =
            components?.data?.filter((c: ComponentResponse) => {
              const searchTerm = (searchStrategy.params || "").toLowerCase();

              const tagMatch = c.compatibilityTag
                ?.toLowerCase()
                .includes(searchTerm);
              const socketMatch = c.socket?.toLowerCase().includes(searchTerm);
              const ramMatch = c.ramType?.toLowerCase().includes(searchTerm);
              const formFactorMatch = c.formFactor
                ?.toLowerCase()
                .includes(searchTerm);
              const psuFormFactorMatch = c.psuFormFactor
                ?.toLowerCase()
                .includes(searchTerm);

              return (
                tagMatch ||
                socketMatch ||
                ramMatch ||
                formFactorMatch ||
                psuFormFactorMatch
              );
            }) || [];
          break;

        case "type":
          results = typeSearchResults?.data || [];
          break;

        default:
          results = [];
          break;
      }
    } else if (selectedType) {
      results = typeComponents?.data || [];
    } else if (inStockOnly) {
      results =
        components?.data?.filter(
          (c: ComponentResponse) => c.stockQuantity && c.stockQuantity > 0
        ) || [];
    } else {
      results = [];
    }

    if (inStockOnly && searchStrategy?.strategy !== "advanced") {
      results = results.filter(
        (c: ComponentResponse) => c.stockQuantity && c.stockQuantity > 0
      );
    }

    return results;
  }, [
    searchStrategy,
    selectedType,
    typeSearchResults,
    typeComponents,
    components,
    inStockOnly,
  ]);

  const isSearchLoading = useMemo(() => {
    if (!searchStrategy && !selectedType && !inStockOnly) return false;

    if (searchStrategy) {
      switch (searchStrategy.strategy) {
        case "advanced":
        case "general":
        case "compatibility":
          return isLoading;
        case "type":
          return isTypeSearchLoading;
        default:
          return false;
      }
    }

    return selectedType ? isTypeLoading : isLoading;
  }, [
    searchStrategy,
    selectedType,
    isLoading,
    isTypeSearchLoading,
    isTypeLoading,
    inStockOnly,
  ]);

  const searchError = useMemo(() => {
    if (!searchStrategy && !selectedType && !inStockOnly) return null;

    if (searchStrategy) {
      switch (searchStrategy.strategy) {
        case "advanced":
        case "general":
        case "compatibility":
          return error;
        case "type":
          return typeSearchError;
        default:
          return null;
      }
    }

    return selectedType ? typeError : error;
  }, [
    searchStrategy,
    selectedType,
    error,
    typeSearchError,
    typeError,
    inStockOnly,
  ]);

  if (isLoading) return <div className="p-6">Loading components...</div>;
  if (error)
    return (
      <div className="p-6">
        <div className="text-red-600 mb-2">
          Error loading components: {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Component Catalog</h2>
          {currentCart && (
            <p className="text-sm text-gray-600 mt-1">
              Adding to: <span className="font-medium">{currentCart.name}</span>
              <span className="ml-2 text-green-600">
                ${currentCart.totalPrice?.toFixed(2) || "0.00"}
              </span>
            </p>
          )}
          {!currentCart && (
            <p className="text-sm text-red-600 mt-1">
              No cart selected. Create a cart in Cart Management to add items.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearAllFilters}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear All
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar Component */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchTermChange={handleSimpleSearch}
        showAdvancedSearch={showAdvancedSearch}
        onToggleAdvancedSearch={handleAdvancedSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        inStockOnly={inStockOnly}
        onInStockOnlyChange={handleInStockOnlyChange}
        componentTypes={componentTypes}
        disabled={isLoading}
      />

      {/* Type Cards - Only show when not searching */}
      {!searchTerm && !showAdvancedSearch && !inStockOnly && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Available Components</h3>
          <div className="text-gray-500 mb-4">
            Browse from {components?.data?.length || 0} total components
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {componentTypes.map((type) => {
              const count = getComponentCount(type.id);
              const isSelected = selectedType === type.id;

              return (
                <div
                  key={type.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-200 shadow-md"
                      : "bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{type.name}</h4>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {count} items
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {type.description}
                  </div>
                  <button
                    onClick={() => handleBrowseType(type.id)}
                    className={`text-sm font-medium ${
                      count === 0
                        ? "text-gray-400 cursor-not-allowed"
                        : isSelected
                        ? "text-red-600 hover:text-red-700"
                        : "text-blue-600 hover:text-blue-700"
                    }`}
                    disabled={count === 0}
                  >
                    {count === 0
                      ? "No items"
                      : isSelected
                      ? `Hide ${type.name}`
                      : `Browse ${type.name} →`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Display */}
      {(selectedType || searchTerm || showAdvancedSearch || inStockOnly) && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">
            {showAdvancedSearch
              ? "Filtered Results"
              : inStockOnly && !searchTerm && !selectedType
              ? "Components In Stock"
              : searchTerm
              ? `Search Results for "${searchTerm}"${
                  inStockOnly ? " (In Stock Only)" : ""
                }`
              : `${selectedType} Components${
                  inStockOnly ? " (In Stock Only)" : ""
                }`}
          </h3>

          {/* Search Strategy Indicator */}
          {searchStrategy && (
            <div className="text-xs text-blue-600 mb-3">
              Using {searchStrategy.strategy} search
              {searchStrategy.strategy === "type" &&
                " (detected component type)"}
              {searchStrategy.strategy === "compatibility" &&
                " (detected compatibility pattern)"}
              {searchStrategy.strategy === "general" &&
                " (searching all fields)"}
              {searchStrategy.strategy === "advanced" &&
                " (multiple filters applied)"}
              {inStockOnly && " • Filtered to in-stock items only"}
            </div>
          )}

          {/* Loading states */}
          {isSearchLoading && (
            <div className="text-blue-600">
              {showAdvancedSearch
                ? "Filtering..."
                : inStockOnly && !searchTerm && !selectedType
                ? "Loading in-stock components..."
                : searchTerm
                ? "Searching..."
                : `Loading ${selectedType}...`}
            </div>
          )}

          {/* Error states */}
          {searchError && (
            <div className="text-red-600">Error: {searchError.message}</div>
          )}

          {/* Results */}
          {!isSearchLoading && (
            <>
              {displayedComponents.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 mb-4">
                    {displayedComponents.length} component
                    {displayedComponents.length === 1 ? "" : "s"} found
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayedComponents.map((component: ComponentResponse) => (
                      <ComponentCard
                        key={component.id}
                        component={component}
                        onAddToBuildCart={handleAddToBuildCart}
                        onAddToCheckoutCart={handleAddToCheckoutCart}
                        showCartButtons={true}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  {showAdvancedSearch
                    ? "No components match your filters"
                    : inStockOnly && !searchTerm && !selectedType
                    ? "No components currently in stock"
                    : searchTerm
                    ? `No components match "${searchTerm}"${
                        inStockOnly ? " with stock available" : ""
                      }`
                    : `No components found in ${selectedType}${
                        inStockOnly ? " with stock available" : ""
                      }`}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quantity Selection Modal */}
      <QuantityModal
        component={quantityModal.component!}
        isOpen={quantityModal.isOpen}
        onClose={closeModal}
        onConfirm={handleQuantityConfirm}
        actionType={quantityModal.actionType}
      />
    </div>
  );
};

export default ComponentCatalog;
