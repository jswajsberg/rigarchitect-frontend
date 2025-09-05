// src/modals/BuildNameModal.tsx
import React, { useState, useEffect } from "react";

interface BuildNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (buildName: string, priceRange?: { min: number; max: number }) => void;
  initialName?: string;
  title?: string;
  userBudget?: number;
  includePriceRange?: boolean;
}

const BuildNameModal: React.FC<BuildNameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = "",
  title = "Name Your Build",
  userBudget = 5000,
  includePriceRange = false,
}) => {
  const [buildName, setBuildName] = useState(initialName);
  const [error, setError] = useState<string>("");
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: userBudget,
  });

  // Update local state when initialName changes or modal opens
  useEffect(() => {
    setBuildName(initialName);
    setError("");
    setPriceRange({
      min: 0,
      max: userBudget,
    });
  }, [initialName, isOpen, userBudget]);

  // Focus input when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const input = document.getElementById("build-name-input");
      if (input) {
        input.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuildName(value);

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = buildName.trim();

    if (!trimmedName) {
      setError("Build name is required");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Build name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      setError("Build name cannot exceed 50 characters");
      return;
    }

    onConfirm(trimmedName, includePriceRange ? priceRange : undefined);
    handleClose();
  };

  const handleClose = () => {
    setBuildName(initialName);
    setError("");
    setPriceRange({
      min: 0,
      max: userBudget,
    });
    onClose();
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    setPriceRange(prev => {
      if (type === 'min') {
        return {
          ...prev,
          min: Math.min(value, prev.max - 50), // Ensure min is at least 50 less than max
        };
      } else {
        return {
          ...prev,
          max: Math.max(value, prev.min + 50), // Ensure max is at least 50 more than min
        };
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="build-name-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Build Name
            </label>
            <input
              id="build-name-input"
              type="text"
              value={buildName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter your build name..."
              maxLength={50}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <p className="mt-1 text-xs text-gray-500">
              {buildName.length}/50 characters
            </p>
          </div>

          {/* Price Range Section */}
          {includePriceRange && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Budget Range</h4>
              <div className="space-y-3">
                {/* Min Price */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Minimum Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="range"
                      min="0"
                      max={userBudget}
                      step="50"
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 min-w-16">
                      ${priceRange.min}
                    </span>
                  </div>
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Maximum Budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="range"
                      min="50"
                      max={userBudget}
                      step="50"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 min-w-16">
                      ${priceRange.max}
                    </span>
                  </div>
                </div>

                {/* Range visualization */}
                <div className="relative h-2 bg-gray-200 rounded">
                  <div
                    className="absolute h-2 bg-gradient-to-r from-blue-400 to-green-400 rounded"
                    style={{
                      left: `${(priceRange.min / userBudget) * 100}%`,
                      width: `${((priceRange.max - priceRange.min) / userBudget) * 100}%`,
                    }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>${userBudget}</span>
                </div>

                {/* Quick preset buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriceRange({ min: 0, max: Math.floor(userBudget * 0.4) })}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    Budget Build
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceRange({ 
                      min: Math.floor(userBudget * 0.2), 
                      max: Math.floor(userBudget * 0.7) 
                    })}
                    className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                  >
                    Mid-Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceRange({ 
                      min: Math.floor(userBudget * 0.5), 
                      max: userBudget 
                    })}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                  >
                    High-End
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Create Build
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildNameModal;
