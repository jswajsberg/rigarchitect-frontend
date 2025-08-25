// src/pages/CartManagement.tsx - Updated without cart naming functionality
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";
import { useSelectedUserId } from "../contexts/UserContext";
import {
  useGetUserCarts,
  useCreateCartForUser,
  useDeleteCart,
  useUpdateCart,
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

const CartManagement = () => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const { selectCart, selectedCartId } = useCart();
  const [addComponentId, setAddComponentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
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
  const deleteCartMutation = useDeleteCart();
  const updateCartMutation = useUpdateCart();

  // Get active carts and current cart
  const activeCarts = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
    [userCarts]
  );

  // Get finalized carts for management
  const finalizedCarts = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "FINALIZED") || [],
    [userCarts]
  );

  const currentCart = useMemo(
    () =>
      activeCarts.find((cart) => cart.id === selectedCartId) || activeCarts[0],
    [activeCarts, selectedCartId]
  );

  const { data: cartItemsData, isLoading: itemsLoading } = useGetItemsByCart(
    currentCart?.id || 0,
    {
      query: { enabled: !!currentCart?.id },
    }
  );

  const cartItems = cartItemsData?.data || [];

  // Handle conditional rendering AFTER all hooks are called
  if (!selectedUserId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold">No User Selected</h3>
          <p className="text-yellow-600">
            Please select a user to manage carts.
          </p>
        </div>
      </div>
    );
  }

  const handleCartSelection = (cartId: number) => {
    selectCart(cartId);
  };

  const handleCreateCart = async () => {
    if (!selectedUserId) return;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: selectedUserId,
        data: { name: "Build Cart", status: "ACTIVE" }, // Use generic name
      });

      selectCart(newCartResponse.data.id!);

      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
    } catch (error: any) {
      console.error("Failed to create cart:", error);
      alert(
        `Failed to create cart: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleAddComponent = async () => {
    if (!addComponentId || !currentCart || !selectedUserId) return;

    const componentId = parseInt(addComponentId);
    if (isNaN(componentId)) return;

    try {
      const cartItemRequest: CartItemRequest = {
        cartId: currentCart.id!,
        componentId,
        quantity: addQuantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      setAddComponentId("");
      setAddQuantity(1);

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart.id}`],
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

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart?.id}`],
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
      "Are you sure you want to remove this item from your cart?"
    );
    if (!confirmDelete) return;

    try {
      await deleteItemMutation.mutateAsync({ id: itemId });

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart?.id}`],
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

  const handleFinalizeCart = () => {
    if (!currentCart || !selectedUserId) return;

    // Open checkout modal
    setShowCheckoutModal(true);
  };

  const handleDeleteCart = async (cartId: number) => {
    if (!selectedUserId) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete this cart? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteCartMutation.mutateAsync({ id: cartId });

      // Refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });

      // If we deleted the currently selected cart, clear selection
      if (selectedCartId === cartId) {
        selectCart(0);
      }
    } catch (error: any) {
      console.error("Failed to delete cart:", error);
      alert(
        `Failed to delete cart: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleReturnToDraft = async (cartId: number) => {
    if (!selectedUserId) return;

    const confirmReturn = window.confirm(
      `Are you sure you want to return this cart to active status? This will make it editable again.`
    );
    if (!confirmReturn) return;

    try {
      await updateCartMutation.mutateAsync({
        id: cartId,
        data: { name: "Build Cart", status: "ACTIVE" }, // Use generic name
      });

      // Refresh cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      // Also refresh user data to show updated budget
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/users"],
      });
    } catch (error: any) {
      console.error("Failed to return cart to active:", error);
      alert(
        `Failed to return cart to active: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  if (cartsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading your carts...</div>
        </div>
      </div>
    );
  }

  if (cartsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error loading carts</h3>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Cart Management</h2>
        <p className="text-gray-600 mt-2">
          Manage your PC build carts and checkout when ready
        </p>
      </div>

      {/* Cart Selection */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium text-gray-700">
          Active Carts:
        </label>
        {activeCarts.map((cart, index) => (
          <button
            key={cart.id}
            onClick={() => handleCartSelection(cart.id!)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentCart?.id === cart.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cart {index + 1} (${cart.totalPrice?.toFixed(2) || "0.00"})
          </button>
        ))}

        <button
          onClick={handleCreateCart}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + New Cart
        </button>
      </div>

      {/* Main Content Area - Dual Column Layout */}
      {activeCarts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Active Carts
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first cart to start building!
          </p>
          <button
            onClick={handleCreateCart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your First Cart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Cart Items - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    Cart{" "}
                    {activeCarts.findIndex(
                      (cart) => cart.id === currentCart?.id
                    ) + 1 || "No Cart Selected"}
                  </h3>
                  {currentCart && (
                    <div className="text-2xl font-bold text-blue-600">
                      ${currentCart.totalPrice?.toFixed(2) || "0.00"}
                    </div>
                  )}
                </div>
                {itemsLoading && (
                  <div className="text-sm text-gray-500 mt-2">
                    Loading items...
                  </div>
                )}
              </div>

              <div className="p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🛒</div>
                    <p>This cart is empty.</p>
                    <p className="text-sm mt-2">
                      Add components using the sidebar or browse the component
                      catalog.
                    </p>
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

                          <div className="flex items-center gap-3">
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

                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                $
                                {(
                                  (component?.price || 0) * (item.quantity || 1)
                                ).toFixed(2)}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id!)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              title="Remove this item completely"
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

          {/* Sidebar - Quick Add & Actions - Takes 1 column */}
          <div className="space-y-6">
            {/* Quick Add Component Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Add</h3>
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
                    {allComponents?.data?.map(
                      (component: ComponentResponse) => (
                        <option key={component.id} value={component.id}>
                          {component.name} - ${component.price} (
                          {component.type})
                        </option>
                      )
                    )}
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
                  disabled={!addComponentId || !currentCart}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
              </div>
            </div>

            {/* Cart Actions */}
            {currentCart && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Cart Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleFinalizeCart}
                    disabled={cartItems.length === 0}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Checkout Cart
                  </button>
                  <button
                    onClick={() => handleDeleteCart(currentCart.id!)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Delete Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Finalized Carts Section */}
      {finalizedCarts.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Completed Orders
          </h3>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finalized
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finalizedCarts.map((cart, index) => (
                    <tr key={cart.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Cart {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {cart.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        ${cart.totalPrice?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cart.finalizedAt
                          ? new Date(cart.finalizedAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleReturnToDraft(cart.id!)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Return to Active
                        </button>
                        <button
                          onClick={() => handleDeleteCart(cart.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && currentCart && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          cart={currentCart}
        />
      )}
    </div>
  );
};

export default CartManagement;
