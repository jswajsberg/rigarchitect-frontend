// src/pages/ComponentCatalog.tsx - Updated with shopping cart integration
import React, { useState, useMemo } from "react";
import type { ComponentResponse } from "../api/model";
import SearchBar from "../components/SearchBar";
import ComponentCard from "../components/ComponentCard";
import QuantityModal from "../modals/QuantityModal";
import BuildSelectionModal from "../modals/BuildSelectionModal";
import type { SearchFilters } from "../components/SearchBar";
import { useSelectedUserId } from "../contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllComponents,
  useGetComponentsByType,
} from "../api/component-controller/component-controller";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import { useCreateItem } from "../api/cart-item-controller/cart-item-controller";
import { determineSearchStrategy } from "../utils/searchStrategy";
import type { CartItemRequest } from "../api/model";

const ComponentCatalog: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const selectedUserId = useSelectedUserId();
  const queryClient = useQueryClient();
  const createItemMutation = useCreateItem();
  const createCartMutation = useCreateCartForUser();

  // Fetch user's carts for build selection and shopping cart
  const { data: userCarts, isLoading: buildsLoading } = useGetUserCarts(
    selectedUserId || 0,
    {
      query: { enabled: !!selectedUserId },
    }
  );

  // Modal state for quantity selection (shopping cart)
  const [quantityModal, setQuantityModal] = useState<{
    isOpen: boolean;
    component: ComponentResponse | null;
    actionType: "build" | "buy";
  }>({
    isOpen: false,
    component: null,
    actionType: "build",
  });

  // Modal state for build selection (add to builds)
  const [buildSelectionModal, setBuildSelectionModal] = useState<{
    isOpen: boolean;
    component: ComponentResponse | null;
  }>({
    isOpen: false,
    component: null,
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

  // Fetch all components
  const { data: components, isLoading, error, refetch } = useGetAllComponents();

  // Fetch components of selected type
  const { data: typeComponents, error: typeError } = useGetComponentsByType(
    selectedType as any,
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
    searchStrategy?.strategy === "type" ? (searchStrategy.params as any) : null,
    {
      query: { enabled: searchStrategy?.strategy === "type" },
    }
  );

  // Get user's shopping cart (DRAFT status) and builds (ACTIVE status)
  const shoppingCart = useMemo(
    () => userCarts?.data?.find((cart) => cart.status === "DRAFT") || null,
    [userCarts]
  );

  const availableBuilds = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
    [userCarts]
  );

  // Utility function to show toast messages
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    // Simple alert for now - could be replaced with actual toast system later
    if (type === "error") {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  };

  // Auto-create shopping cart if it doesn't exist
  const ensureShoppingCart = async () => {
    if (shoppingCart || !selectedUserId) return shoppingCart;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: selectedUserId,
        data: { name: "Shopping Cart", status: "DRAFT" },
      });

      // Invalidate queries to refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });

      return newCartResponse.data;
    } catch (error: any) {
      console.error("Failed to create shopping cart:", error);
      showToast(
        `Failed to create shopping cart: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
      return null;
    }
  };

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

  // Cart handlers - Updated for new shopping cart system
  const handleAddToBuildCart = async (component: ComponentResponse) => {
    if (!selectedUserId) {
      showToast("Please select a user first!", "error");
      return;
    }

    // Open the build selection modal
    setBuildSelectionModal({
      isOpen: true,
      component,
    });
  };

  // Updated: Add directly to shopping cart (DRAFT BuildCart)
  const handleAddToCheckoutCart = async (component: ComponentResponse) => {
    if (!selectedUserId) {
      showToast("Please select a user first!", "error");
      return;
    }

    // Open quantity modal for shopping cart
    setQuantityModal({
      isOpen: true,
      component,
      actionType: "buy",
    });
  };

  // Handle adding component to multiple builds
  const handleBuildSelectionConfirm = async (
    selectedBuildIds: number[],
    quantity: number
  ) => {
    if (!buildSelectionModal.component || !selectedUserId) {
      showToast("Error: Missing component or user selection", "error");
      return;
    }

    const component = buildSelectionModal.component;
    let successCount = 0;
    let failCount = 0;

    // Add component to each selected build
    for (const buildId of selectedBuildIds) {
      try {
        const cartItemRequest: CartItemRequest = {
          cartId: buildId,
          componentId: component.id!,
          quantity,
        };

        await createItemMutation.mutateAsync({ data: cartItemRequest });
        successCount++;
      } catch (error: any) {
        failCount++;
        console.error(`Failed to add component to build ${buildId}:`, error);
      }
    }

    // Invalidate relevant queries to refresh the UI
    queryClient.invalidateQueries({
      queryKey: [`/api/v1/carts/user/${selectedUserId}`],
    });

    selectedBuildIds.forEach((buildId) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${buildId}`],
      });
    });

    // Show results
    if (successCount > 0 && failCount === 0) {
      showToast(
        `Added ${component.name} to ${successCount} build${
          successCount !== 1 ? "s" : ""
        } (Qty: ${quantity} each)`,
        "success"
      );
    } else if (successCount > 0 && failCount > 0) {
      showToast(
        `Added to ${successCount} build${
          successCount !== 1 ? "s" : ""
        }, failed for ${failCount}`,
        "error"
      );
    } else {
      showToast(`Failed to add component to any builds`, "error");
    }
  };

  // Handle quantity confirmation (for shopping cart)
  const handleQuantityConfirm = async (quantity: number) => {
    if (!quantityModal.component || !selectedUserId) return;

    const component = quantityModal.component;

    try {
      // Ensure shopping cart exists
      let targetCart = shoppingCart;
      if (!targetCart) {
        targetCart = await ensureShoppingCart();
        if (!targetCart) return; // Failed to create cart
      }

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId: component.id!,
        quantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      // Refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });

      showToast(
        `${component.name} added to shopping cart! Go to Shopping Cart to checkout.`,
        "success"
      );
    } catch (error: any) {
      console.error("Failed to add component to shopping cart:", error);
      showToast(
        `Failed to add component: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const closeQuantityModal = () => {
    setQuantityModal({
      isOpen: false,
      component: null,
      actionType: "build",
    });
  };

  const closeBuildSelectionModal = () => {
    setBuildSelectionModal({
      isOpen: false,
      component: null,
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

          if ((searchStrategy.params as any).type) {
            results = results.filter(
              (c: ComponentResponse) =>
                c.type === (searchStrategy.params as any).type
            );
          }

          if ((searchStrategy.params as any).brand) {
            results = results.filter((c: ComponentResponse) =>
              c.brand
                ?.toLowerCase()
                .includes((searchStrategy.params as any).brand.toLowerCase())
            );
          }

          if ((searchStrategy.params as any).compatibilityTag) {
            results = results.filter((c: ComponentResponse) => {
              const searchTag = (
                searchStrategy.params as any
              ).compatibilityTag.toLowerCase();

              return (
                c.compatibilityTag?.toLowerCase().includes(searchTag) ||
                c.socket?.toLowerCase().includes(searchTag) ||
                c.formFactor?.toLowerCase().includes(searchTag) ||
                c.ramType?.toLowerCase().includes(searchTag) ||
                c.psuFormFactor?.toLowerCase().includes(searchTag)
              );
            });
          }

          if ((searchStrategy.params as any).maxPrice) {
            const maxPrice = parseFloat(
              (searchStrategy.params as any).maxPrice
            );
            if (!isNaN(maxPrice)) {
              results = results.filter(
                (c: ComponentResponse) => (c.price || 0) <= maxPrice
              );
            }
          }

          if ((searchStrategy.params as any).minStock) {
            const minStock = parseInt((searchStrategy.params as any).minStock);
            if (!isNaN(minStock)) {
              results = results.filter(
                (c: ComponentResponse) => (c.stockQuantity || 0) >= minStock
              );
            }
          }
          break;

        case "type":
          results = typeSearchResults?.data || [];
          break;

        case "general":
          results = components?.data || [];
          const searchTermLower = (
            searchStrategy.params as string
          ).toLowerCase();

          results = results.filter((c: ComponentResponse) => {
            const searchableFields = [
              c.name,
              c.brand,
              c.type,
              c.compatibilityTag,
              c.socket,
              c.formFactor,
              c.ramType,
              c.psuFormFactor,
            ]
              .filter(Boolean)
              .map((field) => field!.toLowerCase());

            return searchableFields.some((field) =>
              field.includes(searchTermLower)
            );
          });
          break;

        case "compatibility":
          results = components?.data || [];
          const searchTag = (searchStrategy.params as string).toLowerCase();

          results = results.filter((c: ComponentResponse) => {
            return (
              c.compatibilityTag?.toLowerCase().includes(searchTag) ||
              c.socket?.toLowerCase().includes(searchTag) ||
              c.formFactor?.toLowerCase().includes(searchTag) ||
              c.ramType?.toLowerCase().includes(searchTag) ||
              c.psuFormFactor?.toLowerCase().includes(searchTag)
            );
          });
          break;

        default:
          results = [];
      }
    } else {
      // Browse by type or show all if inStockOnly
      if (selectedType) {
        results = typeComponents?.data || [];
      } else if (inStockOnly) {
        results =
          components?.data?.filter(
            (c: ComponentResponse) => c.stockQuantity && c.stockQuantity > 0
          ) || [];
      } else {
        results = []; // Don't show all components by default
      }
    }

    return results;
  }, [
    searchStrategy,
    components?.data,
    typeComponents?.data,
    typeSearchResults?.data,
    selectedType,
    inStockOnly,
  ]);

  const isSearchLoading =
    isLoading || (searchStrategy?.strategy === "type" && isTypeSearchLoading);
  const searchError = error || typeError || typeSearchError;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Component Catalog</h1>
        <p className="text-gray-600 mt-2">
          Browse and search for PC components to add to your builds or shopping
          cart
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-8">
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

      {/* Browse by Type */}
      {!searchTerm && !showAdvancedSearch && !inStockOnly && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Browse by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <div className="text-sm text-gray-600">{type.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getComponentCount(type.id)} available
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Modals */}
      {/* Quantity Modal for Shopping Cart */}
      <QuantityModal
        isOpen={quantityModal.isOpen}
        onClose={closeQuantityModal}
        onConfirm={handleQuantityConfirm}
        component={quantityModal.component}
        actionType={quantityModal.actionType}
      />

      {/* Build Selection Modal for Add to Build */}
      <BuildSelectionModal
        isOpen={buildSelectionModal.isOpen}
        onClose={closeBuildSelectionModal}
        onConfirm={handleBuildSelectionConfirm}
        component={buildSelectionModal.component}
        availableBuilds={availableBuilds}
        isLoading={buildsLoading}
      />
    </div>
  );
};

export default ComponentCatalog;
