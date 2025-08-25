// src/pages/ShoppingCart.tsx - Universal shopping cart (DRAFT BuildCart)
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedUserId } from "../contexts/UserContext";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import {
  useCreateItem,
  useUpdateQuantity,
  useDeleteItem,
  useGetItemsByCart,
} from "../api/cart-item-controller/cart-item-controller";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { ComponentResponse, CartItemRequest } from "../api/model";
import CheckoutModal from "../modals/CheckoutModal";

const ShoppingCart = () => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const [addComponentId, setAddComponentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Hooks must be called before any conditional logic
  const {
    data: userCarts,
    isLoading: cartsLoading,
    error: cartsError,
  } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId },
  });

  const { data: allComponents } = useGetAllComponents();

  // Mutations
  const createCartMutation = useCreateCartForUser();
  const createItemMutation = useCreateItem();
  const updateQuantityMutation = useUpdateQuantity();
  const deleteItemMutation = useDeleteItem();

  // Get the user's shopping cart (DRAFT status)
  const shoppingCart = useMemo(
    () => userCarts?.data?.find((cart) => cart.status === "DRAFT") || null,
    [userCarts]
  );

  const { data: cartItemsData, isLoading: itemsLoading } = useGetItemsByCart(
    shoppingCart?.id || 0,
    {
      query: { enabled: !!shoppingCart?.id },
    }
  );

  const cartItems = cartItemsData?.data || [];

  // Auto-create shopping cart if it doesn't exist when user adds first item
  const ensureShoppingCart = async () => {
    if (shoppingCart || !selectedUserId) return shoppingCart;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: selectedUserId,
        data: { name: "Shopping Cart", status: "DRAFT" },
      });

      // Invalidate queries to refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });

      return newCartResponse.data;
    } catch (error: any) {
      console.error("Failed to create shopping cart:", error);
      alert(
        `Failed to create shopping cart: ${
          error.response?.data?.message || error.message
        }`
      );
      return null;
    }
  };

  // Handle conditional rendering after all hooks are called
  if (!selectedUserId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">No User Selected</h3>
          <p className="text-yellow-600">
            Please select a user to view shopping cart.
          </p>
        </div>
      </div>
    );
  }

  const handleAddComponent = async () => {
    if (!addComponentId || !selectedUserId) return;

    const componentId = parseInt(addComponentId);
    if (isNaN(componentId)) return;

    try {
      // Ensure shopping cart exists
      let targetCart = shoppingCart;
      if (!targetCart) {
        targetCart = await ensureShoppingCart();
        if (!targetCart) return; // Failed to create cart
      }

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId,
        quantity: addQuantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      setAddComponentId("");
      setAddQuantity(1);

      // Refresh cart data and items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });
    } catch (error: any) {
      console.error("Failed to add component:", error);
      alert(
        `Failed to add component: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (!selectedUserId) return;

    try {
      await updateQuantityMutation.mutateAsync({
        id: itemId,
        data: { quantity: newQuantity },
      });

      // Refresh cart data and items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${shoppingCart?.id}`],
      });
    } catch (error: any) {
      console.error("Failed to update quantity:", error);
      alert(
        `Failed to update quantity: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!selectedUserId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to remove this item from your shopping cart?"
    );
    if (!confirmDelete) return;

    try {
      await deleteItemMutation.mutateAsync({ id: itemId });

      // Refresh cart data and items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${shoppingCart?.id}`],
      });
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      alert(
        `Failed to remove item: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleCheckout = () => {
    if (!shoppingCart || cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  if (cartsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your shopping cart...</div>
        </div>
      </div>
    );
  }

  if (cartsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading cart</h3>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
        <p className="text-gray-600 mt-2">
          Review your selected components and checkout when ready
        </p>
        {shoppingCart && (
          <div className="text-xl font-semibold text-blue-600 mt-2">
            Total: ${shoppingCart.totalPrice?.toFixed(2) || "0.00"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Cart Items</h3>
              {itemsLoading && (
                <div className="text-sm text-gray-500 mt-2">
                  Loading items...
                </div>
              )}
            </div>

            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🛒</div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Your cart is empty
                  </h4>
                  <p className="text-gray-500 mb-4">
                    Add components using the sidebar or browse the component
                    catalog
                  </p>
                  <div className="text-sm text-gray-400">
                    Components can be added from saved builds or individually
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const component = allComponents?.data?.find(
                      (c: ComponentResponse) => c.id === item.componentId
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {component?.name ||
                              `Component ID: ${item.componentId}`}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {component?.brand} • {component?.type}
                          </div>
                          <div className="text-lg font-semibold text-green-600">
                            ${component?.price?.toFixed(2)} each
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id!,
                                  Math.max(1, (item.quantity || 1) - 1)
                                )
                              }
                              disabled={item.quantity === 1}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id!,
                                  (item.quantity || 1) + 1
                                )
                              }
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[80px]">
                            <div className="font-bold text-gray-900">
                              $
                              {(
                                (component?.price || 0) * (item.quantity || 1)
                              ).toFixed(2)}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id!)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            title="Remove this item from cart"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Quick Add & Checkout - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Add Component Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Add</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add individual components directly to your cart
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component
                </label>
                <select
                  value={addComponentId}
                  onChange={(e) => setAddComponentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a component...</option>
                  {allComponents?.data?.map((component: ComponentResponse) => (
                    <option key={component.id} value={component.id}>
                      {component.name} - ${component.price} ({component.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={addQuantity}
                  onChange={(e) =>
                    setAddQuantity(parseInt(e.target.value) || 1)
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleAddComponent}
                disabled={!addComponentId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>

          {/* Cart Summary & Checkout */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cartItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  ${shoppingCart?.totalPrice?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    ${shoppingCart?.totalPrice?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!shoppingCart || cartItems.length === 0}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {cartItems.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
            </button>

            {cartItems.length > 0 && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Tax will be calculated at checkout
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Shopping Cart Tips
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Add components from your saved builds</li>
              <li>• Add individual components using Quick Add</li>
              <li>• Mix and match from different sources</li>
              <li>• Items stay in cart until checkout or removed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && shoppingCart && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          cart={shoppingCart}
        />
      )}
    </div>
  );
};

export default ShoppingCart;
