// src/pages/PCBuilder/index.tsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSelectedUserId } from "../../contexts/UserContext";
import { useGetAllComponents } from "../../api/component-controller/component-controller";
import { useCreateItem } from "../../api/cart-item-controller/cart-item-controller";
import { useGetUserCarts } from "../../api/build-cart-controller/build-cart-controller";
import { useGetItemsByCart } from "../../api/cart-item-controller/cart-item-controller";
import { useAuth } from "../../contexts/AuthContext";
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
import {
  Target,
  Gamepad2,
  Video,
  Briefcase,
  Monitor,
  Package,
  DollarSign,
  Zap,
  Rocket,
  Crown,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PCBuilder: React.FC = () => {
  const selectedUserId = useSelectedUserId();
  const { data: allComponents } = useGetAllComponents();
  const createItemMutation = useCreateItem();
  const { user: authUser } = useAuth();

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
  const [showBuildNameModal, setShowBuildNameModal] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [userExplicitlyCleared, setUserExplicitlyCleared] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [missingComponentsInfo, setMissingComponentsInfo] = useState<any[]>([]);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
    handleClearBuild: originalHandleClearBuild,
    handleBuildNameConfirm,
    handleAddToCart,
  } = useBuildOperations({
    selectedBuildItems,
    createItemMutation,
  });

  // Wrapper for clear build that also sets the user explicitly cleared flag
  const handleClearBuild = useCallback(() => {
    originalHandleClearBuild();
    setUserExplicitlyCleared(true);
    setSelectedTemplateId(""); // Clear template selection when build is cleared
    setIsUsingTemplate(false); // Reset template flag
  }, [originalHandleClearBuild]);

  // Template scrolling functions
  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: -300, behavior: "smooth" });
    setTimeout(checkScrollButtons, 300);
  }, [checkScrollButtons]);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({ left: 300, behavior: "smooth" });
    setTimeout(checkScrollButtons, 300);
  }, [checkScrollButtons]);

  // Check scroll buttons on mount and when templates change
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [checkScrollButtons]);

  // Auto-select default build when builds are available
  useEffect(() => {
    if (
      selectedUserId &&
      savedBuilds.length > 0 &&
      !selectedBuildId &&
      !hasAutoSelected &&
      !userExplicitlyCleared
    ) {
      // Find the most recently updated build (or just the first one)
      const defaultBuild = savedBuilds.reduce((latest, current) => {
        if (!latest) return current;
        const latestDate = new Date(latest.updatedAt || latest.createdAt || 0);
        const currentDate = new Date(
          current.updatedAt || current.createdAt || 0
        );
        return currentDate > latestDate ? current : latest;
      });

      if (defaultBuild?.id) {
        handleLoadBuild(defaultBuild.id, savedBuilds);
        setHasAutoSelected(true);
      }
    }
  }, [
    selectedUserId,
    savedBuilds,
    selectedBuildId,
    hasAutoSelected,
    userExplicitlyCleared,
    handleLoadBuild,
  ]);

  // Reset auto-selection flag when user changes or when no builds are available
  useEffect(() => {
    if (!selectedUserId || savedBuilds.length === 0) {
      setHasAutoSelected(false);
      setUserExplicitlyCleared(false);
    }
  }, [selectedUserId, savedBuilds.length]);

  // Load components when build is selected (COMPLETELY DISABLED when using templates)
  useEffect(() => {
    // Skip entirely if using template - templates manage their own state
    if (isUsingTemplate) {
      return;
    }

    if (
      selectedBuildItems?.data &&
      allComponents?.data &&
      selectedBuildId &&
      !userExplicitlyCleared
    ) {
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
  }, [
    selectedBuildItems,
    allComponents,
    selectedBuildId,
    userExplicitlyCleared,
    isUsingTemplate,
    setCurrentBuild,
  ]);

  // Compatibility check
  const compatibility = useMemo(
    () => checkBuildCompatibility(currentBuild),
    [currentBuild]
  );

  // Calculate total price manually since it's not in BuildCompatibilityResult
  const totalPrice = useMemo(() => {
    return Object.values(currentBuild).reduce((total, component) => {
      if (Array.isArray(component)) {
        return total + component.reduce((sum, c) => sum + (c.price || 0), 0);
      } else if (component) {
        return total + (component.price || 0);
      }
      return total;
    }, 0);
  }, [currentBuild]);

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

      // Clear missing components info when user manually selects components
      setMissingComponentsInfo([]);
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

  // Apply template with simplified, atomic replacement
  const handleApplyTemplate = useCallback(
    (templateId: string) => {
      const template = getBuildTemplate(templateId);
      if (!template) return;

      // FIRST: Clear ALL state completely
      setCurrentBuild({});
      setSelectedBuildId(null);
      setIsModifyingExisting(false);
      setUserExplicitlyCleared(false);
      setIsUsingTemplate(true);

      // THEN: Apply the new template in next tick to ensure clean slate
      setTimeout(() => {
        const { suggestedBuild, missingComponents, budgetWarnings } =
          applyBuildTemplate(template, components);
        // Direct atomic replacement - create completely new object
        const cleanBuild: BuildSlots = {
          CPU: suggestedBuild.CPU || undefined,
          GPU: suggestedBuild.GPU || undefined,
          Motherboard: suggestedBuild.Motherboard || undefined,
          RAM: suggestedBuild.RAM ? [...suggestedBuild.RAM] : [], // Always fresh array
          PSU: suggestedBuild.PSU || undefined,
          SSD: suggestedBuild.SSD ? [...suggestedBuild.SSD] : [], // Always fresh array
          HDD: suggestedBuild.HDD ? [...suggestedBuild.HDD] : [], // Always fresh array
          Case: suggestedBuild.Case || undefined,
          Cooler: suggestedBuild.Cooler || undefined,
        };

        setCurrentBuild(cleanBuild);
        setPriceRange(template.targetPrice);
        // Ensure clean template name
        const cleanTemplateName = String(
          template.name || "Template Build"
        ).trim();
        setBuildName(cleanTemplateName);
        setSelectedTemplateId(templateId);

        // Store missing components for UI display
        setMissingComponentsInfo(missingComponents);

        // Log missing components for debugging
        if (missingComponents.length > 0) {
          console.log(
            `Template "${template.name}" missing components:`,
            missingComponents
          );
          missingComponents.forEach((missing) => {
            console.log(`- ${missing.componentType}: ${missing.details}`);
          });
        }

        // Log budget warnings
        if (budgetWarnings.length > 0) {
          console.log(
            `Template "${template.name}" budget warnings:`,
            budgetWarnings
          );
        }
      }, 0);
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

    // Clear template selection and open the build name modal
    setSelectedTemplateId("");
    setIsUsingTemplate(false); // Reset template flag
    setShowBuildNameModal(true);
  }, [currentBuild]);

  // Enhanced build loading with proper state management
  const handleEnhancedLoadBuild = useCallback(
    (buildId: number) => {
      // Find the build being loaded
      const buildToLoad = savedBuilds.find((b) => b.id === buildId);
      if (buildToLoad) {
        handleLoadBuild(buildId, savedBuilds);
        setSelectedTemplateId(""); // Clear template selection when loading a saved build
        setIsUsingTemplate(false); // Reset template flag when loading saved build
      }
    },
    [savedBuilds, handleLoadBuild]
  );

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

          {/* Build Loader with Enhanced Selection Display */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">
                {savedBuilds.length > 0
                  ? "Select Build:"
                  : "No saved builds available"}
              </label>

              {savedBuilds.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {savedBuilds.map((build) => (
                    <div key={build.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleEnhancedLoadBuild(build.id!)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          selectedBuildId === build.id
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {String(build.name || "Untitled Build").trim()}
                        {build.totalPrice ? (
                          <span className="ml-2 text-xs opacity-75">
                            ${build.totalPrice.toFixed(0)}
                          </span>
                        ) : null}
                      </button>

                      {selectedBuildId === build.id && (
                        <button
                          onClick={() =>
                            handleDeleteBuild(
                              build.id!,
                              build.name || "Untitled Build"
                            )
                          }
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                          title="Delete Build"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Create your first build using the "+ New Build" button
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Build Templates - Horizontal Scroll */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Build Templates
          </h3>
          <div className="relative group">
            {/* Left arrow button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}

            {/* Right arrow button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={checkScrollButtons}
            >
              {BUILD_TEMPLATES.map((template) => {
                const isSelected = selectedTemplateId === template.id;

                // Template category icons
                const getCategoryIcon = (category: string) => {
                  switch (category) {
                    case "budget":
                      return (
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      );
                    case "mid-range":
                      return <Zap className="w-3.5 h-3.5 text-yellow-600" />;
                    case "high-end":
                      return <Rocket className="w-3.5 h-3.5 text-orange-600" />;
                    case "enthusiast":
                      return <Crown className="w-3.5 h-3.5 text-purple-600" />;
                    default:
                      return <Monitor className="w-3.5 h-3.5 text-gray-600" />;
                  }
                };

                // Use case icons
                const getUseCaseIcon = (useCase: string[]) => {
                  if (useCase.includes("Gaming"))
                    return <Gamepad2 className="w-4 h-4 text-blue-600" />;
                  if (useCase.includes("Content Creation"))
                    return <Video className="w-4 h-4 text-red-600" />;
                  if (useCase.includes("Office Work"))
                    return <Briefcase className="w-4 h-4 text-gray-700" />;
                  if (useCase.includes("Streaming"))
                    return <Monitor className="w-4 h-4 text-purple-600" />;
                  if (useCase.includes("Compact"))
                    return <Package className="w-4 h-4 text-indigo-600" />;
                  return <Monitor className="w-4 h-4 text-gray-600" />;
                };

                return (
                  <div
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                    className={`flex-shrink-0 w-72 h-36 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between min-h-0">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 flex-shrink-0">
                          {getUseCaseIcon(template.useCase)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-1 truncate">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed overflow-hidden">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <div className="text-xs font-bold text-green-600 whitespace-nowrap">
                          ${template.targetPrice.min}-$
                          {template.targetPrice.max}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1 whitespace-nowrap">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Active
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getCategoryIcon(template.category)}
                        <span className="text-xs text-gray-500 capitalize truncate">
                          {template.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 justify-end ml-2 flex-shrink-0">
                        {template.useCase.slice(0, 2).map((useCase, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full whitespace-nowrap"
                          >
                            {useCase}
                          </span>
                        ))}
                        {template.useCase.length > 2 && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">
                            +{template.useCase.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Templates and Price Range */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Build Info */}
            {selectedBuildId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-blue-800 block">
                    Currently Editing:
                  </span>
                  <input
                    type="text"
                    value={String(buildName || "").trim()}
                    onChange={(e) => setBuildName(e.target.value.trim())}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && isModifyingExisting) {
                        handleSaveBuild();
                      }
                    }}
                    placeholder={
                      isModifyingExisting
                        ? "Edit build name..."
                        : "No build selected"
                    }
                    disabled={!buildName}
                    className={`w-full p-2 border rounded text-sm ${
                      !buildName
                        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  />
                  <div className="text-sm text-blue-700">
                    {Object.keys(currentBuild).length} components selected
                  </div>
                  {isModifyingExisting && buildName && (
                    <div className="text-xs text-blue-600">
                      ✏️ Press Enter to save changes or click "Update Build"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Price range filter */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Price Range Filter</h3>

              {/* Budget indicator */}
              {authUser?.budget && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Your Budget:</span>
                    <span className="font-semibold text-green-800">
                      ${authUser.budget.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Min Price Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-600">Min Price</label>
                    <span className="text-sm font-medium text-gray-800">
                      ${priceRange.min}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={authUser?.budget || 5000}
                    step="25"
                    value={priceRange.min}
                    onChange={(e) => {
                      const newMin = parseInt(e.target.value);
                      const clampedMin = Math.min(newMin, priceRange.max - 50);
                      setPriceRange((prev) => ({
                        ...prev,
                        min: Math.max(0, clampedMin),
                      }));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$0</span>
                    <span>${authUser?.budget?.toFixed(0) || "5000"}</span>
                  </div>
                </div>

                {/* Max Price Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-gray-600">Max Price</label>
                    <span className="text-sm font-medium text-gray-800">
                      ${priceRange.max}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={authUser?.budget || 5000}
                    step="25"
                    value={priceRange.max}
                    onChange={(e) => {
                      const newMax = parseInt(e.target.value);
                      const userBudget = authUser?.budget || 5000;
                      const clampedMax = Math.max(newMax, priceRange.min + 50);
                      setPriceRange((prev) => ({
                        ...prev,
                        max: Math.min(userBudget, clampedMax),
                      }));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>$0</span>
                    <span>${authUser?.budget?.toFixed(0) || "5000"}</span>
                  </div>
                </div>

                {/* Range indicator bar */}
                <div className="relative h-2 bg-gray-200 rounded">
                  <div
                    className="absolute h-2 bg-gradient-to-r from-blue-400 to-green-400 rounded"
                    style={{
                      left: `${
                        (priceRange.min / (authUser?.budget || 5000)) * 100
                      }%`,
                      width: `${
                        ((priceRange.max - priceRange.min) /
                          (authUser?.budget || 5000)) *
                        100
                      }%`,
                    }}
                  />
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <button
                    onClick={() => {
                      const budget = authUser?.budget || 5000;
                      setPriceRange({ min: 0, max: Math.floor(budget * 0.3) });
                    }}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    Budget
                  </button>
                  <button
                    onClick={() => {
                      const budget = authUser?.budget || 5000;
                      setPriceRange({
                        min: Math.floor(budget * 0.2),
                        max: Math.floor(budget * 0.7),
                      });
                    }}
                    className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                  >
                    Mid-Range
                  </button>
                  <button
                    onClick={() => {
                      const budget = authUser?.budget || 5000;
                      setPriceRange({
                        min: Math.floor(budget * 0.5),
                        max: budget,
                      });
                    }}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                  >
                    Premium
                  </button>
                </div>
              </div>
            </div>

            {/* Build Actions and Total */}
            {Object.keys(currentBuild).length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <div className="space-y-4">
                  {/* Total Price and Power Info */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      Total: ${totalPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Power: {compatibility.powerConsumption.total}W total,{" "}
                      {compatibility.powerConsumption.recommended}W recommended
                      PSU
                    </div>
                  </div>

                  {/* Build Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={handleClearBuild}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Clear Build
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right main content - Build Summary */}
          <div className="lg:col-span-3">
            {/* Build Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Build Summary</h2>
              </div>

              {/* Compatibility Status */}
              {compatibility.issues.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Compatibility Issues
                  </h3>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {compatibility.issues.map((issue, index) => (
                      <li key={index}>• {issue.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Components Alert */}
              {missingComponentsInfo.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Some Components Couldn't Be Auto-Selected
                      </h3>
                      <div className="space-y-2">
                        {missingComponentsInfo.map((missing, index) => (
                          <div
                            key={index}
                            className="bg-white rounded border border-amber-200 p-3"
                          >
                            <div className="font-medium text-amber-800 mb-1">
                              {missing.componentType}
                            </div>
                            <div className="text-sm text-amber-700 mb-2">
                              {missing.details}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-amber-700">
                        <Info className="w-4 h-4 inline mr-1" />
                        Please manually select these components from the
                        dropdown suggestions below.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Component Slots Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                  onSelect={(comp) =>
                    handleSelectComponent("Motherboard", comp)
                  }
                  onRemove={() => handleRemoveComponent("Motherboard")}
                  suggestions={suggestions.Motherboard || []}
                  issues={compatibility.issues}
                />

                {/* RAM Slot - Fixed with proper array handling */}
                <ComponentSlot
                  title="RAM"
                  component={currentBuild.RAM}
                  onSelect={(comp) => handleSelectComponent("RAM", comp)}
                  onRemove={() => handleRemoveComponent("RAM")}
                  suggestions={suggestions.RAM || []}
                  issues={compatibility.issues}
                />

                {/* SSD Slot - Fixed with proper array handling */}
                <ComponentSlot
                  title="SSD"
                  component={currentBuild.SSD}
                  onSelect={(comp) => handleSelectComponent("SSD", comp)}
                  onRemove={() => handleRemoveComponent("SSD")}
                  suggestions={suggestions.SSD || []}
                  issues={compatibility.issues}
                />

                {/* HDD Slot - Fixed with proper array handling */}
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
