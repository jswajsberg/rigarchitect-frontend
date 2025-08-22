import { useState, useMemo } from "react";
import { useSelectedUserId } from "../contexts/UserContext";
import { useGetUserCarts } from "../api/build-cart-controller/build-cart-controller";
import { useGetItemsByCart } from "../api/cart-item-controller/cart-item-controller";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { BuildCartResponse, ComponentResponse } from "../api/model";

const OrderHistory = () => {
  const selectedUserId = useSelectedUserId();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Get all user carts
  const {
    data: userCarts,
    isLoading: cartsLoading,
    error: cartsError,
  } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId },
  });

  const { data: allComponents } = useGetAllComponents();

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

  // Handle no user selected
  if (!selectedUserId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">No User Selected</h3>
          <p className="text-yellow-600">
            Please select a user to view order history.
          </p>
        </div>
      </div>
    );
  }

  if (cartsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading order history...</div>
        </div>
      </div>
    );
  }

  if (cartsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">
            Error loading order history
          </h3>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-2">
          View your completed PC build purchases and download receipts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl text-blue-600 mr-4">📦</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Total Orders
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {orderSummary.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl text-green-600 mr-4">💰</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Total Spent
              </h3>
              <p className="text-2xl font-bold text-green-600">
                ${orderSummary.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="text-3xl text-purple-600 mr-4">📊</div>
            <div>
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
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-500 mb-6">
            You haven't completed any purchases yet. Start building your PC!
          </p>
          <button
            onClick={() => (window.location.href = "#")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
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
              allComponents={allComponents?.data || []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual Order Card Component
interface OrderCardProps {
  order: BuildCartResponse;
  isExpanded: boolean;
  onToggle: () => void;
  allComponents: ComponentResponse[];
}

const OrderCard = ({
  order,
  isExpanded,
  onToggle,
  allComponents,
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
  }, [order.totalPrice]);

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
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .order-info { margin: 20px 0; }
              .items { margin: 20px 0; }
              .total { border-top: 2px solid #333; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>RigArchitect</h1>
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
                  return `<p>${component?.name || "Unknown"} - Qty: ${
                    item.quantity
                  }</p>`;
                })
                .join("")}
            </div>
            <div class="total">
              <p>Subtotal: $${taxCalculations.subtotal.toFixed(2)}</p>
              <p>GST (5%): $${taxCalculations.gst.toFixed(2)}</p>
              <p>QST (9.975%): $${taxCalculations.qst.toFixed(2)}</p>
              <p><strong>Total: $${
                order.totalPrice?.toFixed(2) || "0.00"
              }</strong></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border">
      {/* Order Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {order.name}
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                COMPLETED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Order Date:</span>
                <br />
                {order.finalizedAt ? formatDate(order.finalizedAt) : "N/A"}
              </div>
              <div>
                <span className="font-medium">Order ID:</span>
                <br />#{order.id}
              </div>
              <div>
                <span className="font-medium">Total:</span>
                <br />
                <span className="text-xl font-bold text-green-600">
                  ${order.totalPrice?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button
              onClick={handlePrintReceipt}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
              title="Print Receipt"
            >
              📄 Print
            </button>
            <button
              onClick={onToggle}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              {isExpanded ? "Hide Details" : "View Details"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      {isExpanded && (
        <div className="p-6 bg-gray-50">
          {itemsLoading ? (
            <div className="text-center py-4">Loading order details...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <div className="lg:col-span-2">
                <h4 className="text-lg font-semibold mb-3">Items Purchased</h4>
                <div className="space-y-3">
                  {orderItems.map((item) => {
                    const component = allComponents.find(
                      (c) => c.id === item.componentId
                    );
                    const unitPrice = component?.price || 0;
                    const lineTotal = unitPrice * (item.quantity || 1);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div className="flex-1">
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
                        <div className="text-right">
                          <div className="font-medium">
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

              {/* Order Summary */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Order Summary</h4>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>${taxCalculations.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST (5%):</span>
                      <span>${taxCalculations.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>QST (9.975%):</span>
                      <span>${taxCalculations.qst.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total Paid:</span>
                      <span className="text-green-600">
                        ${order.totalPrice?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    <p>
                      <strong>Payment Method:</strong> Budget Account
                    </p>
                    <p>
                      <strong>Status:</strong> Completed
                    </p>
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
