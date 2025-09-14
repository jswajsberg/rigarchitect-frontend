/**
 * Cart context for managing shopping cart operations and toast notifications
 * @module CartContext
 */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import {
  useCreateItem,
  useGetItemsByCart,
} from "../api/cart-item-controller/cart-item-controller";
import { useSelectedUserId } from "./UserContext";
import type {
  ComponentResponse,
  BuildCartResponse,
  CartItemRequest,
} from "../api/model";

interface CartContextType {
  currentCart: BuildCartResponse | null;
  activeCarts: BuildCartResponse[];
  selectedCartId: number | null;
  shoppingCartItemCount: number;
  addToCart: (component: ComponentResponse, quantity?: number) => Promise<void>;
  showToast: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
  selectCart: (cartId: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<number | null>(null);

  // Fetch user carts - only for authenticated users with valid selectedUserId
  const { data: userCarts } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId && selectedUserId > 0 },
  });

  const createCartMutation = useCreateCartForUser();
  const createItemMutation = useCreateItem();

  const activeCarts =
    userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [];
  const currentCart =
    activeCarts.find((cart) => cart.id === selectedCartId) ||
    activeCarts[0] ||
    null;

  // Find shopping cart (DRAFT status cart used for individual component shopping)
  const shoppingCart =
    userCarts?.data?.find((cart) => cart.status === "DRAFT") || null;

  // Fetch shopping cart items to get count - only if we have a valid shopping cart
  const { data: shoppingCartItemsData } = useGetItemsByCart(
    shoppingCart?.id || 0,
    {
      query: { enabled: !!shoppingCart?.id && !!selectedUserId && selectedUserId > 0 },
    }
  );

  const shoppingCartItems = shoppingCartItemsData?.data || [];
  // Calculate total item count (sum of all quantities)
  const shoppingCartItemCount = shoppingCartItems.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  const selectCart = (cartId: number) => {
    setSelectedCartId(cartId);
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const addToCart = async (
    component: ComponentResponse,
    quantity: number = 1
  ) => {
    if (!selectedUserId) {
      showToast("Please select a user first", "error");
      return;
    }

    try {
      let targetCart = currentCart;

      if (!targetCart) {
        const newCartResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: "My Build Cart", status: "ACTIVE" },
        });
        targetCart = newCartResponse.data;
        setSelectedCartId(targetCart.id!);

        // Invalidate carts query to refetch
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });
      }

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId: component.id!,
        quantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });

      showToast(
        `Added ${component.name} to cart (Qty: ${quantity})`,
        "success"
      );
    } catch (error: unknown) {
      console.error("🛒 AddToCart error:", error);
      const errorMsg =
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
          : error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string"
          ? error.message
          : "Unknown error";
      showToast(`Failed to add to cart: ${errorMsg}`, "error");
    }
  };

  // Reset selected cart when user changes
  React.useEffect(() => {
    setSelectedCartId(null);
  }, [selectedUserId]);

  const contextValue: CartContextType = {
    currentCart,
    activeCarts,
    selectedCartId,
    shoppingCartItemCount,
    addToCart,
    showToast,
    selectCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}

      {/* Toast notifications - Enhanced with warning support */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg text-white shadow-lg transition-opacity ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : toast.type === "warning"
                ? "bg-orange-600"
                : "bg-blue-600"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
};
