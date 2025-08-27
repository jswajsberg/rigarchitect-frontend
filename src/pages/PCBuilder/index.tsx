// src/pages/PCBuilder.tsx - Modified to use BuildNameModal for new builds
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSelectedUserId } from "../../contexts/UserContext";
import { useGetAllComponents } from "../../api/component-controller/component-controller";
import { useCreateItem } from "../../api/cart-item-controller/cart-item-controller";
import {
  useGetUserCarts,
} from "../../api/build-cart-controller/build-cart-controller";
import {
  useGetItemsByCart,
} from "../../api/cart-item-controller/cart-item-controller";
import type { ComponentResponse, CartItemResponse } from "../../api/model";
import {
  checkBuildCompatibility,
  getComponentSuggestions,
  type BuildSlots,
} from "../../utils/compatibilityChecker";
import {
  BUILD_TEMPLATES,
  applyBuildTemplate,
  getBuildTemplate,
} from "../../utils/buildTemplates";
import { useBuilder } from "../../contexts/BuilderContext";
import BuildNameModal from "../../modals/BuildNameModal";
import ComponentSlot from "./ComponentSlot";
import { useBuildOperations } from "./hooks/useBuildOperations";


const PCBuilder: React.FC = () => {
  const selectedUserId = useSelectedUserId();
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

  // Use the extracted build operations hook
  const {
    handleSaveBuild,
    handleLoadBuild,
    handleDeleteBuild,
    handleClearBuild,
    handleBuildNameConfirm,
    handleAddToCart,
  } = useBuildOperations({
    selectedBuildItems,
    createItemMutation,
  });

  // Load components when build is selected
  useEffect(() => {
    if (selectedBuildItems?.data && allComponents?.data) {
      const buildSlots: BuildSlots = {};

      selectedBuildItems.data.forEach((item: CartItemResponse) => {
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


  // Create new build - now opens modal instead of clearing immediately
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
                      onClick={() => handleLoadBuild(build.id!, savedBuilds)}
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
                  onClick={() => {
                    handleClearBuild();
                    setResetKey((prev) => prev + 1);
                  }}
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
