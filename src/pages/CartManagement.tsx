import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";
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

const CURRENT_USER_ID = 1;

const CartManagement = () => {
  const queryClient = useQueryClient();
  const { selectCart, selectedCartId } = useCart();
  const [isCreatingCart, setIsCreatingCart] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [addComponentId, setAddComponentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);

  const handleCartSelection = (cartId: number) => {
    selectCart(cartId);
  };

  // API calls
  const {
    data: userCarts,
    isLoading: cartsLoading,
    error: cartsError,
  } = useGetUserCarts(CURRENT_USER_ID);
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

  const handleCreateCart = async () => {
    if (!newCartName.trim()) return;

    try {
      const newCartResponse = await createCartMutation.mutateAsync({
        userId: CURRENT_USER_ID,
        data: { name: newCartName, status: "ACTIVE" },
      });

      setNewCartName("");
      setIsCreatingCart(false);

      selectCart(newCartResponse.data.id!);

      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
      });
    } catch (error) {
      console.error("Failed to create cart:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!currentCart || !addComponentId || addQuantity < 1) return;

    const selectedComponent = allComponents?.data?.find(
      (c: ComponentResponse) => c.id === parseInt(addComponentId)
    );

    if (!selectedComponent) {
      alert("Component not found");
      return;
    }

    if (selectedComponent.stockQuantity === 0) {
      alert("This component is out of stock");
      return;
    }

    if (selectedComponent.stockQuantity !== undefined && addQuantity > selectedComponent.stockQuantity) {
      alert(`Only ${selectedComponent.stockQuantity} items available in stock`);
      return;
    }

    try {
      const cartItemRequest: CartItemRequest = {
        cartId: currentCart.id!,
        componentId: parseInt(addComponentId),
        quantity: addQuantity,
      };

      await createItemMutation.mutateAsync({
        data: cartItemRequest,
      });

      setAddComponentId("");
      setAddQuantity(1);

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart.id}`],
      });
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const cartItem = cartItems.find((item: any) => item.id === itemId);
    if (!cartItem) {
      alert("Cart item not found");
      return;
    }

    const component = allComponents?.data?.find(
      (c: ComponentResponse) => c.id === cartItem.componentId
    );

    if (!component) {
      alert("Component not found");
      return;
    }

    if (component.stockQuantity === 0) {
      alert("This component is out of stock");
      return;
    }

    if (component.stockQuantity !== undefined && newQuantity > component.stockQuantity) {
      alert(`Only ${component.stockQuantity} items available in stock`);
      return;
    }

    try {
      await updateQuantityMutation.mutateAsync({
        id: itemId,
        data: { quantity: newQuantity },
      });

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${currentCart?.id}`],
      });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this item from your cart?"
    );
    if (!confirmDelete) return;

    try {
      await deleteItemMutation.mutateAsync({ id: itemId });

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
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
    if (!currentCart) return;

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
          queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
        });
      } catch (error) {
        console.error("Failed to finalize cart:", error);
        alert(
          "Failed to finalize cart. Please check if you have sufficient budget."
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
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

      {/* New Cart Creation */}
      {isCreatingCart && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-3">Create New Cart</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCartName}
              onChange={(e) => setNewCartName(e.target.value)}
              placeholder="Cart name (e.g., Gaming Build, Office Setup)"
              className="flex-1 p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              onKeyPress={(e) => e.key === "Enter" && handleCreateCart()}
            />
            <button
              onClick={handleCreateCart}
              disabled={!newCartName.trim() || createCartMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {createCartMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setIsCreatingCart(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeCarts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Active Carts
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first cart to start building!
          </p>
          <button
            onClick={() => setIsCreatingCart(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your First Cart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    {currentCart?.name || "No Cart Selected"}
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
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🛒</div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      Cart is Empty
                    </h4>
                    <p className="text-gray-500">
                      Add components to get started with your build
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {item.componentName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Component ID: {item.componentId}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            title="Remove this item completely"
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
          </div>

          {/* Add Components & Actions */}
          <div className="space-y-6">
            {/* Add Component */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Add Component</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component
                  </label>
                  <select
                    value={addComponentId}
                    onChange={(e) => setAddComponentId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a component...</option>
                    {allComponents?.data?.map(
                      (component: ComponentResponse) => (
                        <option key={component.id} value={component.id}>
                          {component.name} - ${component.price?.toFixed(2)} (
                          {component.brand})
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
                    min="1"
                    value={addQuantity}
                    onChange={(e) =>
                      setAddQuantity(parseInt(e.target.value) || 1)
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={
                    !currentCart ||
                    !addComponentId ||
                    createItemMutation.isPending
                  }
                  className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {createItemMutation.isPending ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            </div>

            {/* Cart Actions */}
            {currentCart && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Cart Actions</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Price</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${currentCart.totalPrice?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}{" "}
                      in cart
                    </div>
                  </div>

                  <button
                    onClick={handleFinalizeCart}
                    disabled={
                      finalizeCartMutation.isPending ||
                      !currentCart.totalPrice ||
                      cartItems.length === 0
                    }
                    className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    {finalizeCartMutation.isPending
                      ? "Processing..."
                      : "Finalize & Checkout"}
                  </button>

                  <p className="text-xs text-gray-500">
                    Finalizing will deduct the total from your budget and mark
                    this cart as complete.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartManagement;
