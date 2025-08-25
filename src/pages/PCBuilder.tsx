// src/pages/PCBuilder.tsx - Unified PC Builder with build loader
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";
import { useSelectedUserId } from "../contexts/UserContext";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import { useCreateItem } from "../api/cart-item-controller/cart-item-controller";
import {
  useGetUserCarts,
  useCreateCartForUser,
  useUpdateCart,
  useDeleteCart,
} from "../api/build-cart-controller/build-cart-controller";
import {
  useGetItemsByCart,
  useCreateItem as useCreateCartItem,
  useDeleteItem,
} from "../api/cart-item-controller/cart-item-controller";
import type { ComponentResponse } from "../api/model";
import {
  checkBuildCompatibility,
  getComponentSuggestions,
  type BuildSlots,
  type CompatibilityIssue,
} from "../utils/compatibilityChecker";
import {
  BUILD_TEMPLATES,
  applyBuildTemplate,
  getBuildTemplate,
} from "../utils/buildTemplates";

// Component Slot Component
interface ComponentSlotProps {
  title: string;
  component: ComponentResponse | ComponentResponse[] | undefined;
  onSelect: (component: ComponentResponse) => void;
  onRemove: () => void;
  suggestions: ComponentResponse[];
  issues: CompatibilityIssue[];
}

const ComponentSlot: React.FC<ComponentSlotProps> = ({
  title,
  component,
  onSelect,
  onRemove,
  suggestions,
  issues,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const slotIssues = issues.filter((issue) =>
    issue.affectedComponents.some((comp) => {
      if (Array.isArray(component)) {
        return component.some((c) => c.name === comp);
      } else if (component) {
        return component.name === comp;
      }
      return false;
    })
  );

  const hasError = slotIssues.some((issue) => issue.type === "error");
  const hasWarning = slotIssues.some((issue) => issue.type === "warning");

  return (
    <div
      className={`border rounded-lg p-4 ${
        hasError
          ? "border-red-300 bg-red-50"
          : hasWarning
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-300 bg-white"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {component && (!Array.isArray(component) || component.length > 0) && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* Display current component(s) */}
      {Array.isArray(component) && component.length > 0 ? (
        <div className="space-y-2 mb-3">
          {component.map((comp, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <div>
                <div className="font-medium">{comp.name}</div>
                <div className="text-sm text-gray-600">
                  {comp.brand} - ${comp.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : component && !Array.isArray(component) ? (
        <div className="flex justify-between items-center p-2 bg-gray-100 rounded mb-3">
          <div>
            <div className="font-medium">{component.name}</div>
            <div className="text-sm text-gray-600">
              {component.brand} - ${component.price}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 italic mb-3">
          No {title.toLowerCase()} selected
        </div>
      )}

      {/* Display compatibility issues */}
      {slotIssues.length > 0 && (
        <div className="mb-3 space-y-1">
          {slotIssues.map((issue, index) => (
            <div
              key={index}
              className={`text-sm p-2 rounded ${
                issue.type === "error"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {issue.type === "error" ? "❌" : "⚠️"} {issue.message}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2"
          >
            {showSuggestions ? "Hide" : "Show"} Suggestions (
            {suggestions.length})
          </button>

          {showSuggestions && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">
                      {suggestion.brand} - ${suggestion.price}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelect(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PCBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const { currentCart } = useCart();
  const { data: allComponents } = useGetAllComponents();
  const createItemMutation = useCreateItem();

  // Build management state
  const [selectedBuildId, setSelectedBuildId] = useState<number | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Build state
  const [currentBuild, setCurrentBuild] = useState<BuildSlots>({});
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 5000,
  });
  const [buildName, setBuildName] = useState("");
  const [isModifyingExisting, setIsModifyingExisting] = useState(false);

  // Get saved builds (ACTIVE status)
  const { data: userCarts, isLoading: cartsLoading } = useGetUserCarts(
    selectedUserId || 0,
    {
      query: { enabled: !!selectedUserId },
    }
  );

  const savedBuilds = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
    [userCarts]
  );

  // Get items for selected build when loading
  const selectedBuild = useMemo(
    () => savedBuilds.find((build) => build.id === selectedBuildId),
    [savedBuilds, selectedBuildId]
  );

  const { data: selectedBuildItems } = useGetItemsByCart(selectedBuildId || 0, {
    query: { enabled: !!selectedBuildId },
  });

  // Mutations
  const createCartMutation = useCreateCartForUser();
  const updateCartMutation = useUpdateCart();
  const deleteCartMutation = useDeleteCart();
  const createCartItemMutation = useCreateCartItem();
  const deleteItemMutation = useDeleteItem();

  const components = useMemo(
    () => allComponents?.data || [],
    [allComponents?.data]
  );

  // Calculate compatibility
  const compatibility = useMemo(
    () => checkBuildCompatibility(currentBuild),
    [currentBuild]
  );

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    Object.values(currentBuild).forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((comp) => {
          total += Number(comp.price) || 0;
        });
      } else if (component) {
        total += Number(component.price) || 0;
      }
    });
    return total;
  }, [currentBuild]);

  // Component suggestions for each slot
  const suggestions = useMemo(() => {
    const result: Partial<Record<keyof BuildSlots, ComponentResponse[]>> = {};

    const allSlots: (keyof BuildSlots)[] = [
      "CPU",
      "GPU",
      "Motherboard",
      "RAM",
      "PSU",
      "Case",
      "Cooler",
      "SSD",
      "HDD",
    ];

    allSlots.forEach((slot) => {
      if (
        !currentBuild[slot] ||
        (Array.isArray(currentBuild[slot]) &&
          (currentBuild[slot] as ComponentResponse[]).length === 0)
      ) {
        result[slot] = getComponentSuggestions(
          currentBuild,
          slot,
          components,
          priceRange
        );
      }
    });

    return result;
  }, [currentBuild, components, priceRange]);

  // Load build into builder
  const handleLoadBuild = useCallback(
    (buildId: number) => {
      setSelectedBuildId(buildId);
      setIsModifyingExisting(true);

      const build = savedBuilds.find((b) => b.id === buildId);
      if (build) {
        setBuildName(build.name || "");
      }
    },
    [savedBuilds]
  );

  // Load components when build is selected
  useEffect(() => {
    if (selectedBuildItems?.data && allComponents?.data) {
      const buildSlots: BuildSlots = {};

      selectedBuildItems.data.forEach((item) => {
        const component = allComponents.data.find(
          (c: ComponentResponse) => c.id === item.componentId
        );

        if (component) {
          const type = component.type as keyof BuildSlots;

          if (type === "RAM" || type === "SSD" || type === "HDD") {
            // Multiple component slots
            if (!buildSlots[type]) {
              buildSlots[type] = [];
            }
            // Add quantity support - repeat component for each quantity
            for (let i = 0; i < (item.quantity || 1); i++) {
              (buildSlots[type] as ComponentResponse[]).push(component);
            }
          } else {
            // Single component slots
            buildSlots[type] = component;
          }
        }
      });

      setCurrentBuild(buildSlots);
    }
  }, [selectedBuildItems, allComponents]);

  // Handle component selection
  const handleSelectComponent = useCallback(
    (slot: keyof BuildSlots, component: ComponentResponse) => {
      setCurrentBuild((prev) => {
        const newBuild = { ...prev };

        if (slot === "RAM" || slot === "SSD" || slot === "HDD") {
          // Multiple component slots
          if (!newBuild[slot]) {
            newBuild[slot] = [component] as ComponentResponse[];
          } else {
            const existing = newBuild[slot] as ComponentResponse[];
            if (!existing.find((c) => c.id === component.id)) {
              newBuild[slot] = [...existing, component] as ComponentResponse[];
            }
          }
        } else {
          // Single component slots
          newBuild[slot] = component;
        }

        return newBuild;
      });
    },
    []
  );

  // Handle component removal
  const handleRemoveComponent = useCallback(
    (slot: keyof BuildSlots, componentId?: number) => {
      setCurrentBuild((prev) => {
        const newBuild = { ...prev };

        if (slot === "RAM" || slot === "SSD" || slot === "HDD") {
          if (componentId) {
            const existing = (newBuild[slot] as ComponentResponse[]) || [];
            const filtered = existing.filter((c) => c.id !== componentId);
            if (filtered.length === 0) {
              delete newBuild[slot];
            } else {
              newBuild[slot] = filtered;
            }
          } else {
            delete newBuild[slot];
          }
        } else {
          delete newBuild[slot];
        }

        return newBuild;
      });
    },
    []
  );

  // Apply template
  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = getBuildTemplate(templateId);
      if (!template) return;

      const { suggestedBuild } = applyBuildTemplate(template, components);
      setCurrentBuild(suggestedBuild);
      setPriceRange(template.targetPrice);
      setBuildName(template.name);
      setIsModifyingExisting(false);
      setSelectedBuildId(null);
    },
    [components]
  );

  // Save build (create new or update existing) - Modified to allow empty builds
  const handleSaveBuild = useCallback(async () => {
    if (!buildName.trim()) {
      alert("Please enter a build name");
      return;
    }

    if (!selectedUserId) {
      alert("Please select a user first");
      return;
    }

    // Removed the check for empty builds - now allows saving empty builds

    try {
      let targetBuildId: number;

      if (isModifyingExisting && selectedBuildId) {
        // Update existing build
        await updateCartMutation.mutateAsync({
          id: selectedBuildId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = selectedBuildId;

        // Clear existing items first
        if (selectedBuildItems?.data) {
          await Promise.all(
            selectedBuildItems.data.map((item) =>
              deleteItemMutation.mutateAsync({ id: item.id! })
            )
          );
        }
      } else {
        // Create new build
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = newBuildResponse.data.id!;
        setSelectedBuildId(targetBuildId);
        setIsModifyingExisting(true);
      }

      // Add all components to the build (if any exist)
      const addPromises: Promise<unknown>[] = [];
      let componentCount = 0;

      Object.values(currentBuild).forEach((component) => {
        if (Array.isArray(component)) {
          component.forEach((comp) => {
            componentCount++;
            addPromises.push(
              createCartItemMutation.mutateAsync({
                data: {
                  cartId: targetBuildId,
                  componentId: comp.id!,
                  quantity: 1,
                },
              })
            );
          });
        } else if (component) {
          componentCount++;
          addPromises.push(
            createCartItemMutation.mutateAsync({
              data: {
                cartId: targetBuildId,
                componentId: component.id!,
                quantity: 1,
              },
            })
          );
        }
      });

      if (componentCount > 0) {
        await Promise.all(addPromises);
      }

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetBuildId}`],
      });

      const buildType =
        componentCount > 0
          ? `with ${componentCount} components`
          : "(empty build)";
      alert(`Build "${buildName}" saved successfully ${buildType}!`);
    } catch (error: any) {
      console.error("Failed to save build:", error);
      alert(
        `Failed to save build: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }, [
    buildName,
    selectedUserId,
    currentBuild,
    isModifyingExisting,
    selectedBuildId,
    selectedBuildItems,
    updateCartMutation,
    createCartMutation,
    deleteItemMutation,
    createCartItemMutation,
    queryClient,
  ]);

  // Delete build
  const handleDeleteBuild = useCallback(
    async (buildId: number, buildName: string) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${buildName}"? This action cannot be undone.`
      );
      if (!confirmDelete) return;

      try {
        await deleteCartMutation.mutateAsync({ id: buildId });

        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });

        // If we deleted the currently loaded build, clear the builder
        if (selectedBuildId === buildId) {
          setSelectedBuildId(null);
          setCurrentBuild({});
          setBuildName("");
          setIsModifyingExisting(false);
        }

        alert(`Build "${buildName}" deleted successfully.`);
      } catch (error: any) {
        console.error("Failed to delete build:", error);
        alert("Failed to delete build. Please try again.");
      }
    },
    [deleteCartMutation, queryClient, selectedUserId, selectedBuildId]
  );

  // Add build to shopping cart
  const handleAddToCart = useCallback(async () => {
    if (!selectedUserId) {
      alert("Please select a user first.");
      return;
    }

    if (Object.keys(currentBuild).length === 0) {
      alert("Build is empty. Add some components first.");
      return;
    }

    try {
      // Find or create DRAFT cart (shopping cart)
      let shoppingCart = userCarts?.data?.find(
        (cart) => cart.status === "DRAFT"
      );

      if (!shoppingCart) {
        // Create shopping cart if it doesn't exist
        const newCartResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: "Shopping Cart", status: "DRAFT" },
        });
        shoppingCart = newCartResponse.data;

        // Refresh cart data to include new shopping cart
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });
      }

      // Add each component to shopping cart
      const addPromises: Promise<unknown>[] = [];

      Object.values(currentBuild).forEach((component) => {
        if (Array.isArray(component)) {
          component.forEach((comp) => {
            addPromises.push(
              createItemMutation.mutateAsync({
                data: {
                  cartId: shoppingCart!.id!,
                  componentId: comp.id!,
                  quantity: 1,
                },
              })
            );
          });
        } else if (component) {
          addPromises.push(
            createItemMutation.mutateAsync({
              data: {
                cartId: shoppingCart!.id!,
                componentId: component.id!,
                quantity: 1,
              },
            })
          );
        }
      });

      await Promise.all(addPromises);
      alert(`Build "${buildName || "Custom Build"}" added to shopping cart!`);

      // Refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${shoppingCart.id}`],
      });
    } catch (error) {
      console.error("Failed to add build to cart:", error);
      alert("Failed to add build to cart. Please try again.");
    }
  }, [
    currentBuild,
    createItemMutation,
    createCartMutation,
    queryClient,
    buildName,
    selectedUserId,
    userCarts,
  ]);

  // Clear build
  const handleClearBuild = useCallback(() => {
    setCurrentBuild({});
    setBuildName("");
    setSelectedBuildId(null);
    setIsModifyingExisting(false);
    setResetKey((prev) => prev + 1);
  }, []);

  // Create new build
  const handleNewBuild = useCallback(() => {
    if (Object.keys(currentBuild).length > 0) {
      const confirmClear = window.confirm(
        "Are you sure you want to start a new build? Any unsaved changes will be lost."
      );
      if (!confirmClear) return;
    }

    // Clear all build state immediately
    setCurrentBuild({});
    setBuildName("");
    setSelectedBuildId(null);
    setIsModifyingExisting(false);
    setResetKey((prev) => prev + 1);
  }, [currentBuild]);

  if (!selectedUserId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">No User Selected</h3>
          <p className="text-yellow-600">Please select a user to build a PC.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Build Loader */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">PC Builder</h1>
            <p className="text-gray-600">
              Create new builds, load existing ones, or apply templates
            </p>
          </div>

          {/* Build Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleNewBuild}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Build
            </button>
            {Object.keys(currentBuild).length > 0 && (
              <button
                onClick={handleSaveBuild}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                {isModifyingExisting ? "Update Build" : "Save Build"}
              </button>
            )}
          </div>
        </div>

        {/* Build Loader */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">
              Load Existing Build:
            </label>

            <div className="flex gap-2 flex-wrap">
              {savedBuilds.map((build) => (
                <div key={build.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadBuild(build.id!)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      selectedBuildId === build.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {build.name} (${build.totalPrice?.toFixed(2) || "0.00"})
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteBuild(
                        build.id!,
                        build.name || "Unnamed Build"
                      )
                    }
                    className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                    title="Delete build"
                  >
                    🗑️
                  </button>
                </div>
              ))}

              {savedBuilds.length === 0 && (
                <span className="text-sm text-gray-500 italic">
                  No saved builds yet
                </span>
              )}
            </div>
          </div>

          {selectedBuild && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-blue-600">
                📝 Currently editing: <strong>{selectedBuild.name}</strong>
                {cartsLoading && (
                  <span className="ml-2 text-gray-500">
                    Loading components...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current cart info */}
        {currentCart ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Shopping cart active:{" "}
              <span className="font-semibold">{currentCart.name}</span>
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              No shopping cart available. Components will be added when you go
              to Shopping Cart.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Templates and controls */}
        <div className="lg:col-span-1">
          {/* Build name */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium mb-2">Build Name</label>
            <input
              key={`build-name-${resetKey}`}
              type="text"
              value={buildName}
              onChange={(e) => setBuildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && buildName.trim()) {
                  handleSaveBuild();
                }
              }}
              placeholder={
                isModifyingExisting
                  ? "Editing existing build..."
                  : "Enter build name and press Enter to save..."
              }
              className="w-full p-2 border rounded"
            />
            {isModifyingExisting && (
              <div className="text-xs text-blue-600 mt-1">
                ✏️ Editing existing build
              </div>
            )}
            {!isModifyingExisting &&
              buildName === "" &&
              Object.keys(currentBuild).length === 0 && (
                <div className="text-xs text-green-600 mt-1">
                  🆕 Ready for new build - press Enter to save
                </div>
              )}
          </div>

          {/* Templates - Compact dropdown version */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Build Templates</h3>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleApplyTemplate(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full p-2 border rounded text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select a template...
              </option>
              {BUILD_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} (${template.targetPrice.min}-$
                  {template.targetPrice.max}) - {template.category}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-2">
              Templates will auto-select compatible components from your
              inventory
            </div>
          </div>

          {/* Price range */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Budget Range</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs">Min: ${priceRange.min}</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      min: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs">Max: ${priceRange.max}</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      max: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Build summary */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Build Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Price:</span>
                <span className="font-semibold">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Components:</span>
                <span>{Object.keys(currentBuild).length}/9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Power Draw:</span>
                <span>{compatibility.powerConsumption.total}W</span>
              </div>
              <div
                className={`text-sm font-semibold ${
                  compatibility.isCompatible ? "text-green-600" : "text-red-600"
                }`}
              >
                {compatibility.isCompatible
                  ? "✅ Compatible"
                  : "❌ Issues Found"}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleAddToCart}
                disabled={Object.keys(currentBuild).length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add to Shopping Cart
              </button>
              <button
                onClick={handleSaveBuild}
                disabled={!buildName.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isModifyingExisting ? "Update Build" : "Save Build"}
              </button>
              <button
                onClick={handleClearBuild}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Build
              </button>
            </div>
          </div>
        </div>

        {/* Main content - Component slots */}
        <div className="lg:col-span-3" key={`component-slots-${resetKey}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU Slot */}
            <ComponentSlot
              title="CPU"
              component={currentBuild.CPU}
              onSelect={(comp) => handleSelectComponent("CPU", comp)}
              onRemove={() => handleRemoveComponent("CPU")}
              suggestions={suggestions.CPU || []}
              issues={compatibility.issues}
            />

            {/* GPU Slot */}
            <ComponentSlot
              title="GPU"
              component={currentBuild.GPU}
              onSelect={(comp) => handleSelectComponent("GPU", comp)}
              onRemove={() => handleRemoveComponent("GPU")}
              suggestions={suggestions.GPU || []}
              issues={compatibility.issues}
            />

            {/* Motherboard Slot */}
            <ComponentSlot
              title="Motherboard"
              component={currentBuild.Motherboard}
              onSelect={(comp) => handleSelectComponent("Motherboard", comp)}
              onRemove={() => handleRemoveComponent("Motherboard")}
              suggestions={suggestions.Motherboard || []}
              issues={compatibility.issues}
            />

            {/* RAM Slot */}
            <ComponentSlot
              title="RAM"
              component={currentBuild.RAM}
              onSelect={(comp) => handleSelectComponent("RAM", comp)}
              onRemove={() => handleRemoveComponent("RAM")}
              suggestions={suggestions.RAM || []}
              issues={compatibility.issues}
            />

            {/* PSU Slot */}
            <ComponentSlot
              title="Power Supply"
              component={currentBuild.PSU}
              onSelect={(comp) => handleSelectComponent("PSU", comp)}
              onRemove={() => handleRemoveComponent("PSU")}
              suggestions={suggestions.PSU || []}
              issues={compatibility.issues}
            />

            {/* Case Slot */}
            <ComponentSlot
              title="Case"
              component={currentBuild.Case}
              onSelect={(comp) => handleSelectComponent("Case", comp)}
              onRemove={() => handleRemoveComponent("Case")}
              suggestions={suggestions.Case || []}
              issues={compatibility.issues}
            />

            {/* Cooler Slot */}
            <ComponentSlot
              title="CPU Cooler"
              component={currentBuild.Cooler}
              onSelect={(comp) => handleSelectComponent("Cooler", comp)}
              onRemove={() => handleRemoveComponent("Cooler")}
              suggestions={suggestions.Cooler || []}
              issues={compatibility.issues}
            />

            {/* Storage Slots */}
            <ComponentSlot
              title="SSD Storage"
              component={currentBuild.SSD}
              onSelect={(comp) => handleSelectComponent("SSD", comp)}
              onRemove={() => handleRemoveComponent("SSD")}
              suggestions={suggestions.SSD || []}
              issues={compatibility.issues}
            />

            <ComponentSlot
              title="HDD Storage"
              component={currentBuild.HDD}
              onSelect={(comp) => handleSelectComponent("HDD", comp)}
              onRemove={() => handleRemoveComponent("HDD")}
              suggestions={suggestions.HDD || []}
              issues={compatibility.issues}
            />
          </div>

          {/* Compatibility issues summary */}
          {compatibility.issues.length > 0 && (
            <div className="mt-6 bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Compatibility Issues</h3>
              <div className="space-y-2">
                {compatibility.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded ${
                      issue.type === "error"
                        ? "bg-red-100 border border-red-300"
                        : "bg-yellow-100 border border-yellow-300"
                    }`}
                  >
                    <div
                      className={`font-medium ${
                        issue.type === "error"
                          ? "text-red-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {issue.type === "error" ? "Error" : "Warning"}:{" "}
                      {issue.category.toUpperCase()}
                    </div>
                    <div
                      className={
                        issue.type === "error"
                          ? "text-red-700"
                          : "text-yellow-700"
                      }
                    >
                      {issue.message}
                    </div>
                    {issue.affectedComponents.length > 0 && (
                      <div className="text-sm mt-1 opacity-75">
                        Affected: {issue.affectedComponents.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCBuilder;
