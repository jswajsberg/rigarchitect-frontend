// src/modals/ComponentReplacementModal.tsx
import React from "react";
import type { ComponentResponse } from "../api/model";
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  Monitor,
  HardDrive,
  Database,
  Archive,
  CircuitBoard,
  Zap,
  Box,
  Wind,
} from "lucide-react";

interface ComponentReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onCancel: () => void;
  currentComponent: ComponentResponse;
  newComponent: ComponentResponse;
  buildName: string;
}

const ComponentReplacementModal: React.FC<ComponentReplacementModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  onCancel,
  currentComponent,
  newComponent,
  buildName,
}) => {
  if (!isOpen) return null;

  // Get component type icon configuration
  const getComponentTypeIcon = (type?: string) => {
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

    return iconConfig[type || ""] || { icon: Cpu, colorClass: "text-gray-600" };
  };

  const iconConfig = getComponentTypeIcon(currentComponent.type);
  const IconComponent = iconConfig.icon;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Replace Component?
            </h3>
            <p className="text-sm text-gray-600">
              This build already has a {currentComponent.type?.toLowerCase()}{" "}
              selected
            </p>
          </div>
        </div>

        {/* Build Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Build:</span>
            <span className="text-sm text-gray-900">{buildName}</span>
          </div>
        </div>

        {/* Component Comparison */}
        <div className="space-y-4 mb-6">
          {/* Current Component */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconComponent size={20} className={iconConfig.colorClass} />
              <span className="text-sm font-medium text-red-800">
                Current {currentComponent.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {currentComponent.name}
                </div>
                <div className="text-sm text-gray-600">
                  {currentComponent.brand}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${currentComponent.price?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {/* New Component */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <IconComponent size={20} className={iconConfig.colorClass} />
              <span className="text-sm font-medium text-green-800">
                New {newComponent.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {newComponent.name}
                </div>
                <div className="text-sm text-gray-600">
                  {newComponent.brand}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${newComponent.price?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Difference */}
        {(() => {
          const priceDiff =
            (newComponent.price || 0) - (currentComponent.price || 0);
          if (Math.abs(priceDiff) > 0.01) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Price difference:</span>
                  <span
                    className={`font-semibold ${
                      priceDiff > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Warning Message */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <div className="font-medium mb-1">
                This action cannot be undone
              </div>
              <div>
                The current {currentComponent.type?.toLowerCase()} will be
                removed from your build and replaced with the new selection. Any
                compatibility relationships will be recalculated.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Keep Current
          </button>
          <button
            onClick={onReplace}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Replace Component
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentReplacementModal;
