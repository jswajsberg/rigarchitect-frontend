/**
 * Modal for selecting multiple builds to add a component to with quantity control
 */
import React, { useState } from "react";
import type { ComponentResponse, BuildCartResponse } from "../api/model";

interface BuildSelectionModalProps {
  component: ComponentResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedBuildIds: number[], quantity: number) => void;
  availableBuilds: BuildCartResponse[];
  isLoading?: boolean;
}

/**
 * Modal for selecting builds to add a component to with multi-selection and quantity control
 * @param {BuildSelectionModalProps} props - Modal props with component data and build list
 * @returns {JSX.Element | null} Build selection modal or null if closed
 */
const BuildSelectionModal: React.FC<BuildSelectionModalProps> = ({
  component,
  isOpen,
  onClose,
  onConfirm,
  availableBuilds,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedBuildIds, setSelectedBuildIds] = useState<number[]>([]);

  if (!isOpen || !component) return null;

  const maxStock = component.stockQuantity || 0;
  const isOutOfStock = maxStock === 0;

  const handleBuildToggle = (buildId: number) => {
    setSelectedBuildIds((prev) =>
      prev.includes(buildId)
        ? prev.filter((id) => id !== buildId)
        : [...prev, buildId]
    );
  };

  const handleConfirm = () => {
    if (selectedBuildIds.length === 0) {
      alert("Please select at least one build to add this component to.");
      return;
    }

    if (quantity > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      return;
    }

    onConfirm(selectedBuildIds, quantity);
    // Reset state for next use
    setQuantity(1);
    setSelectedBuildIds([]);
    onClose();
  };

  const handleClose = () => {
    // Reset state when closing without confirm
    setQuantity(1);
    setSelectedBuildIds([]);
    onClose();
  };

  // Calculate total price for all selected builds
  const totalPrice =
    (component.price || 0) * quantity * selectedBuildIds.length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Add to Build(s)
        </h3>

        {/* Component Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{component.name}</h4>
              <p className="text-sm text-gray-600">
                {component.brand} • {component.type}
              </p>
              <p className="text-lg font-bold text-green-600 mt-1">
                ${component.price?.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {maxStock > 0 ? `${maxStock} in stock` : "Out of stock"}
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity per Build
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={maxStock}
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(maxStock, value)));
              }}
              className="w-20 text-center p-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
              disabled={quantity >= maxStock}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              +
            </button>
            <span className="text-sm text-gray-600 ml-2">
              × {selectedBuildIds.length} build
              {selectedBuildIds.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Build Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Build(s) to Add To
          </label>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading your builds...</div>
            </div>
          ) : availableBuilds.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border">
              <div className="text-yellow-700">No active builds found</div>
              <div className="text-sm text-yellow-600 mt-1">
                Create a build first to add components to it
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableBuilds.map((build) => (
                <label
                  key={build.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBuildIds.includes(build.id!)}
                    onChange={() => handleBuildToggle(build.id!)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {build.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Current total: ${build.totalPrice?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">#{build.id}</div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Summary */}
        {selectedBuildIds.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 mb-6">
            <div className="text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Component price:</span>
                <span>${component.price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity per build:</span>
                <span>×{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected builds:</span>
                <span>×{selectedBuildIds.length}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1">
                <span>Total cost:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isOutOfStock || selectedBuildIds.length === 0 || isLoading
            }
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              isOutOfStock || selectedBuildIds.length === 0 || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : selectedBuildIds.length === 0
              ? "Select Build(s)"
              : `Add to ${selectedBuildIds.length} Build${
                  selectedBuildIds.length !== 1 ? "s" : ""
                }`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildSelectionModal;
