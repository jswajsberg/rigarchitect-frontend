/**
 * Comprehensive checkout modal with tax calculations, budget validation, and order completion
 */
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedUserId, useSelectedUser } from "../contexts/UserContext";
import { useFinalizeCart } from "../api/build-cart-controller/build-cart-controller";
import { useGetItemsByCart } from "../api/cart-item-controller/cart-item-controller";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { BuildCartResponse, ComponentResponse } from "../api/model";

// Quebec and Canada tax rates (2024)
const TAX_RATES = {
  GST: 0.05, // 5% Federal GST
  QST: 0.09975, // 9.975% Quebec provincial tax
};

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: BuildCartResponse;
}

/**
 * Modal for cart checkout with tax calculations, budget validation, and order processing
 * @param {CheckoutModalProps} props - Modal props with cart data and handlers
 * @returns {JSX.Element | null} Checkout modal or null if closed
 */
const CheckoutModal = ({ isOpen, onClose, cart }: CheckoutModalProps) => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const selectedUser = useSelectedUser();
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const { data: allComponents } = useGetAllComponents();
  const finalizeCartMutation = useFinalizeCart();

  // Get cart items
  const { data: cartItemsData } = useGetItemsByCart(cart.id || 0, {
    query: { enabled: !!cart.id && isOpen },
  });

  const cartItems = useMemo(
    () => cartItemsData?.data || [],
    [cartItemsData?.data]
  );

  // Enhanced cart items with component details
  const enhancedCartItems = useMemo(() => {
    if (!allComponents?.data || !cartItems.length) return [];

    return cartItems.map((item) => {
      const component = allComponents.data.find(
        (c: ComponentResponse) => c.id === item.componentId
      );

      const quantity = item.quantity || 1;
      const unitPrice = component?.price || 0;
      const lineTotal = unitPrice * quantity;

      return {
        ...item,
        component,
        unitPrice,
        lineTotal,
        quantity,
      };
    });
  }, [cartItems, allComponents]);

  // Tax calculations
  const taxCalculations = useMemo(() => {
    const subtotal = enhancedCartItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    const gst = subtotal * TAX_RATES.GST;
    const qst = subtotal * TAX_RATES.QST;
    const totalTax = gst + qst;
    const grandTotal = subtotal + totalTax;

    return {
      subtotal,
      gst,
      qst,
      totalTax,
      grandTotal,
    };
  }, [enhancedCartItems]);

  const handleCompleteCheckout = async () => {
    if (!cart || !selectedUserId) return;

    setCheckoutProcessing(true);
    try {
      await finalizeCartMutation.mutateAsync({ cartId: cart.id! });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      // Also refresh user data to show updated budget
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/users"],
      });

      setCheckoutComplete(true);
    } catch (error: unknown) {
      console.error("Failed to finalize cart:", error);
      alert(
        `Failed to finalize cart: ${
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data &&
          typeof error.response.data.message === "string"
            ? error.response.data.message
            : "Please check if you have sufficient budget."
        }`
      );
    } finally {
      setCheckoutProcessing(false);
    }
  };

  const handleClose = () => {
    setCheckoutComplete(false);
    setCheckoutProcessing(false);
    onClose();
  };

  if (!isOpen || !selectedUser) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {checkoutComplete ? (
          // Order Complete Screen
          <div className="p-8 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Order Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your PC build "{cart.name}" has been successfully finalized.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${taxCalculations.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <span>${taxCalculations.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>QST (9.975%):</span>
                  <span>${taxCalculations.qst.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total Paid:</span>
                  <span>${taxCalculations.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Print Receipt
              </button>
            </div>
          </div>
        ) : (
          // Main Checkout Screen
          <div>
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Review your order and complete your PC build purchase
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <div className="font-medium">{selectedUser.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <div className="font-medium">{selectedUser.email}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Available Budget:</span>
                        <div className="font-semibold">
                          ${selectedUser.budget?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cart:</span>
                        <div className="font-medium">{cart.name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {enhancedCartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.component?.name || "Unknown Component"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.component?.brand} • {item.component?.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              ${item.unitPrice.toFixed(2)} each
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              Qty: {item.quantity}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              ${item.lineTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-6">
                  {/* Tax Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Order Summary
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>
                          Subtotal ({enhancedCartItems.length} items):
                        </span>
                        <span>${taxCalculations.subtotal.toFixed(2)}</span>
                      </div>

                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-gray-600">
                          <span>GST (5%):</span>
                          <span>${taxCalculations.gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>QST (9.975%):</span>
                          <span>${taxCalculations.qst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Total Tax:</span>
                          <span>${taxCalculations.totalTax.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="border-t-2 pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Grand Total:</span>
                          <span className="text-blue-600">
                            ${taxCalculations.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Budget Check */}
                    <div className="mt-4 p-3 bg-white rounded border">
                      <div className="flex justify-between text-sm">
                        <span>Available Budget:</span>
                        <span>
                          ${selectedUser.budget?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>After Purchase:</span>
                        <span
                          className={
                            (selectedUser.budget || 0) >=
                            taxCalculations.grandTotal
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          $
                          {(
                            (selectedUser.budget || 0) -
                            taxCalculations.grandTotal
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600 text-2xl">💳</div>
                      <div>
                        <div className="font-semibold text-blue-800">
                          Budget Account
                        </div>
                        <div className="text-sm text-blue-600">
                          Charged to your available budget
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complete Order Button */}
                  <button
                    onClick={handleCompleteCheckout}
                    disabled={
                      checkoutProcessing ||
                      (selectedUser.budget || 0) < taxCalculations.grandTotal ||
                      enhancedCartItems.length === 0
                    }
                    className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                  >
                    {checkoutProcessing
                      ? "Processing Order..."
                      : `Complete Order - $${taxCalculations.grandTotal.toFixed(
                          2
                        )}`}
                  </button>

                  {(selectedUser.budget || 0) < taxCalculations.grandTotal && (
                    <div className="text-center text-red-600 text-sm">
                      Insufficient budget to complete this order
                    </div>
                  )}

                  {/* Tax Information */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      <strong>Tax Information:</strong>
                    </p>
                    <p>• GST: 5% Federal Goods and Services Tax</p>
                    <p>• QST: 9.975% Quebec Sales Tax</p>
                    <p>• Taxes calculated for Quebec, Canada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
