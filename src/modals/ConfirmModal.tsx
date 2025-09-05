// src/modals/ConfirmModal.tsx
import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Save, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  icon,
}) => {
  // Focus confirm button when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const confirmButton = document.getElementById("confirm-modal-button");
      if (confirmButton) {
        confirmButton.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      handleConfirm();
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconColor: "text-red-600",
          confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
          borderColor: "border-red-200",
          bgColor: "bg-red-50",
        };
      case "warning":
        return {
          iconColor: "text-yellow-600",
          confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
          borderColor: "border-yellow-200",
          bgColor: "bg-yellow-50",
        };
      case "info":
        return {
          iconColor: "text-blue-600",
          confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-50",
        };
      default:
        return {
          iconColor: "text-gray-600",
          confirmButtonClass: "bg-gray-600 hover:bg-gray-700 text-white",
          borderColor: "border-gray-200",
          bgColor: "bg-gray-50",
        };
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 className="w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6" />;
      case "info":
        return <Save className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) {
    return null;
  }

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            {icon || getDefaultIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            id="confirm-modal-button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;