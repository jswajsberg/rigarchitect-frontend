// src/pages/PCBuilder/ComponentSlot.tsx - Enhanced with colorized Lucide icons
import React, { useState, useEffect } from "react";
import type { ComponentResponse } from "../../api/model";
import type { CompatibilityIssue } from "../../utils/compatibilityChecker";
import {
  Cpu, // CPU
  Monitor, // GPU
  HardDrive, // RAM
  Database, // SSD
  Archive, // HDD
  CircuitBoard, // Motherboard
  Zap, // PSU
  Box, // Case
  Wind, // Cooler
  ChevronDown, // Expand suggestions
  ChevronUp, // Collapse suggestions
  Plus, // Add component
  X, // Remove component
  AlertTriangle, // Warning
  AlertCircle, // Error
} from "lucide-react";

interface ComponentSlotProps {
  title: string;
  component: ComponentResponse | ComponentResponse[] | undefined;
  onSelect: (component: ComponentResponse) => void;
  onRemove: (componentId?: number) => void;
  suggestions: ComponentResponse[];
  issues: CompatibilityIssue[];
  highlight?: boolean; // For highlighting recommended components
}

const ComponentSlot: React.FC<ComponentSlotProps> = ({
  title,
  component,
  onSelect,
  onRemove,
  suggestions,
  issues,
  highlight = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wasFilledPreviously, setWasFilledPreviously] = useState(false);

  // Auto-show suggestions when slot becomes empty after being filled
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

  // Get component type icon configuration with colors
  const getComponentTypeIcon = (type: string) => {
    const iconConfig: {
      [key: string]: {
        icon: React.ComponentType<{ size?: number; className?: string }>;
        colorClass: string;
      };
    } = {
      CPU: { icon: Cpu, colorClass: "text-blue-600" },
      GPU: { icon: Monitor, colorClass: "text-purple-600" },
      RAM: { icon: HardDrive, colorClass: "text-green-600" },
      SSD: { icon: Database, colorClass: "text-cyan-600" },
      HDD: { icon: Archive, colorClass: "text-orange-600" },
      Motherboard: { icon: CircuitBoard, colorClass: "text-emerald-600" },
      PSU: { icon: Zap, colorClass: "text-yellow-600" },
      Case: { icon: Box, colorClass: "text-gray-600" },
      Cooler: { icon: Wind, colorClass: "text-sky-600" },
    };

    return iconConfig[type] || { icon: Cpu, colorClass: "text-gray-600" };
  };

  // Filter issues that affect this slot's components
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

  const iconConfig = getComponentTypeIcon(title);
  const IconComponent = iconConfig.icon;

  const renderComponent = () => {
    if (Array.isArray(component)) {
      return component.length > 0 ? (
        <div className="space-y-2">
          {component.map((comp, index) => (
            <div
              key={`${comp.id}-${index}`}
              className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <IconComponent size={20} className={iconConfig.colorClass} />
                <div>
                  <div className="font-medium text-sm">{comp.name}</div>
                  <div className="text-xs text-gray-600">
                    {comp.brand} - ${comp.price}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemove(comp.id)}
                className="p-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-500 text-sm mb-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
          <IconComponent size={20} className="text-gray-400" />
          <span>No {title} selected</span>
        </div>
      );
    } else if (component) {
      return (
        <div className="flex justify-between items-center mb-3 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-3">
            <IconComponent size={20} className={iconConfig.colorClass} />
            <div>
              <div className="font-medium text-sm">{component.name}</div>
              <div className="text-xs text-gray-600">
                {component.brand} - ${component.price}
              </div>
            </div>
          </div>
          <button
            onClick={() => onRemove()}
            className="p-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3 text-gray-500 text-sm mb-3 p-3 border-2 border-dashed border-gray-300 rounded-lg">
          <IconComponent size={20} className="text-gray-400" />
          <span>No {title} selected</span>
        </div>
      );
    }
  };

  const renderIssues = () => {
    if (slotIssues.length === 0) return null;

    return (
      <div className="mb-3 space-y-2">
        {slotIssues.map((issue, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs p-3 rounded-lg ${
              issue.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {issue.type === "error" ? (
              <AlertCircle size={14} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={14} className="flex-shrink-0" />
            )}
            <span>{issue.message}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-3 transition-colors"
        >
          {showSuggestions ? (
            <>
              <ChevronUp size={16} />
              Hide Suggestions
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show Suggestions ({suggestions.length})
            </>
          )}
        </button>

        {showSuggestions && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={18} className={iconConfig.colorClass} />
                  <div>
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">
                      {suggestion.brand} - ${suggestion.price}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSelect(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={12} />
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        hasError
          ? "border-red-300 bg-red-50"
          : hasWarning
          ? "border-yellow-300 bg-yellow-50"
          : highlight
          ? "border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200"
          : "border-gray-300 bg-white"
      }`}
    >
      {/* Enhanced slot header with icon */}
      <div className="flex items-center gap-3 mb-4">
        <IconComponent size={24} className={iconConfig.colorClass} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {highlight && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
            👆 Start Here
          </span>
        )}
      </div>

      {renderComponent()}
      {renderIssues()}
      {renderSuggestions()}
    </div>
  );
};

export default ComponentSlot;
