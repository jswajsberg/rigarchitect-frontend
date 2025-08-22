// src/modals/QuantityModal.tsx
import React, { useState } from "react";
import type { ComponentResponse } from "../api/model";

interface QuantityModalProps {
  component: ComponentResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  actionType: "build" | "buy";
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  component,
  isOpen,
  onClose,
  onConfirm,
  actionType,
}) => {
  const [quantity, setQuantity] = useState(1);
  
  if (!isOpen || !component) return null;
  
  const maxStock = component.stockQuantity || 0;
  const isOutOfStock = maxStock === 0;

  const handleConfirm = () => {
    if (quantity > maxStock) {
      alert(`Only ${maxStock} items available in stock`);
      return;
    }
    onConfirm(quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">
          {actionType === "build" ? "Add to Build Cart" : "Buy Now"}
        </h3>

        <div className="mb-4">
          <h4 className="font-medium">{component.name}</h4>
          <p className="text-sm text-gray-600">{component.brand}</p>
          <p className="text-lg font-bold text-green-600">
            ${component.price?.toFixed(2)}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
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
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-sm text-gray-600">
              Total: ${((component.price || 0) * quantity).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {maxStock > 0 ? `${maxStock} available in stock` : "Out of stock"}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isOutOfStock}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              isOutOfStock
                ? "bg-gray-400 cursor-not-allowed"
                : actionType === "build"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isOutOfStock 
              ? "Out of Stock" 
              : actionType === "build" ? "Add to Cart" : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal;
