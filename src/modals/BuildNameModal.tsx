// src/modals/BuildNameModal.tsx
import React, { useState, useEffect } from "react";

interface BuildNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (buildName: string) => void;
  initialName?: string;
  title?: string;
}

const BuildNameModal: React.FC<BuildNameModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = "",
  title = "Name Your Build",
}) => {
  const [buildName, setBuildName] = useState(initialName);
  const [error, setError] = useState<string>("");

  // Update local state when initialName changes or modal opens
  useEffect(() => {
    setBuildName(initialName);
    setError("");
  }, [initialName, isOpen]);

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

    onConfirm(trimmedName);
    handleClose();
  };

  const handleClose = () => {
    setBuildName(initialName);
    setError("");
    onClose();
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
