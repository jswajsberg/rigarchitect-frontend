import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";
import { useSelectedUserId } from "../contexts/UserContext";
import {
  useGetUserCarts,
  useCreateCartForUser,
  useFinalizeCart,
} from "../api/build-cart-controller/build-cart-controller";
import {
  useCreateItem,
  useUpdateQuantity,
  useDeleteItem,
  useGetItemsByCart,
} from "../api/cart-item-controller/cart-item-controller";
import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { ComponentResponse, CartItemRequest } from "../api/model";

const CartManagement = () => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId(); // Use selected user from context
  const { selectCart, selectedCartId } = useCart();
  const [isCreatingCart, setIsCreatingCart] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [addComponentId, setAddComponentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  // API calls - use enabled to control when they run
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
  const finalizeCartMutation = useFinalizeCart();
  const createItemMutation = useCreateItem();
  const updateQuantityMutation = useUpdateQuantity();
  const deleteItemMutation = useDeleteItem();

  // Get active carts and current cart
  const activeCarts = useMemo(
    () => userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [],
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

  // NOW we can handle conditional rendering AFTER all hooks are called
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
    if (!newCartName.trim() || !selectedUserId) return;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: selectedUserId,
        data: { name: newCartName, status: "ACTIVE" },
      });

      setNewCartName("");
      setIsCreatingCart(false);

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

  const handleFinalizeCart = async () => {
    if (!currentCart || !selectedUserId) return;

    const confirmFinalize = window.confirm(
      `Are you sure you want to finalize "${
        currentCart.name
      }"? This will deduct $${currentCart.totalPrice?.toFixed(
        2
      )} from your budget.`
    );

    if (confirmFinalize) {
      try {
        await finalizeCartMutation.mutateAsync({ cartId: currentCart.id! });
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });
        // Also refresh user data to show updated budget
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/users"],
        });
      } catch (error: any) {
        console.error("Failed to finalize cart:", error);
        alert(
          `Failed to finalize cart: ${
            error.response?.data?.message ||
            "Please check if you have sufficient budget."
          }`
        );
      }
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
        {activeCarts.map((cart) => (
          <button
            key={cart.id}
            onClick={() => handleCartSelection(cart.id!)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentCart?.id === cart.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cart.name} (${cart.totalPrice?.toFixed(2) || "0.00"})
          </button>
        ))}

        <button
          onClick={() => setIsCreatingCart(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          + New Cart
        </button>
      </div>

      {/* Create Cart Form */}
      {isCreatingCart && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-3">Create New Cart</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCartName}
              onChange={(e) => setNewCartName(e.target.value)}
              placeholder="Enter cart name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateCart}
              disabled={!newCartName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreatingCart(false);
                setNewCartName("");
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Cart */}
      {currentCart ? (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {currentCart.name}
                </h3>
                <p className="text-gray-600">
                  Total: ${currentCart.totalPrice?.toFixed(2) || "0.00"}
                </p>
              </div>
              <button
                onClick={handleFinalizeCart}
                disabled={!cartItems.length}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                Finalize Cart
              </button>
            </div>
          </div>

          {/* Add Component Form */}
          <div className="p-6 border-b bg-gray-50">
            <h4 className="text-lg font-semibold mb-3">Add Component</h4>
            <div className="flex gap-3">
              <select
                value={addComponentId}
                onChange={(e) => setAddComponentId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a component...</option>
                {allComponents?.data?.map((component: ComponentResponse) => (
                  <option key={component.id} value={component.id}>
                    {component.name} - ${component.price} ({component.type})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddComponent}
                disabled={!addComponentId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-4">Cart Items</h4>

            {itemsLoading ? (
              <div className="text-center py-8">Loading cart items...</div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items in cart. Add some components above!
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium">{item.componentName}</h5>
                      <p className="text-sm text-gray-600">
                        Component ID: {item.componentId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Qty:</span>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.id!,
                              parseInt(e.target.value) || 1
                            )
                          }
                          min="1"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id!)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Active Carts
          </h3>
          <p className="text-gray-600 mb-4">
            Create a new cart to start building your PC.
          </p>
          <button
            onClick={() => setIsCreatingCart(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your First Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default CartManagement;
