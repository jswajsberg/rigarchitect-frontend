// src/pages/PCBuilder.tsx - Modified to use BuildNameModal for new builds
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
import { useBuilder } from "../contexts/BuilderContext";
import BuildNameModal from "../modals/BuildNameModal";

// Component Slot Component (existing implementation remains the same)
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
  const [wasFilledPreviously, setWasFilledPreviously] = useState(false);

  useEffect(() => {
    const isEmpty =
      !component || (Array.isArray(component) && component.length === 0);
    const hasSuggestions = suggestions && suggestions.length > 0;

    if (!isEmpty) {
      setWasFilledPreviously(true);
      setShowSuggestions(false);
    } else if (isEmpty && wasFilledPreviously && hasSuggestions) {
      setShowSuggestions(true);
      setWasFilledPreviously(false);
    }
  }, [component, suggestions, wasFilledPreviously]);

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
      <h3 className="font-semibold mb-3 text-gray-900">{title}</h3>

      {/* Component display logic - keeping existing implementation */}
      {Array.isArray(component) ? (
        component.length > 0 ? (
          <div className="space-y-2">
            {component.map((comp, index) => (
              <div
                key={comp.id || index}
                className="flex justify-between items-center p-2 bg-gray-100 rounded"
              >
                <div>
                  <div className="font-medium text-sm">{comp.name}</div>
                  <div className="text-xs text-gray-600">
                    {comp.brand} - ${comp.price}
                  </div>
                </div>
                <button
                  onClick={() => onRemove()}
                  className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm mb-3">No {title} selected</div>
        )
      ) : component ? (
        <div className="flex justify-between items-center mb-3 p-2 bg-gray-100 rounded">
          <div>
            <div className="font-medium text-sm">{component.name}</div>
            <div className="text-xs text-gray-600">
              {component.brand} - ${component.price}
            </div>
          </div>
          <button
            onClick={onRemove}
            className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="text-gray-500 text-sm mb-3">No {title} selected</div>
      )}

      {/* Issues display */}
      {slotIssues.length > 0 && (
        <div className="mb-3">
          {slotIssues.map((issue, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded mb-1 ${
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

  // === Persistent builder state (from BuilderContext) ===
  const {
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
  } = useBuilder();

  // === Local UI-only state ===
  const [resetKey, setResetKey] = useState(0);
  const [showBuildNameModal, setShowBuildNameModal] = useState(false);

  // API mutations
  const createCartMutation = useCreateCartForUser();
  const updateCartMutation = useUpdateCart();
  const deleteCartMutation = useDeleteCart();
  const createCartItemMutation = useCreateCartItem();
  const deleteItemMutation = useDeleteItem();

  // Get saved builds (ACTIVE status)
  const { data: userCarts } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId },
  });

  const savedBuilds = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
    [userCarts]
  );

  const { data: selectedBuildItems } = useGetItemsByCart(selectedBuildId || 0, {
    query: { enabled: !!selectedBuildId },
  });

  const components = allComponents?.data || [];

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
            buildSlots[type] = (buildSlots[type] as ComponentResponse[]) || [];
            (buildSlots[type] as ComponentResponse[]).push(component);
          } else {
            buildSlots[type] = component;
          }
        }
      });

      setCurrentBuild(buildSlots);
    }
  }, [selectedBuildItems, allComponents, setCurrentBuild]);

  // Compatibility check
  const compatibility = useMemo(
    () => checkBuildCompatibility(currentBuild),
    [currentBuild]
  );

  // Component suggestions
  const suggestions = useMemo(() => {
    const result: Record<string, ComponentResponse[]> = {};
    const slots: (keyof BuildSlots)[] = [
      "CPU",
      "GPU",
      "Motherboard",
      "RAM",
      "SSD",
      "HDD",
      "PSU",
      "Case",
      "Cooler",
    ];

    slots.forEach((slot) => {
      const s = getComponentSuggestions(
        currentBuild,
        slot,
        components,
        priceRange
      );

      if (currentBuild[slot]) {
        if (Array.isArray(currentBuild[slot])) {
          const selectedIds = (currentBuild[slot] as ComponentResponse[]).map(
            (c) => c.id
          );
          result[slot] = s.filter((comp) => !selectedIds.includes(comp.id));
        } else {
          const selectedId = (currentBuild[slot] as ComponentResponse).id;
          result[slot] = s.filter((comp) => comp.id !== selectedId);
        }
      } else {
        result[slot] = s;
      }
    });

    return result;
  }, [currentBuild, components, priceRange]);

  // Component selection handlers
  const handleSelectComponent = useCallback(
    (slot: keyof BuildSlots, component: ComponentResponse) => {
      setCurrentBuild((prev) => {
        const newBuild = { ...prev };

        if (slot === "RAM" || slot === "SSD" || slot === "HDD") {
          const existing = (newBuild[slot] as ComponentResponse[]) || [];
          newBuild[slot] = [...existing, component];
        } else {
          newBuild[slot] = component;
        }

        return newBuild;
      });
    },
    [setCurrentBuild]
  );

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
    [setCurrentBuild]
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
    [
      components,
      setCurrentBuild,
      setPriceRange,
      setBuildName,
      setIsModifyingExisting,
      setSelectedBuildId,
    ]
  );

  // Save build (create new or update existing)
  const handleSaveBuild = useCallback(async () => {
    if (!buildName.trim()) {
      alert("Please enter a build name");
      return;
    }

    if (!selectedUserId) {
      alert("Please select a user first");
      return;
    }

    try {
      let targetBuildId: number;

      if (isModifyingExisting && selectedBuildId) {
        await updateCartMutation.mutateAsync({
          id: selectedBuildId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = selectedBuildId;

        if (selectedBuildItems?.data) {
          await Promise.all(
            selectedBuildItems.data.map((item) =>
              deleteItemMutation.mutateAsync({ id: item.id! })
            )
          );
        }
      } else {
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = newBuildResponse.data.id!;
        setSelectedBuildId(targetBuildId);
        setIsModifyingExisting(true);
      }

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
    setSelectedBuildId,
    setIsModifyingExisting,
  ]);

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
    [savedBuilds, setSelectedBuildId, setIsModifyingExisting, setBuildName]
  );

  // Delete build
  const handleDeleteBuild = useCallback(
    async (buildId: number, buildNameParam: string) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${buildNameParam}"? This action cannot be undone.`
      );
      if (!confirmDelete) return;

      try {
        await deleteCartMutation.mutateAsync({ id: buildId });

        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });

        if (selectedBuildId === buildId) {
          setSelectedBuildId(null);
          setCurrentBuild({});
          setBuildName("");
          setIsModifyingExisting(false);
        }

        alert(`Build "${buildNameParam}" deleted successfully.`);
      } catch (error: any) {
        console.error("Failed to delete build:", error);
        alert("Failed to delete build. Please try again.");
      }
    },
    [
      deleteCartMutation,
      queryClient,
      selectedUserId,
      selectedBuildId,
      setSelectedBuildId,
      setCurrentBuild,
      setBuildName,
      setIsModifyingExisting,
    ]
  );

  // Clear build
  const handleClearBuild = useCallback(() => {
    setCurrentBuild({});
    setBuildName("");
    setSelectedBuildId(null);
    setIsModifyingExisting(false);
    setResetKey((prev) => prev + 1);
  }, [
    setCurrentBuild,
    setBuildName,
    setSelectedBuildId,
    setIsModifyingExisting,
  ]);

  // MODIFIED: Create new build - now opens modal instead of clearing immediately
  const handleNewBuild = useCallback(() => {
    if (Object.keys(currentBuild).length > 0) {
      const confirmClear = window.confirm(
        "Are you sure you want to start a new build? Any unsaved changes will be lost."
      );
      if (!confirmClear) return;
    }

    // Open the build name modal
    setShowBuildNameModal(true);
  }, [currentBuild]);

  // NEW: Handle build name confirmation from modal
  const handleBuildNameConfirm = useCallback(
    async (newBuildName: string) => {
      if (!selectedUserId) {
        alert("Please select a user first");
        return;
      }

      try {
        // Create new empty build immediately
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: newBuildName, status: "ACTIVE" },
        });

        const newBuildId = newBuildResponse.data.id!;

        // Clear all build state and set up for new build
        setCurrentBuild({});
        setBuildName(newBuildName);
        setSelectedBuildId(newBuildId);
        setIsModifyingExisting(true);
        setResetKey((prev) => prev + 1);

        // Refresh builds list
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });

        alert(`New build "${newBuildName}" created successfully!`);
      } catch (error: any) {
        console.error("Failed to create new build:", error);
        alert(
          `Failed to create new build: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    [
      selectedUserId,
      createCartMutation,
      setCurrentBuild,
      setBuildName,
      setSelectedBuildId,
      setIsModifyingExisting,
      queryClient,
    ]
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

    if (!currentCart) {
      alert(
        "No shopping cart available. Please go to Shopping Cart to create one."
      );
      return;
    }

    try {
      const addPromises: Promise<unknown>[] = [];
      Object.values(currentBuild).forEach((component) => {
        if (Array.isArray(component)) {
          component.forEach((comp) => {
            addPromises.push(
              createItemMutation.mutateAsync({
                data: {
                  cartId: currentCart.id!,
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
                cartId: currentCart.id!,
                componentId: component.id!,
                quantity: 1,
              },
            })
          );
        }
      });

      await Promise.all(addPromises);
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart.id}`],
      });

      alert("Build components added to shopping cart!");
    } catch (error: any) {
      console.error("Failed to add build to cart:", error);
      alert("Failed to add build to cart. Please try again.");
    }
  }, [
    currentBuild,
    createItemMutation,
    queryClient,
    selectedUserId,
    currentCart,
  ]);

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
    <>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Templates and controls */}
          <div className="lg:col-span-1">
            {/* Build name - Now editable */}
            <div className="bg-white border rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium mb-2">
                Build Name
              </label>
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
                  buildName ? "Edit build name..." : "No build selected"
                }
                disabled={!buildName}
                className={`w-full p-2 border rounded ${
                  !buildName
                    ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                    : "bg-white"
                }`}
              />
              {isModifyingExisting && buildName && (
                <div className="text-xs text-blue-600 mt-1">
                  ✏️ Press Enter to save changes
                </div>
              )}
            </div>

            {/* Templates */}
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
                    {template.name} - ${template.targetPrice.min}-$
                    {template.targetPrice.max}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range filter */}
            <div className="bg-white border rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">Price Range Filter</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">
                    Min: ${priceRange.min}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        min: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">
                    Max: ${priceRange.max}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange((prev) => ({
                        ...prev,
                        max: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Build summary */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Build Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Price:</span>
                  <span className="font-semibold">
                    $
                    {Object.values(currentBuild)
                      .reduce((total, component) => {
                        if (Array.isArray(component)) {
                          return (
                            total +
                            component.reduce(
                              (sum, c) => sum + (c.price || 0),
                              0
                            )
                          );
                        } else if (component) {
                          return total + (component.price || 0);
                        }
                        return total;
                      }, 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Components:</span>
                  <span>
                    {Object.values(currentBuild).reduce((count, component) => {
                      if (Array.isArray(component)) {
                        return count + component.length;
                      } else if (component) {
                        return count + 1;
                      }
                      return count;
                    }, 0)}
                  </span>
                </div>
              </div>

              {/* Compatibility status */}
              <div className="mt-4 pt-4 border-t">
                <div
                  className={`text-sm font-medium ${
                    compatibility.isCompatible
                      ? "text-green-600"
                      : "text-red-600"
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

              {/* SSD Slot */}
              <ComponentSlot
                title="SSD"
                component={currentBuild.SSD}
                onSelect={(comp) => handleSelectComponent("SSD", comp)}
                onRemove={() => handleRemoveComponent("SSD")}
                suggestions={suggestions.SSD || []}
                issues={compatibility.issues}
              />

              {/* HDD Slot */}
              <ComponentSlot
                title="HDD"
                component={currentBuild.HDD}
                onSelect={(comp) => handleSelectComponent("HDD", comp)}
                onRemove={() => handleRemoveComponent("HDD")}
                suggestions={suggestions.HDD || []}
                issues={compatibility.issues}
              />

              {/* PSU Slot */}
              <ComponentSlot
                title="PSU"
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
                title="Cooler"
                component={currentBuild.Cooler}
                onSelect={(comp) => handleSelectComponent("Cooler", comp)}
                onRemove={() => handleRemoveComponent("Cooler")}
                suggestions={suggestions.Cooler || []}
                issues={compatibility.issues}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Build Name Modal */}
      <BuildNameModal
        isOpen={showBuildNameModal}
        onClose={() => setShowBuildNameModal(false)}
        onConfirm={handleBuildNameConfirm}
        title="Name Your New Build"
      />
    </>
  );
};

export default PCBuilder;
