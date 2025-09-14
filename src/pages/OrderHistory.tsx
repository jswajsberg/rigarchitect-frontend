/**
 * Order history page displaying completed purchases with receipts
 * @returns {JSX.Element} Order history with expandable order details and print functionality
 */
import React, { useState, useMemo } from "react";
import { useSelectedUserId } from "../contexts/UserContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useGetUserCarts } from "../api/build-cart-controller/build-cart-controller";
import { useGetItemsByCart } from "../api/cart-item-controller/cart-item-controller";
import { useSharedData } from "../contexts/SharedDataContext";
import type { BuildCartResponse, ComponentResponse } from "../api/model";
import {
  Package, // Total Orders
  DollarSign, // Total Spent
  TrendingUp, // Average Order
  FileText, // For page title icon
  ShoppingCart, // Empty state
  Printer, // Print receipt
  ChevronDown, // Expand details
  ChevronUp, // Collapse details
  CheckCircle, // Completed status
  Calendar, // Order date
  Hash, // Order ID
  // Component type icons (same as other pages)
  Cpu, // CPU
  Monitor, // GPU
  HardDrive, // RAM
  Database, // SSD
  Archive, // HDD
  CircuitBoard, // Motherboard
  Zap, // PSU
  Box, // Case
  Wind, // Cooler
  AlertTriangle, // Warning
  User, // No user selected
} from "lucide-react";

const OrderHistory: React.FC = React.memo(() => {
  const selectedUserId = useSelectedUserId();
  const { setActiveTab } = useNavigation();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Get all user carts
  const {
    data: userCarts,
    isLoading: cartsLoading,
    error: cartsError,
  } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId && selectedUserId > 0 },
  });

  const { allComponents } = useSharedData();

  // Get finalized orders (completed purchases)
  const orders = useMemo(() => {
    const finalizedCarts =
      userCarts?.data?.filter((cart) => cart.status === "FINALIZED") || [];

    // Sort by finalized date (most recent first)
    return finalizedCarts.sort((a, b) => {
      if (!a.finalizedAt || !b.finalizedAt) return 0;
      return (
        new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime()
      );
    });
  }, [userCarts]);

  // Calculate totals for summary
  const orderSummary = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const averageOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      totalOrders,
      totalSpent,
      averageOrder,
    };
  }, [orders]);

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Component type icon configuration (same as other pages)
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

  // Handle no user selected
  if (!selectedUserId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <User size={48} className="text-yellow-600 mx-auto mb-4" />
          <h3 className="text-yellow-800 font-semibold text-lg mb-2">
            No User Selected
          </h3>
          <p className="text-yellow-600">
            Please select a user to view order history.
          </p>
        </div>
      </div>
    );
  }

  if (cartsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="ml-4 text-lg text-gray-600">
            Loading order history...
          </div>
        </div>
      </div>
    );
  }

  if (cartsError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertTriangle size={48} className="text-red-600 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            Error loading order history
          </h3>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        </div>
        <p className="text-gray-600">
          View your completed PC build purchases and download receipts
        </p>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package size={32} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Orders
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {orderSummary.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign size={32} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Total Spent
              </h3>
              <p className="text-2xl font-bold text-green-600">
                ${orderSummary.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp size={32} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Average Order
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                ${orderSummary.averageOrder.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingCart size={64} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-500 mb-6">
            You haven't completed any purchases yet. Start building your PC!
          </p>
          <button
            onClick={() => setActiveTab("components")}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <Package size={16} />
            Browse Components
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Orders ({orders.length})
          </h2>

          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrderId === order.id}
              onToggle={() => toggleOrderDetails(order.id!)}
              allComponents={allComponents || []}
              getComponentTypeIcon={getComponentTypeIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Enhanced Order Card Component
interface OrderCardProps {
  order: BuildCartResponse;
  isExpanded: boolean;
  onToggle: () => void;
  allComponents: ComponentResponse[];
  getComponentTypeIcon: (type?: string) => {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    colorClass: string;
  };
}

const OrderCard = ({
  order,
  isExpanded,
  onToggle,
  allComponents,
  getComponentTypeIcon,
}: OrderCardProps) => {
  const { data: orderItemsData, isLoading: itemsLoading } = useGetItemsByCart(
    order.id || 0,
    {
      query: { enabled: isExpanded && !!order.id },
    }
  );

  const orderItems = orderItemsData?.data || [];

  // Calculate tax breakdown (using same rates as checkout)
  const TAX_RATES = {
    GST: 0.05, // 5% Federal GST
    QST: 0.09975, // 9.975% Quebec provincial tax
  };

  const taxCalculations = useMemo(() => {
    const totalWithTax = order.totalPrice || 0;
    // Reverse calculate subtotal from total (since total includes tax)
    const taxMultiplier = 1 + TAX_RATES.GST + TAX_RATES.QST;
    const subtotal = totalWithTax / taxMultiplier;
    const gst = subtotal * TAX_RATES.GST;
    const qst = subtotal * TAX_RATES.QST;

    return {
      subtotal: subtotal,
      gst: gst,
      qst: qst,
      total: totalWithTax,
    };
  }, [order.totalPrice, TAX_RATES.GST, TAX_RATES.QST]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt - ${order.name}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 40px; 
                color: #333;
                line-height: 1.6;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #2563eb; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
              }
              .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 2em;
              }
              .order-info { 
                margin: 30px 0; 
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
              }
              .items { 
                margin: 30px 0; 
              }
              .item-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
              }
              .total-section { 
                border-top: 3px solid #2563eb; 
                padding-top: 20px; 
                margin-top: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
              }
              .final-total {
                font-weight: bold;
                font-size: 1.2em;
                border-top: 2px solid #2563eb;
                padding-top: 10px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🏗️ RigArchitect</h1>
              <h2>Order Receipt</h2>
            </div>
            <div class="order-info">
              <p><strong>Order:</strong> ${order.name}</p>
              <p><strong>Date:</strong> ${
                order.finalizedAt ? formatDate(order.finalizedAt) : "N/A"
              }</p>
              <p><strong>Order ID:</strong> #${order.id}</p>
            </div>
            <div class="items">
              <h3>Items Purchased:</h3>
              ${orderItems
                .map((item) => {
                  const component = allComponents.find(
                    (c) => c.id === item.componentId
                  );
                  const unitPrice = component?.price || 0;
                  const lineTotal = unitPrice * (item.quantity || 1);
                  return `
                    <div class="item-row">
                      <div>
                        <strong>${
                          component?.name || "Unknown Component"
                        }</strong><br>
                        <small>${component?.brand} • ${
                    component?.type
                  }</small><br>
                        <small>$${unitPrice.toFixed(2)} each × ${
                    item.quantity || 1
                  }</small>
                      </div>
                      <div><strong>$${lineTotal.toFixed(2)}</strong></div>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${taxCalculations.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>GST (5%):</span>
                <span>$${taxCalculations.gst.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>QST (9.975%):</span>
                <span>$${taxCalculations.qst.toFixed(2)}</span>
              </div>
              <div class="total-row final-total">
                <span>Total:</span>
                <span>$${order.totalPrice?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
            <div style="text-align: center; margin-top: 40px; color: #64748b; font-size: 0.9em;">
              <p>Thank you for your purchase!</p>
              <p>RigArchitect - Custom PC Build Platform</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
      {/* Enhanced Order Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {order.name}
              </h3>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                <CheckCircle size={14} />
                COMPLETED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-end gap-2 text-gray-600">
                <Calendar size={14} className="text-blue-600 mb-1" />
                <div>
                  <span className="font-medium">Order Date:</span>
                  <br />
                  <span className="text-gray-900">
                    {order.finalizedAt ? formatDate(order.finalizedAt) : "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-2 text-gray-600">
                <Hash size={20} className="text-purple-600 mb-0.4" />
                <div>
                  <span className="font-medium">Order ID:</span>
                  <br />
                  <span className="text-gray-900">{order.id}</span>
                </div>
              </div>
              <div className="flex items-end gap-2 text-gray-600">
                <DollarSign size={20} className="text-green-600 mb-1" />
                <div>
                  <span className="font-medium">Total:</span>
                  <br />
                  <span className="text-xl font-bold text-green-600">
                    {order.totalPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handlePrintReceipt}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              title="Print Receipt"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onToggle}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  View Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="p-6 bg-gray-50">
          {itemsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading order details...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Enhanced Order Items */}
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Items Purchased
                </h4>
                <div className="space-y-3">
                  {orderItems.map((item) => {
                    const component = allComponents.find(
                      (c) => c.id === item.componentId
                    );
                    const unitPrice = component?.price || 0;
                    const lineTotal = unitPrice * (item.quantity || 1);
                    const iconConfig = getComponentTypeIcon(component?.type);
                    const IconComponent = iconConfig.icon;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <IconComponent
                            size={24}
                            className={iconConfig.colorClass}
                          />
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {component?.name || "Unknown Component"}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {component?.brand} • {component?.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${unitPrice.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-600">
                            Qty: {item.quantity || 1}
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            ${lineTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Order Summary */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Order Summary
                </h4>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        ${taxCalculations.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST (5%):</span>
                      <span className="font-medium">
                        ${taxCalculations.gst.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>QST (9.975%):</span>
                      <span className="font-medium">
                        ${taxCalculations.qst.toFixed(2)}
                      </span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${order.totalPrice?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
