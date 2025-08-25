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
import { determineSearchStrategy } from "../utils/searchStrategy";

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

  // Define component types
  const componentTypes = useMemo(() => [
    { id: "CPU", name: "CPU", description: "Processors and chips" },
    { id: "GPU", name: "GPU", description: "Graphics cards" },
    { id: "RAM", name: "RAM", description: "Memory modules" },
    { id: "SSD", name: "SSD", description: "Solid state drives" },
    { id: "HDD", name: "HDD", description: "Hard disk drives" },
    { id: "Motherboard", name: "Motherboard", description: "Main boards" },
    { id: "PSU", name: "PSU", description: "Power supplies" },
    { id: "Case", name: "Case", description: "PC cases" },
    { id: "Cooler", name: "Cooler", description: "CPU coolers" },
  ], []);

  // Fetch all components
  const { data: components, isLoading, error, refetch } = useGetAllComponents();

  // Fetch components of selected type
  const { data: typeComponents, error: typeError } = useGetComponentsByType(
    selectedType as 'CPU' | 'GPU' | 'RAM' | 'SSD' | 'HDD' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler',
    {
      query: { enabled: !!selectedType && !searchTerm && !showAdvancedSearch },
    }
  );

  // Determine search strategy using the utility
  const searchStrategy = useMemo(() => {
    return determineSearchStrategy(
      searchTerm,
      showAdvancedSearch,
      filters,
      componentTypes
    );
  }, [searchTerm, showAdvancedSearch, filters, componentTypes]);

  // Type search (reuse existing hook)
  const {
    data: typeSearchResults,
    isLoading: isTypeSearchLoading,
    error: typeSearchError,
  } = useGetComponentsByType(
    searchStrategy?.strategy === "type" ? (searchStrategy.params as 'CPU' | 'GPU' | 'RAM' | 'SSD' | 'HDD' | 'Motherboard' | 'PSU' | 'Case' | 'Cooler') : null,
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

  // Cart handlers
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
          // Use both original and expanded search terms for better results
          results =
            components?.data?.filter((c: ComponentResponse) => {
              const searchLower = (
                searchStrategy.params as string
              ).toLowerCase();
              const originalTerm =
                searchStrategy.originalTerm?.toLowerCase() || searchLower;

              // Search in multiple fields using both terms
              const searchTerms = [searchLower];
              if (searchStrategy.originalTerm && searchLower !== originalTerm) {
                searchTerms.push(originalTerm);
              }

              return searchTerms.some(
                (term) =>
                  c.name?.toLowerCase().includes(term) ||
                  c.brand?.toLowerCase().includes(term) ||
                  c.type?.toLowerCase().includes(term) ||
                  c.compatibilityTag?.toLowerCase().includes(term) ||
                  c.socket?.toLowerCase().includes(term) ||
                  c.ramType?.toLowerCase().includes(term) ||
                  c.formFactor?.toLowerCase().includes(term) ||
                  c.psuFormFactor?.toLowerCase().includes(term)
              );
            }) || [];
          break;

        case "compatibility":
          results =
            components?.data?.filter((c: ComponentResponse) => {
              const searchTag = (searchStrategy.params as string).toLowerCase();
              const originalTerm =
                searchStrategy.originalTerm?.toLowerCase() || searchTag;

              // Search using both expanded and original terms
              const searchTerms = [searchTag];
              if (searchStrategy.originalTerm && searchTag !== originalTerm) {
                searchTerms.push(originalTerm);
              }

              return searchTerms.some(
                (term) =>
                  c.compatibilityTag?.toLowerCase().includes(term) ||
                  c.socket?.toLowerCase().includes(term) ||
                  c.ramType?.toLowerCase().includes(term) ||
                  c.formFactor?.toLowerCase().includes(term) ||
                  c.psuFormFactor?.toLowerCase().includes(term)
              );
            }) || [];
          break;

        case "type":
          results = typeSearchResults?.data || [];
          break;
      }
    } else if (selectedType) {
      results = typeComponents?.data || [];
    } else if (inStockOnly) {
      results =
        components?.data?.filter(
          (c: ComponentResponse) => (c.stockQuantity || 0) > 0
        ) || [];
    } else {
      results = [];
    }

    // Apply in-stock filter if enabled
    if (inStockOnly && searchStrategy) {
      results = results.filter(
        (c: ComponentResponse) => (c.stockQuantity || 0) > 0
      );
    }

    return results;
  }, [
    searchStrategy,
    selectedType,
    components,
    typeSearchResults,
    typeComponents,
    inStockOnly,
  ]);

  // Determine loading state
  const isSearchLoading = useMemo(() => {
    if (!searchStrategy && !selectedType && !inStockOnly) return false;

    return searchStrategy?.strategy === "type"
      ? isTypeSearchLoading
      : isLoading;
  }, [
    searchStrategy,
    selectedType,
    isLoading,
    isTypeSearchLoading,
    inStockOnly,
  ]);

  // Determine error state
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Component Catalog</h1>

        {/* Current cart info */}
        {currentCart && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Adding to cart:{" "}
              <span className="font-semibold">{currentCart.name}</span>
              <span className="ml-3">
                Total:{" "}
                <span className="font-semibold">
                  ${currentCart.totalPrice?.toFixed(2) || "0.00"}
                </span>
              </span>
            </p>
          </div>
        )}

        {!currentCart && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              No cart selected. Create or select a cart in Cart Management to
              add components.
            </p>
          </div>
        )}

        <SearchBar
          searchTerm={searchTerm}
          onSearchTermChange={handleSimpleSearch}
          showAdvancedSearch={showAdvancedSearch}
          onToggleAdvancedSearch={handleAdvancedSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          componentTypes={componentTypes}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={handleInStockOnlyChange}
          disabled={isLoading}
        />
      </div>

      {/* Component type browsing section */}
      {!searchTerm && !showAdvancedSearch && !inStockOnly && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Browse by Component Type
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {componentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleBrowseType(type.id)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  selectedType === type.id
                    ? "bg-blue-50 border-blue-300 text-blue-800"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{type.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {type.description}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {getComponentCount(type.id)} components
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results section */}
      <div className="mb-6">
        {/* Results header */}
        {(searchTerm || showAdvancedSearch || selectedType || inStockOnly) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {searchTerm && (
                <>
                  Search results for "{searchTerm}"
                  {searchStrategy?.expandedTerm &&
                    searchStrategy.expandedTerm !== searchTerm && (
                      <span className="text-sm text-blue-600 ml-2">
                        (expanded from "{searchStrategy.originalTerm}")
                      </span>
                    )}
                </>
              )}
              {showAdvancedSearch && "Advanced search results"}
              {selectedType && `${selectedType} Components`}
              {inStockOnly && "Components in Stock"}
              {displayedComponents.length > 0 &&
                ` (${displayedComponents.length})`}
            </h2>
            {(searchTerm ||
              showAdvancedSearch ||
              selectedType ||
              inStockOnly) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Search strategy indicator */}
        {searchStrategy && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            Search strategy:{" "}
            <span className="font-semibold">{searchStrategy.strategy}</span>
            {searchStrategy.strategy === "type" && " (detected component type)"}
            {searchStrategy.strategy === "compatibility" &&
              " (detected compatibility pattern)"}
            {searchStrategy.strategy === "general" &&
              " (general text search with slang expansion)"}
            {searchStrategy.strategy === "advanced" &&
              " (multi-field filtering)"}
            {searchStrategy.expandedTerm &&
              searchStrategy.expandedTerm !== searchTerm && (
                <span className="ml-2">
                  • Expanded "{searchStrategy.originalTerm}" to "
                  {searchStrategy.expandedTerm}"
                </span>
              )}
          </div>
        )}

        {/* Loading state */}
        {isSearchLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading components...</div>
          </div>
        )}

        {/* Error state */}
        {searchError && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">
              Error loading components: {searchError.message}
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results grid */}
        {!isSearchLoading && !searchError && displayedComponents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onAddToBuildCart={handleAddToBuildCart}
                onAddToCheckoutCart={handleAddToCheckoutCart}
                showCartButtons={true}
              />
            ))}
          </div>
        )}

        {/* No results state */}
        {!isSearchLoading &&
          !searchError &&
          (searchTerm || showAdvancedSearch || selectedType || inStockOnly) &&
          displayedComponents.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">No components found</div>
              <div className="text-sm text-gray-500 mb-4">
                {searchStrategy?.expandedTerm &&
                  searchStrategy.expandedTerm !== searchTerm && (
                    <>
                      Tried expanding "{searchStrategy.originalTerm}" to "
                      {searchStrategy.expandedTerm}"
                    </>
                  )}
              </div>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear filters
              </button>
            </div>
          )}

        {/* Default state - no search/browse active */}
        {!searchTerm &&
          !showAdvancedSearch &&
          !selectedType &&
          !inStockOnly &&
          !isLoading &&
          !error && (
            <div className="text-center py-8">
              <div className="text-gray-600 mb-2">
                Search for components or browse by type to get started
              </div>
              <div className="text-sm text-gray-500">
                Try search terms like: "mobo", "gfx", "DDR4", "AM4", "ATX", or
                brand names
              </div>
            </div>
          )}
      </div>

      {/* Quantity Modal */}
      <QuantityModal
        isOpen={quantityModal.isOpen}
        onClose={closeModal}
        onConfirm={handleQuantityConfirm}
        component={quantityModal.component}
        actionType={quantityModal.actionType}
      />
    </div>
  );
};

export default ComponentCatalog;
