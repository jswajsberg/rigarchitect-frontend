// src/pages/ComponentCatalog.tsx - Fixed version with proper prop handling
import React, { useState, useMemo } from "react";
import { useSelectedUserId } from "../contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllComponents,
  useGetComponentsByType,
} from "../api/component-controller/component-controller";
import {
  useCreateItem,
  useDeleteItem,
  getItemsByCart,
} from "../api/cart-item-controller/cart-item-controller";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import type {
  ComponentResponse,
  CartItemRequest,
  CartItemResponse,
} from "../api/model";
import ComponentCard from "../components/ComponentCard";
import SearchBar from "../components/SearchBar";
import QuantityModal from "../modals/QuantityModal";
import BuildSelectionModal from "../modals/BuildSelectionModal";
import ComponentReplacementModal from "../modals/ComponentReplacementModal";
import { determineSearchStrategy } from "../utils/searchStrategy";
import { useCart } from "../contexts/CartContext";
import type { SearchFilters } from "../components/SearchBar";

// Lucide React icon imports for component categories
import {
  Cpu, // CPU
  Monitor, // GPU
  HardDrive, // RAM (memory stick representation)
  Database, // SSD
  Archive, // HDD
  CircuitBoard, // Motherboard
  Zap, // PSU
  Box, // Case
  Wind, // Cooler
} from "lucide-react";

const ComponentCatalog: React.FC = () => {
  const selectedUserId = useSelectedUserId();
  const queryClient = useQueryClient();
  const { showToast } = useCart();

  // Local state for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Mutations for creating/deleting cart items
  const createItemMutation = useCreateItem();
  const deleteItemMutation = useDeleteItem();
  const createCartMutation = useCreateCartForUser();

  // Get available builds for the user (ACTIVE status only)
  const { data: userCarts, isLoading: buildsLoading } = useGetUserCarts(
    selectedUserId || 0,
    {
      query: { enabled: !!selectedUserId },
    }
  );

  const availableBuilds = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
    [userCarts]
  );

  // Get shopping cart (DRAFT status)
  const shoppingCart = useMemo(
    () => userCarts?.data?.find((cart) => cart.status === "DRAFT") || null,
    [userCarts]
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

  // State for component replacement modal
  const [replacementModal, setReplacementModal] = useState<{
    isOpen: boolean;
    buildId: number | null;
    buildName: string;
    currentComponent: ComponentResponse | null;
    newComponent: ComponentResponse | null;
    quantity: number;
  }>({
    isOpen: false,
    buildId: null,
    buildName: "",
    currentComponent: null,
    newComponent: null,
    quantity: 1,
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

  // Component types with associated icons - centralized for consistency
  const componentTypes = [
    {
      id: "CPU",
      name: "CPU",
      description: "Processors and chips",
      icon: Cpu,
    },
    {
      id: "GPU",
      name: "GPU",
      description: "Graphics cards",
      icon: Monitor,
    },
    {
      id: "RAM",
      name: "RAM",
      description: "Memory modules",
      icon: HardDrive,
    },
    {
      id: "SSD",
      name: "SSD",
      description: "Solid state drives",
      icon: Database,
    },
    {
      id: "HDD",
      name: "HDD",
      description: "Hard disk drives",
      icon: Archive,
    },
    {
      id: "Motherboard",
      name: "Motherboard",
      description: "Main boards",
      icon: CircuitBoard,
    },
    {
      id: "PSU",
      name: "PSU",
      description: "Power supplies",
      icon: Zap,
    },
    {
      id: "Case",
      name: "Case",
      description: "PC cases",
      icon: Box,
    },
    {
      id: "Cooler",
      name: "Cooler",
      description: "CPU coolers",
      icon: Wind,
    },
  ];

  // Fetch all components
  const {
    data: allComponents,
    isLoading,
    error,
    refetch,
  } = useGetAllComponents();

  // Fetch components of selected type
  const { data: typeComponents, error: typeError } = useGetComponentsByType(
    selectedType as any,
    {
      query: { enabled: !!selectedType },
    }
  );

  // Search and filter logic
  const displayedComponents = useMemo(() => {
    let components: ComponentResponse[] = [];

    // Determine which components to use
    if (selectedType && typeComponents?.data) {
      components = typeComponents.data;
    } else if (allComponents?.data) {
      components = allComponents.data;
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const strategy = determineSearchStrategy(
        searchTerm,
        showAdvancedSearch,
        filters,
        componentTypes
      );
      const expandedTerm = strategy?.expandedTerm || searchTerm;
      const lowerSearchTerm = expandedTerm.toLowerCase();

      components = components.filter((component) => {
        const searchableFields = [
          component.name,
          component.brand,
          component.type,
          component.compatibilityTag, // Fixed: using compatibilityTag instead of compatibilityTags
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableFields.includes(lowerSearchTerm);
      });
    }

    // Apply advanced filters
    if (filters.type) {
      components = components.filter((c) => c.type === filters.type);
    }
    if (filters.brand) {
      components = components.filter((c) =>
        c.brand?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    if (filters.compatibilityTag) {
      components = components.filter(
        (c) =>
          c.compatibilityTag
            ?.toLowerCase()
            .includes(filters.compatibilityTag.toLowerCase()) // Fixed: using single compatibilityTag
      );
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      components = components.filter((c) => (c.price || 0) <= maxPrice);
    }
    if (filters.minStock) {
      const minStock = parseInt(filters.minStock);
      components = components.filter((c) => (c.stockQuantity || 0) >= minStock);
    }
    if (inStockOnly) {
      components = components.filter((c) => (c.stockQuantity || 0) > 0);
    }

    return components;
  }, [
    allComponents,
    typeComponents,
    selectedType,
    searchTerm,
    filters,
    inStockOnly,
    showAdvancedSearch,
    componentTypes,
  ]);

  const searchStrategy = searchTerm.trim()
    ? determineSearchStrategy(
        searchTerm,
        showAdvancedSearch,
        filters,
        componentTypes
      )
    : null;

  // Loading states
  const isSearchLoading = selectedType ? false : isLoading;
  const searchError = selectedType ? typeError : error;

  // Ensure shopping cart exists
  const ensureShoppingCart = async () => {
    if (shoppingCart || !selectedUserId) return shoppingCart;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: selectedUserId,
        data: { name: "Shopping Cart", status: "DRAFT" },
      });

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

  // Component action handlers
  const handleAddToBuildCart = (component: ComponentResponse) => {
    if (!selectedUserId) {
      showToast("Please select a user first!", "error");
      return;
    }

    setBuildSelectionModal({
      isOpen: true,
      component,
    });
  };

  const handleAddToCheckoutCart = async (component: ComponentResponse) => {
    if (!selectedUserId) {
      showToast("Please select a user first!", "error");
      return;
    }

    setQuantityModal({
      isOpen: true,
      component,
      actionType: "buy",
    });
  };

  // Helper function to check if component type allows only single instances
  const isSingleSlotComponent = (componentType: string): boolean => {
    return !["RAM", "SSD", "HDD"].includes(componentType);
  };

  // Enhanced build selection confirmation handler with replacement logic
  const handleBuildSelectionConfirm = async (
    selectedBuildIds: number[],
    quantity: number
  ) => {
    if (!buildSelectionModal.component || !selectedUserId) {
      showToast("Error: Missing component or user selection", "error");
      return;
    }

    const newComponent = buildSelectionModal.component;
    const buildsNeedingReplacement: Array<{
      buildId: number;
      buildName: string;
      currentComponent: ComponentResponse;
    }> = [];

    // Check each selected build for existing components of the same type
    if (isSingleSlotComponent(newComponent.type || "")) {
      for (const buildId of selectedBuildIds) {
        try {
          const buildItemsResponse = await queryClient.fetchQuery({
            queryKey: [`/api/v1/items/cart/${buildId}`],
            queryFn: () => getItemsByCart(buildId),
          });

          if (buildItemsResponse?.data) {
            // Find existing component of same type
            const existingItem = buildItemsResponse.data.find(
              (item: CartItemResponse) => {
                const existingComponent = allComponents?.data?.find(
                  (comp: ComponentResponse) => comp.id === item.componentId
                );
                return existingComponent?.type === newComponent.type;
              }
            );

            if (existingItem) {
              const existingComponent = allComponents?.data?.find(
                (comp: ComponentResponse) =>
                  comp.id === existingItem.componentId
              );

              const build = availableBuilds.find((b) => b.id === buildId);

              if (existingComponent && build) {
                buildsNeedingReplacement.push({
                  buildId,
                  buildName: build.name || `Build #${buildId}`,
                  currentComponent: existingComponent,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to check build ${buildId} for conflicts:`,
            error
          );
        }
      }
    }

    // If replacements needed, show replacement modal for first conflict
    if (buildsNeedingReplacement.length > 0) {
      const firstConflict = buildsNeedingReplacement[0];
      setReplacementModal({
        isOpen: true,
        buildId: firstConflict.buildId,
        buildName: firstConflict.buildName,
        currentComponent: firstConflict.currentComponent,
        newComponent,
        quantity,
      });
      return; // Don't proceed with normal addition
    }

    // Proceed with normal addition for builds without conflicts
    await proceedWithBuildAddition(selectedBuildIds, quantity, newComponent);
  };

  // Helper function for actual component addition
  const proceedWithBuildAddition = async (
    selectedBuildIds: number[],
    quantity: number,
    component: ComponentResponse
  ) => {
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

    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({
      queryKey: [`/api/v1/carts/user/${selectedUserId}`],
    });

    selectedBuildIds.forEach((buildId) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${buildId}`],
      });
    });

    // Show results toast
    if (successCount > 0 && failCount === 0) {
      showToast(
        `Added ${component.name} to ${successCount} build${
          successCount !== 1 ? "s" : ""
        }!`,
        "success"
      );
    } else if (successCount > 0 && failCount > 0) {
      showToast(
        `Added to ${successCount} build${
          successCount !== 1 ? "s" : ""
        }, ${failCount} failed`,
        "warning"
      );
    } else {
      showToast("Failed to add component to builds", "error");
    }

    // Close build selection modal
    setBuildSelectionModal({ isOpen: false, component: null });
  };

  // Component replacement confirmation handlers
  const handleComponentReplace = async () => {
    if (
      !replacementModal.buildId ||
      !replacementModal.newComponent ||
      !replacementModal.currentComponent
    ) {
      return;
    }

    try {
      // First, find and remove the existing component
      const buildItemsResponse = await queryClient.fetchQuery({
        queryKey: [`/api/v1/items/cart/${replacementModal.buildId}`],
        queryFn: () => getItemsByCart(replacementModal.buildId!),
      });

      const existingItem = buildItemsResponse?.data?.find(
        (item: CartItemResponse) =>
          item.componentId === replacementModal.currentComponent!.id
      );

      if (existingItem) {
        await deleteItemMutation.mutateAsync({ id: existingItem.id! });
      }

      // Then add the new component
      const cartItemRequest: CartItemRequest = {
        cartId: replacementModal.buildId,
        componentId: replacementModal.newComponent.id!,
        quantity: replacementModal.quantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${replacementModal.buildId}`],
      });

      showToast(
        `Replaced ${replacementModal.currentComponent.name} with ${replacementModal.newComponent.name}!`,
        "success"
      );

      // Close modals
      setReplacementModal({
        isOpen: false,
        buildId: null,
        buildName: "",
        currentComponent: null,
        newComponent: null,
        quantity: 1,
      });
      setBuildSelectionModal({ isOpen: false, component: null });
    } catch (error: any) {
      console.error("Failed to replace component:", error);
      showToast(
        `Failed to replace component: ${
          error.response?.data?.message || error.message
        }`,
        "error"
      );
    }
  };

  const handleComponentReplacementCancel = () => {
    setReplacementModal({
      isOpen: false,
      buildId: null,
      buildName: "",
      currentComponent: null,
      newComponent: null,
      quantity: 1,
    });
    // Keep build selection modal open for user to make different choices
  };

  // Handle quantity confirmation for shopping cart
  const handleQuantityConfirm = async (quantity: number) => {
    if (!quantityModal.component || !selectedUserId) {
      showToast("Error: Missing component or user selection", "error");
      return;
    }

    const component = quantityModal.component;

    try {
      let targetCart = shoppingCart;
      if (!targetCart) {
        targetCart = await ensureShoppingCart();
        if (!targetCart) return;
      }

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId: component.id!,
        quantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });

      showToast(
        `Added ${quantity}x ${component.name} to shopping cart! Go to Shopping Cart to checkout.`,
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

  // Modal control functions
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedType(null);
    setFilters({
      type: "",
      brand: "",
      compatibilityTag: "",
      maxPrice: "",
      minStock: "0",
    });
    setInStockOnly(false);
    setShowAdvancedSearch(false);
  };

  // SearchBar prop handlers
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleToggleAdvancedSearch = () => {
    setShowAdvancedSearch(!showAdvancedSearch);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleInStockOnlyChange = (value: boolean) => {
    setInStockOnly(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Component Catalog
        </h1>
        <p className="text-gray-600">
          Browse and search components for your PC builds
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <SearchBar
          searchTerm={searchTerm}
          onSearchTermChange={handleSearchTermChange}
          showAdvancedSearch={showAdvancedSearch}
          onToggleAdvancedSearch={handleToggleAdvancedSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={handleInStockOnlyChange}
          componentTypes={componentTypes}
          disabled={false}
        />
      </div>

      {/* Component Type Categories */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedType
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Components
          </button>
          {componentTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <IconComponent size={16} />
                {type.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Section */}
      <div>
        {/* Loading State */}
        {isSearchLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading components...</div>
          </div>
        )}

        {/* Error State */}
        {searchError && (
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Failed to load components</div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Grid */}
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

      {/* Component Replacement Modal */}
      {replacementModal.currentComponent && replacementModal.newComponent && (
        <ComponentReplacementModal
          isOpen={replacementModal.isOpen}
          onClose={handleComponentReplacementCancel}
          onReplace={handleComponentReplace}
          onCancel={handleComponentReplacementCancel}
          currentComponent={replacementModal.currentComponent}
          newComponent={replacementModal.newComponent}
          buildName={replacementModal.buildName}
        />
      )}
    </div>
  );
};

export default ComponentCatalog;
