/**
 * Displays a component with expandable details and cart actions
 * @param {ComponentCardProps} props - Component props including component data and cart handlers
 * @returns {JSX.Element} Styled component card with conditional cart buttons
 */
import { useState } from "react";
import type {
  ComponentCardProps,
  StockStatus,
  ComponentDetail,
} from "../types/component";
import {
  Cpu, // CPU
  Monitor, // GPU
  HardDrive, // RAM (memory representation)
  Database, // SSD
  Archive, // HDD
  CircuitBoard, // Motherboard
  Zap, // PSU
  Box, // Case
  Wind, // Cooler
  ChevronDown, // Expand indicator
  ChevronUp, // Collapse indicator
  ShoppingCart, // Add to cart
  Wrench, // Add to build
} from "lucide-react";

const ComponentCard = ({
  component,
  onAddToBuildCart,
  onAddToCheckoutCart,
  showCartButtons = false,
}: ComponentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (price?: number) => {
    return price ? `$${price.toFixed(2)}` : "Price not available";
  };

  const getStockStatus = (stock?: number): StockStatus => {
    if (!stock || stock === 0)
      return {
        text: "Out of stock",
        color: "text-red-600",
        bgColor: "bg-red-50",
      };
    if (stock <= 5)
      return {
        text: `Low stock (${stock})`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
      };
    return {
      text: `${stock} in stock`,
      color: "text-green-600",
      bgColor: "bg-green-50",
    };
  };

  const getComponentTypeIcon = (type?: string) => {
    // Map component types to their respective Lucide icons with colors
    const iconConfig: {
      [key: string]: {
        icon: React.ComponentType<{ size?: number; className?: string }>;
        colorClass: string;
      };
    } = {
      CPU: { icon: Cpu, colorClass: "text-blue-600" }, // Blue - processing/logic
      GPU: { icon: Monitor, colorClass: "text-purple-600" }, // Purple - graphics/visual
      RAM: { icon: HardDrive, colorClass: "text-green-600" }, // Green - memory/data
      SSD: { icon: Database, colorClass: "text-cyan-600" }, // Cyan - fast storage
      HDD: { icon: Archive, colorClass: "text-orange-600" }, // Orange - traditional storage
      Motherboard: { icon: CircuitBoard, colorClass: "text-emerald-600" }, // Emerald - foundation
      PSU: { icon: Zap, colorClass: "text-yellow-600" }, // Yellow - power/energy
      Case: { icon: Box, colorClass: "text-gray-600" }, // Gray - neutral enclosure
      Cooler: { icon: Wind, colorClass: "text-sky-600" }, // Sky blue - cooling/air
    };

    return iconConfig[type || ""] || { icon: Cpu, colorClass: "text-gray-600" };
  };

  const stockStatus = getStockStatus(component.stockQuantity);
  const iconConfig = getComponentTypeIcon(component.type);
  const IconComponent = iconConfig.icon;

  // Organize component details by relevance to component type
  const getRelevantDetails = (): ComponentDetail[] => {
    const details: ComponentDetail[] = [];

    // Type-specific important details for quick view
    switch (component.type) {
      case "CPU":
        if (component.socket)
          details.push({
            label: "Socket",
            value: component.socket,
            important: true,
          });
        if (component.wattage)
          details.push({
            label: "TDP",
            value: `${component.wattage}W`,
            important: true,
          });
        break;
      case "GPU":
        if (component.gpuLengthMm)
          details.push({
            label: "Length",
            value: `${component.gpuLengthMm}mm`,
            important: true,
          });
        if (component.wattage)
          details.push({
            label: "Power",
            value: `${component.wattage}W`,
            important: true,
          });
        break;
      case "RAM":
        if (component.ramType)
          details.push({
            label: "Type",
            value: component.ramType,
            important: true,
          });
        if ((component as any).ramCapacity)
          details.push({
            label: "Capacity",
            value: `${(component as any).ramCapacity}GB`,
            important: true,
          });
        break;
      case "Motherboard":
        if (component.socket)
          details.push({
            label: "Socket",
            value: component.socket,
            important: true,
          });
        if (component.formFactor)
          details.push({
            label: "Form Factor",
            value: component.formFactor,
            important: true,
          });
        break;
      case "PSU":
        if (component.wattage)
          details.push({
            label: "Wattage",
            value: `${component.wattage}W`,
            important: true,
          });
        if (component.psuFormFactor)
          details.push({
            label: "Form Factor",
            value: component.psuFormFactor,
            important: true,
          });
        break;
      case "SSD":
      case "HDD":
        if ((component as any).capacity)
          details.push({
            label: "Capacity",
            value: (component as any).capacity,
            important: true,
          });
        if (component.formFactor)
          details.push({
            label: "Form Factor",
            value: component.formFactor,
            important: true,
          });
        break;
      case "Case":
        if (component.formFactor)
          details.push({
            label: "Form Factor",
            value: component.formFactor,
            important: true,
          });
        break;
      case "Cooler":
        if (component.socket)
          details.push({
            label: "Socket",
            value: component.socket,
            important: true,
          });
        if (component.coolerHeightMm)
          details.push({
            label: "Height",
            value: `${component.coolerHeightMm}mm`,
            important: true,
          });
        break;
    }

    return details;
  };

  // All details for expanded view
  const getAllDetails = (): ComponentDetail[] => {
    const allDetails: ComponentDetail[] = [
      { label: "Brand", value: component.brand },
      { label: "Type", value: component.type },
      { label: "Compatibility Tag", value: component.compatibilityTag },
      { label: "Socket", value: component.socket },
      { label: "RAM Type", value: component.ramType },
      { label: "Form Factor", value: component.formFactor },
      {
        label: "Power Consumption",
        value: component.wattage ? `${component.wattage}W` : undefined,
      },
      {
        label: "GPU Length",
        value: component.gpuLengthMm ? `${component.gpuLengthMm}mm` : undefined,
      },
      {
        label: "Cooler Height",
        value: component.coolerHeightMm
          ? `${component.coolerHeightMm}mm`
          : undefined,
      },
      { label: "PSU Form Factor", value: component.psuFormFactor },
      { label: "PCI Slots Required", value: component.pciSlotsRequired },
    ];

    return allDetails.filter((detail) => detail.value);
  };

  const relevantDetails = getRelevantDetails();
  const allDetails = getAllDetails();

  return (
    <div className="bg-white border rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Card Header - Always Visible */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Enhanced component type icon with color */}
            <div className="flex-shrink-0">
              <IconComponent size={28} className={iconConfig.colorClass} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-gray-900 break-words">
                {component.name || "Unnamed Component"}
              </h3>
              <p className="text-sm text-gray-600">
                {component.brand} • {component.type}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(component.price)}
            </div>
            <div
              className={`text-xs px-2 py-1 rounded-full mt-1 ${stockStatus.bgColor} ${stockStatus.color}`}
            >
              {stockStatus.text}
            </div>
          </div>
        </div>

        {/* Quick Details - Always Visible */}
        {relevantDetails.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {relevantDetails.slice(0, 3).map((detail, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded ${
                  detail.important
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {detail.label}: {detail.value}
              </span>
            ))}
            {relevantDetails.length > 3 && (
              <span className="text-xs text-gray-500 px-1">
                +{relevantDetails.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* View Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium">
              {isExpanded ? "Hide Details" : "View Details"}
            </span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Cart Action Buttons */}
          {showCartButtons && (
            <div className="flex gap-2">
              {onAddToBuildCart && (
                <button
                  onClick={() => onAddToBuildCart(component)}
                  disabled={stockStatus.text === "Out of stock"}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Wrench size={16} />
                  <span className="text-sm font-medium">Add to Build</span>
                </button>
              )}

              {onAddToCheckoutCart && (
                <button
                  onClick={() => onAddToCheckoutCart(component)}
                  disabled={stockStatus.text === "Out of stock"}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart size={16} />
                  <span className="text-sm font-medium">Buy Now</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-5">
          <h4 className="font-medium text-gray-900 mb-3">
            Technical Specifications
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allDetails.map((detail, index) => (
              <div key={index} className="flex justify-between py-1">
                <span className="text-sm text-gray-600">{detail.label}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {/* Extra Compatibility Data */}
          {component.extraCompatibility &&
            Object.keys(component.extraCompatibility).length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  Additional Compatibility
                </h5>
                <div className="bg-white p-3 rounded border">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(component.extraCompatibility).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-1 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Timestamps */}
          <div className="mt-4 pt-3 border-t text-xs text-gray-500">
            <div>
              Added:{" "}
              {component.createdAt
                ? new Date(component.createdAt).toLocaleDateString()
                : "Unknown"}
            </div>
            {component.updatedAt &&
              component.updatedAt !== component.createdAt && (
                <div>
                  Updated: {new Date(component.updatedAt).toLocaleDateString()}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentCard;
