// src/pages/BuildCartBuilder.tsx
import React, { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";
import { useSelectedUserId } from "../contexts/UserContext";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import { useCreateItem } from "../api/cart-item-controller/cart-item-controller";
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
        {(component && (!Array.isArray(component) || component.length > 0)) && (
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

const BuildCartBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const { currentCart } = useCart();
  const { data: allComponents } = useGetAllComponents();
  const createItemMutation = useCreateItem();

  // Build state
  const [currentBuild, setCurrentBuild] = useState<BuildSlots>({});
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 5000,
  });
  const [buildName, setBuildName] = useState("");

  const components = useMemo(() => allComponents?.data || [], [allComponents?.data]);

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
    },
    [components]
  );

  // Add build to cart
  const handleAddToCart = useCallback(async () => {
    if (!currentCart) {
      alert("Please select a cart first");
      return;
    }

    // Add each component to cart
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
              }
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
            }
          })
        );
      }
    });

    try {
      await Promise.all(addPromises);
      alert(`Build "${buildName || "Custom Build"}" added to cart!`);

      // Refresh cart data
      queryClient.invalidateQueries({ queryKey: ["getItemsByCart"] });
      queryClient.invalidateQueries({ queryKey: ["getUserCarts"] });
    } catch (error) {
      console.error("Failed to add build to cart:", error);
      alert("Failed to add build to cart. Please try again.");
    }
  }, [currentBuild, currentCart, createItemMutation, queryClient, buildName]);

  // Clear build
  const handleClearBuild = useCallback(() => {
    setCurrentBuild({});
    setBuildName("");
  }, []);

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">PC Build Cart Builder</h1>

        {/* Current cart info */}
        {currentCart ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Building for cart:{" "}
              <span className="font-semibold">{currentCart.name}</span>
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              No cart selected. Please select a cart in Cart Management first.
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
              type="text"
              value={buildName}
              onChange={(e) => setBuildName(e.target.value)}
              placeholder="Enter build name..."
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Templates */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3">Build Templates</h3>
            <div className="space-y-2">
              {BUILD_TEMPLATES.map((template) => (
                <div key={template.id} className="border rounded p-2">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {template.description}
                  </p>
                  <div className="text-xs text-gray-500 mb-2">
                    ${template.targetPrice.min} - ${template.targetPrice.max}
                  </div>
                  <button
                    onClick={() => handleApplyTemplate(template.id)}
                    className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Apply Template
                  </button>
                </div>
              ))}
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
                disabled={
                  !currentCart || Object.keys(currentBuild).length === 0
                }
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Build to Cart
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
        <div className="lg:col-span-3">
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
                      {issue.type === "error" ? "❌ Error" : "⚠️ Warning"}:{" "}
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

export default BuildCartBuilder;
