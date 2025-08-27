// src/components/PCBuilder/ComponentSlot.tsx
import React, { useState, useEffect } from "react";
import type { ComponentResponse } from "../../api/model";
import type { CompatibilityIssue } from "../../utils/compatibilityChecker";

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

  const renderComponent = () => {
    if (Array.isArray(component)) {
      return component.length > 0 ? (
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
      );
    } else if (component) {
      return (
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
      );
    } else {
      return (
        <div className="text-gray-500 text-sm mb-3">No {title} selected</div>
      );
    }
  };

  const renderIssues = () => {
    if (slotIssues.length === 0) return null;

    return (
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
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2"
        >
          {showSuggestions ? "Hide" : "Show"} Suggestions ({suggestions.length})
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
    );
  };

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

      {renderComponent()}
      {renderIssues()}
      {renderSuggestions()}
    </div>
  );
};

export default ComponentSlot;
