// src/contexts/CartContext.tsx - WITH CART ITEMS SUPPORT
import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import { useCreateItem } from "../api/cart-item-controller/cart-item-controller";
import type {
  ComponentResponse,
  BuildCartResponse,
  CartItemRequest,
} from "../api/model";

const CURRENT_USER_ID = 1;

interface CartContextType {
  currentCart: BuildCartResponse | null;
  activeCarts: BuildCartResponse[];
  selectedCartId: number | null;
  addToCart: (component: ComponentResponse, quantity?: number) => Promise<void>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  selectCart: (cartId: number) => void; // Add this method
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
  type: "success" | "error" | "info";
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<number | null>(null);

  const {
    data: userCarts,
    isLoading,
    error,
  } = useGetUserCarts(CURRENT_USER_ID);
  const createCartMutation = useCreateCartForUser();
  const createItemMutation = useCreateItem();

  // Debug logging
  console.log("🛒 CartProvider Debug:", {
    userCarts: userCarts?.data,
    isLoading,
    error: error?.message,
    createCartMutation: createCartMutation.status,
    createItemMutation: createItemMutation.status,
  });

  const activeCarts =
    userCarts?.data?.filter((cart) => cart.status === "ACTIVE") || [];
  const currentCart =
    activeCarts.find((cart) => cart.id === selectedCartId) ||
    activeCarts[0] ||
    null;

  console.log("🛒 Cart State:", {
    activeCarts: activeCarts.length,
    selectedCartId,
    currentCart: currentCart?.id,
    currentCartName: currentCart?.name,
    currentCartTotal: currentCart?.totalPrice,
  });

  const selectCart = (cartId: number) => {
    setSelectedCartId(cartId);
  };

  const showToast = (message: string, type: "success" | "error" | "info") => {
    console.log("📱 Toast:", type, message);
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
    console.log("🛒 AddToCart called:", {
      componentId: component.id,
      componentName: component.name,
      quantity,
      currentCart: currentCart?.id,
    });

    try {
      let targetCart = currentCart;

      if (!targetCart) {
        console.log("🛒 No cart exists, creating new one...");
        const newCartResponse = await createCartMutation.mutateAsync({
          userId: CURRENT_USER_ID,
          data: { name: "My Build Cart", status: "ACTIVE" },
        });
        targetCart = newCartResponse.data;
        setSelectedCartId(targetCart.id!); // Auto-select the new cart
        console.log("🛒 Created new cart:", targetCart);
        showToast("Created new cart automatically", "info");
      }

      console.log("🛒 Adding item to cart:", {
        cartId: targetCart.id,
        componentId: component.id,
        quantity,
      });

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId: component.id!,
        quantity,
      };

      const result = await createItemMutation.mutateAsync({
        data: cartItemRequest,
      });
      console.log("🛒 Item added successfully:", result);

      // Refresh both cart data and cart items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });

      // Force refresh cart data after a brief delay to ensure backend has updated
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${CURRENT_USER_ID}`],
        });
      }, 500);

      showToast(`Added ${component.name} to cart!`, "success");
    } catch (error: any) {
      console.error("🛒 Failed to add to cart:", error);
      console.error("🛒 Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      // Handle duplicate item - show friendly message
      if (
        error.response?.status === 500 &&
        error.message.includes("duplicate key")
      ) {
        showToast(`${component.name} is already in your cart!`, "info");
      } else {
        showToast(
          `Failed to add item to cart: ${
            error.response?.data?.message || error.message
          }`,
          "error"
        );
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        currentCart,
        activeCarts,
        selectedCartId,
        addToCart,
        showToast,
        selectCart,
      }}
    >
      {children}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
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
