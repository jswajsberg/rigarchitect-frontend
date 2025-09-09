/**
 * Component catalog page with search, filtering, and cart operations
 * @returns {JSX.Element} Component catalog with pagination and cart functionality
 */
import React, { useState, useMemo } from "react";
import { useSelectedUserId } from "../contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useBuilder } from "../contexts/BuilderContext";
import { useComponentCatalog } from "../contexts/ComponentCatalogContext";
import { useGuestCart } from "../services/GuestCartService";
import {
  useGetAllComponents,
  useGetComponentsByType,
  useGetAllComponentsPaged,
  useGetComponentsByTypePaged,
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
  GetAllComponentsPagedParams,
  GetComponentsByTypePagedParams,
} from "../api/model";
import ComponentCard from "../components/ComponentCard";
import SearchBar from "../components/SearchBar";
import QuantityModal from "../modals/QuantityModal";
import BuildSelectionModal from "../modals/BuildSelectionModal";
import ComponentReplacementModal from "../modals/ComponentReplacementModal";
import { determineSearchStrategy } from "../utils/searchStrategy";
import { useCart } from "../contexts/CartContext";

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
  const { isGuest } = useAuth();
  const { setCurrentBuild } = useBuilder();
  const guestCart = useGuestCart();

  // Get filter state from context
  const {
    catalogState: {
      searchTerm,
      showFilters,
      selectedType,
      filters,
      inStockOnly,
      currentPage,
      usePagination,
    },
    setSearchTerm,
    setShowFilters,
    setSelectedType,
    setFilters,
    setInStockOnly,
    setCurrentPage,
    setUsePagination,
    resetPagination,
    clearAllFilters,
  } = useComponentCatalog();



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

  // Pagination page size (not persisted)
  const pageSize = 12;

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

  // Pagination parameters
  const paginationParams: GetAllComponentsPagedParams = {
    searchTerm: searchTerm.trim() || undefined,
    brand: filters.brand.trim() || undefined,
    compatibilityTag: filters.compatibilityTag.trim() || undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    minStock: filters.minStock ? parseInt(filters.minStock) : undefined,
    inStockOnly: inStockOnly,
    page: currentPage,
    size: pageSize,
    sortBy: "name",
    sortDirection: "asc",
  };

  const typePaginationParams: GetComponentsByTypePagedParams = {
    searchTerm: searchTerm.trim() || undefined,
    brand: filters.brand.trim() || undefined,
    compatibilityTag: filters.compatibilityTag.trim() || undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    minStock: filters.minStock ? parseInt(filters.minStock) : undefined,
    inStockOnly: inStockOnly,
    page: currentPage,
    size: pageSize,
    sortBy: "name",
    sortDirection: "asc",
  };

  // Fetch all components (non-paginated - for backward compatibility)
  const {
    data: allComponents,
    isLoading: allComponentsLoading,
    error: allComponentsError,
    refetch: refetchAll,
  } = useGetAllComponents({
    query: { enabled: !usePagination },
  });

  // Fetch all components (paginated)
  const {
    data: allComponentsPaged,
    isLoading: allComponentsPagedLoading,
    error: allComponentsPagedError,
    refetch: refetchAllPaged,
  } = useGetAllComponentsPaged(paginationParams, {
    query: { enabled: usePagination && !selectedType },
  });


  // Fetch components of selected type (non-paginated)
  const { data: typeComponents, error: typeError } = useGetComponentsByType(
    selectedType as any,
    {
      query: { enabled: !usePagination && !!selectedType },
    }
  );

  // Fetch components of selected type (paginated)
  const {
    data: typeComponentsPaged,
    isLoading: typeComponentsPagedLoading,
    error: typeComponentsPagedError,
    refetch: refetchTypePaged,
  } = useGetComponentsByTypePaged(selectedType as any, typePaginationParams, {
    query: { enabled: usePagination && !!selectedType },
  });

  // Determine which data source to use
  const isLoading = usePagination
    ? selectedType
      ? typeComponentsPagedLoading
      : allComponentsPagedLoading
    : selectedType
    ? false
    : allComponentsLoading;

  const error = usePagination
    ? selectedType
      ? typeComponentsPagedError
      : allComponentsPagedError
    : selectedType
    ? typeError
    : allComponentsError;

  const refetch = usePagination
    ? selectedType
      ? refetchTypePaged
      : refetchAllPaged
    : selectedType
    ? () => {}
    : refetchAll;

  // Get current page data
  const currentPageData = usePagination
    ? selectedType
      ? typeComponentsPaged?.data
      : allComponentsPaged?.data
    : null;

  const paginationInfo = currentPageData
    ? {
        totalPages: currentPageData.totalPages || 0,
        currentPage: currentPageData.currentPage || 0,
        totalElements: currentPageData.totalElements || 0,
        hasNext: currentPageData.hasNext || false,
        hasPrevious: currentPageData.hasPrevious || false,
      }
    : null;

  // Search and filter logic
  const displayedComponents = useMemo(() => {
    let components: ComponentResponse[] = [];

    // Determine which components to use
    if (usePagination) {
      // Use paginated data
      if (selectedType && typeComponentsPaged?.data?.content) {
        components = typeComponentsPaged.data.content;
      } else if (allComponentsPaged?.data?.content) {
        components = allComponentsPaged.data.content;
      }
    } else {
      // Use non-paginated data
      if (selectedType && typeComponents?.data) {
        components = typeComponents.data;
      } else if (allComponents?.data) {
        components = allComponents.data;
      }
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const strategy = determineSearchStrategy(
        searchTerm,
        showFilters,
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
          component.compatibilityTag,
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
            .includes(filters.compatibilityTag.toLowerCase())
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
    showFilters,
    componentTypes,
    usePagination,
    allComponentsPaged,
    typeComponentsPaged,
  ]);

  const searchStrategy = searchTerm.trim()
    ? determineSearchStrategy(searchTerm, showFilters, filters, componentTypes)
    : null;

  // Loading states
  const isSearchLoading = isLoading;
  const searchErrorState = error;

  // Note: resetPagination is now provided by context

  // Handle pagination controls
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTogglePagination = () => {
    setUsePagination(!usePagination);
    resetPagination();
  };

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
    if (isGuest) {
      // For guest users, add directly to their current build
      const componentType = component.type;
      
      setCurrentBuild((prev) => {
        const newBuild = { ...prev };
        
        if (componentType === "RAM" || componentType === "SSD" || componentType === "HDD") {
          // For array-based components, add to existing array
          const existing = (newBuild[componentType as keyof typeof newBuild] as ComponentResponse[]) || [];
          newBuild[componentType as keyof typeof newBuild] = [...existing, component];
        } else {
          // For single components, replace existing
          newBuild[componentType as keyof typeof newBuild] = component;
        }
        
        console.log('DEBUG ComponentCatalog - Updated currentBuild:', newBuild, 'component added:', componentType, component.name);
        return newBuild;
      });
      
      showToast(`${component.name} added to your build!`, "success");
      return;
    }

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
    if (isGuest) {
      // For guest users, add to guest cart with quantity 1
      try {
        guestCart.addItem(component, 1);
        showToast(`${component.name} added to cart!`, "success");
        return;
      } catch (error) {
        console.error("Error adding to guest cart:", error);
        showToast("Failed to add item to cart", "error");
        return;
      }
    }

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

    // Show replacement modal if component conflicts exist
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
      // Find and remove the existing component
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

  // Note: clearAllFilters is now provided by context

  // Clear only advanced search filters without closing the section
  const clearAdvancedFilters = () => {
    setFilters({
      type: "",
      brand: "",
      compatibilityTag: "",
      maxPrice: "",
      minStock: "0",
    });
    setInStockOnly(false);
  };

  // SearchBar prop handlers
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    resetPagination();
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPagination();
  };

  const handleInStockOnlyChange = (value: boolean) => {
    setInStockOnly(value);
    resetPagination();
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
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          filters={filters}
          onFilterChange={handleFilterChange}
          inStockOnly={inStockOnly}
          onInStockOnlyChange={handleInStockOnlyChange}
          componentTypes={componentTypes}
          onClearAllFilters={clearAdvancedFilters}
          disabled={false}
        />
      </div>

      {/* Component Type Categories */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => {
              setSelectedType(null);
              resetPagination();
            }}
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
                onClick={() => {
                  setSelectedType(type.id);
                  resetPagination();
                }}
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

          {/* Pagination Toggle */}
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-600">Pagination:</span>
            <button
              onClick={handleTogglePagination}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                usePagination
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {usePagination ? "ON" : "OFF"}
            </button>
          </div>
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
        {searchErrorState && (
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
        {!isSearchLoading &&
          !searchErrorState &&
          displayedComponents.length > 0 && (
            <>
              {/* Results count and pagination info */}
              {usePagination && paginationInfo && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {(paginationInfo.currentPage || 0) * pageSize + 1} -{" "}
                  {Math.min(
                    ((paginationInfo.currentPage || 0) + 1) * pageSize,
                    paginationInfo.totalElements
                  )}{" "}
                  of {paginationInfo.totalElements} components
                </div>
              )}

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

              {/* Pagination Controls */}
              {usePagination &&
                paginationInfo &&
                paginationInfo.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() =>
                        handlePageChange(paginationInfo.currentPage - 1)
                      }
                      disabled={!paginationInfo.hasPrevious}
                      className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from(
                        { length: Math.min(5, paginationInfo.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (paginationInfo.totalPages <= 5) {
                            pageNum = i;
                          } else if (paginationInfo.currentPage <= 2) {
                            pageNum = i;
                          } else if (
                            paginationInfo.currentPage >=
                            paginationInfo.totalPages - 3
                          ) {
                            pageNum = paginationInfo.totalPages - 5 + i;
                          } else {
                            pageNum = paginationInfo.currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm border rounded-md ${
                                pageNum === paginationInfo.currentPage
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        handlePageChange(paginationInfo.currentPage + 1)
                      }
                      disabled={!paginationInfo.hasNext}
                      className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>

                    <div className="ml-4 text-sm text-gray-600">
                      Page {paginationInfo.currentPage + 1} of{" "}
                      {paginationInfo.totalPages}
                    </div>
                  </div>
                )}
            </>
          )}

        {/* No results state */}
        {!isSearchLoading &&
          !searchErrorState &&
          (searchTerm || showFilters || selectedType || inStockOnly) &&
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
          !showFilters &&
          !selectedType &&
          !inStockOnly &&
          !isLoading &&
          !error && (
            <div className="text-center py-8">
              <div className="text-gray-600">
                Use the search bar above or browse by component type to get
                started
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
