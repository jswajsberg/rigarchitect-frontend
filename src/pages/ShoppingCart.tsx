/**
 * Shopping cart page for managing checkout items
 * @returns {JSX.Element} Shopping cart with item management and checkout functionality
 */
import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedUserId } from "../contexts/UserContext";
import { useAuthMode } from "../contexts/AuthContext";
import { useGuestCart } from "../services/GuestCartService";
import {
  useGetUserCarts,
  useCreateCartForUser,
} from "../api/build-cart-controller/build-cart-controller";
import {
  useCreateItem,
  useUpdateQuantity,
  useDeleteItem,
  useGetItemsByCart,
  useClearCart,
} from "../api/cart-item-controller/cart-item-controller";
import { useSharedData } from "../contexts/SharedDataContext";
import type { ComponentResponse, CartItemRequest } from "../api/model";
import CheckoutModal from "../modals/CheckoutModal";
import ConfirmModal from "../modals/ConfirmModal";
import {
  ShoppingCart as ShoppingCartIcon,
  Package,
  DollarSign,
  Trash2,
  Plus,
  Minus,
  X,
  CreditCard,
  Lightbulb,
  User,
  AlertTriangle,
  Loader2,
  Wrench,
  // Component type icons (consistent with other pages)
  Cpu, // CPU
  Monitor, // GPU
  HardDrive, // RAM
  Database, // SSD
  Archive, // HDD
  CircuitBoard, // Motherboard
  Zap, // PSU
  Box, // Case
  Wind, // Cooler
} from "lucide-react";

interface ShoppingCartProps {
  openAuthModal?: (mode?: "login" | "signup") => void;
  setActiveTab?: (tab: string) => void;
}

const ShoppingCart = React.memo(({ openAuthModal, setActiveTab }: ShoppingCartProps) => {
  const queryClient = useQueryClient();
  const { isGuest } = useAuthMode();
  const selectedUserId = useSelectedUserId();
  const guestCart = useGuestCart();
  const [addComponentId, setAddComponentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });

  // Hooks must be called before any conditional logic
  const {
    data: userCarts,
    isLoading: cartsLoading,
    error: cartsError,
  } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId },
  });

  const { allComponents } = useSharedData();

  // Mutations
  const createCartMutation = useCreateCartForUser();
  const createItemMutation = useCreateItem();
  const updateQuantityMutation = useUpdateQuantity();
  const deleteItemMutation = useDeleteItem();
  const clearCartMutation = useClearCart();

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

  // Component type icon configuration (consistent with other pages)
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
      setModalMessage({
        title: "Cart Creation Failed",
        message: `Failed to create shopping cart: ${
          error.response?.data?.message || error.message
        }`
      });
      setShowError(true);
      return null;
    }
  };

  // Event handlers
  const handleQuickAdd = async () => {
    if (!addComponentId || !selectedUserId) return;

    try {
      // Ensure shopping cart exists
      let targetCart = shoppingCart;
      if (!targetCart) {
        targetCart = await ensureShoppingCart();
        if (!targetCart) return;
      }

      const cartItemRequest: CartItemRequest = {
        cartId: targetCart.id!,
        componentId: parseInt(addComponentId),
        quantity: addQuantity,
      };

      await createItemMutation.mutateAsync({ data: cartItemRequest });

      // Reset form and refresh data
      setAddComponentId("");
      setAddQuantity(1);
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetCart.id}`],
      });

      setModalMessage({
        title: "Component Added",
        message: "Component added to cart!"
      });
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Failed to add component:", error);
      setModalMessage({
        title: "Add Component Failed",
        message: `Failed to add component: ${
          error.response?.data?.message || error.message
        }`
      });
      setShowError(true);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateQuantityMutation.mutateAsync({
        id: itemId,
        data: { quantity: newQuantity },
      });

      // Refresh cart data
      if (shoppingCart) {
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/items/cart/${shoppingCart.id}`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });
      }
    } catch (error: any) {
      console.error("Failed to update quantity:", error);
      setModalMessage({
        title: "Update Quantity Failed",
        message: `Failed to update quantity: ${
          error.response?.data?.message || error.message
        }`
      });
      setShowError(true);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await deleteItemMutation.mutateAsync({ id: itemId });

      // Refresh cart data
      if (shoppingCart) {
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/items/cart/${shoppingCart.id}`],
        });
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });
      }

      setModalMessage({
        title: "Item Removed",
        message: "Item removed from cart"
      });
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      setModalMessage({
        title: "Remove Item Failed",
        message: `Failed to remove item: ${
          error.response?.data?.message || error.message
        }`
      });
      setShowError(true);
    }
  };

  const handleClearCart = async () => {
    if (!shoppingCart) return;
    setShowClearConfirm(true);
  };

  const handleClearConfirmed = async () => {
    if (!shoppingCart) return;

    try {
      await clearCartMutation.mutateAsync({ cartId: shoppingCart.id! });

      // Refresh cart data and items
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${shoppingCart.id}`],
      });

      // Success handled by modal closing
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
      // Error handling could be improved with a toast or error modal
    } finally {
      setShowClearConfirm(false);
    }
  };

  const handleCheckout = () => {
    if (!shoppingCart || cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  // Handle conditional rendering after all hooks are called
  if (!selectedUserId && !isGuest) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <User size={48} className="text-yellow-600 mx-auto mb-4" />
          <h3 className="text-yellow-800 font-semibold text-lg mb-2">
            No User Selected
          </h3>
          <p className="text-yellow-600">
            Please select a user to view shopping cart.
          </p>
        </div>
      </div>
    );
  }

  if (cartsLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <div className="ml-4 text-lg text-gray-600">
            Loading your shopping cart...
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
            Error loading cart
          </h3>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Render guest cart if in guest mode
  if (isGuest) {
    const guestCartData = guestCart.getCart();
    const guestItems = guestCartData.items;

    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Guest Cart Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCartIcon size={32} className="text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
            <span className="bg-amber-100 text-amber-800 text-sm px-2 py-1 rounded-full">
              Guest Mode
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            Review your selected components. Sign up to checkout and save your cart!
          </p>
          {guestItems.length > 0 && (
            <div className="flex items-center gap-2 text-xl font-semibold text-green-600 mt-3">
              <DollarSign size={24} />
              Total: ${guestCartData.totalPrice.toFixed(2)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    <h3 className="text-xl font-semibold">Cart Items</h3>
                    {guestItems.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                        {guestItems.length}
                      </span>
                    )}
                  </div>
                  {guestItems.length > 0 && (
                    <button
                      onClick={() => {
                        guestCart.clearCart();
                        setModalMessage({
                          title: "Success",
                          message: "Cart cleared successfully!"
                        });
                        setShowSuccess(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors"
                      title="Remove all items from cart"
                    >
                      <Trash2 size={16} />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {guestItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCartIcon size={48} className="text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-500 mb-2">Your cart is empty</h4>
                    <p className="text-gray-400">Browse components and add items to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guestItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.component.name}</h4>
                          <p className="text-sm text-gray-600">{item.component.brand}</p>
                          <p className="text-sm font-medium text-green-600">
                            ${item.component.price.toFixed(2)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newQuantity = Math.max(1, item.quantity - 1);
                              guestCart.updateQuantity(item.id, newQuantity);
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => {
                              guestCart.updateQuantity(item.id, item.quantity + 1);
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${(item.component.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => {
                              guestCart.removeItem(item.id);
                              setModalMessage({
                                title: "Success",
                                message: `${item.component.name} removed from cart!`
                              });
                              setShowSuccess(true);
                            }}
                            className="text-red-600 hover:text-red-800 mt-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Guest Cart Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h3 className="text-lg font-semibold mb-4">Cart Actions</h3>
              
              {guestItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={20} className="text-amber-600" />
                      <p className="font-medium text-amber-800">Sign up to checkout</p>
                    </div>
                    <p className="text-sm text-amber-700">
                      Create an account to complete your purchase and save your cart for later.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => openAuthModal && openAuthModal("signup")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CreditCard size={20} />
                    Sign Up to Checkout
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={20} className="text-blue-600" />
                      <p className="font-medium text-blue-800">Start shopping</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      Browse our components or use the PC Builder to create your perfect setup!
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab && setActiveTab("components")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Package size={18} />
                      Browse Components
                    </button>
                    
                    <button
                      onClick={() => setActiveTab && setActiveTab("builds")}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Wrench size={18} />
                      Build PC
                    </button>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Create an account to save your builds and checkout
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCartIcon size={32} className="text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Shopping Cart</h2>
        </div>
        <p className="text-gray-600 mt-2">
          Review your selected components and checkout when ready
        </p>
        {shoppingCart && cartItems.length > 0 && (
          <div className="flex items-center gap-2 text-xl font-semibold text-green-600 mt-3">
            <DollarSign size={24} />
            Total: ${shoppingCart.totalPrice?.toFixed(2) || "0.00"}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Cart Items - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  <h3 className="text-xl font-semibold">Cart Items</h3>
                  {cartItems.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                      {cartItems.length}
                    </span>
                  )}
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    disabled={clearCartMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300 text-sm transition-colors"
                    title="Remove all items from cart"
                  >
                    <Trash2 size={16} />
                    {clearCartMutation.isPending ? "Clearing..." : "Clear All"}
                  </button>
                )}
              </div>
              {itemsLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                  <Loader2 size={16} className="animate-spin" />
                  Loading items...
                </div>
              )}
            </div>

            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon
                    size={64}
                    className="text-gray-300 mx-auto mb-4"
                  />
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
                    const component = allComponents?.find(
                      (c: ComponentResponse) => c.id === item.componentId
                    );
                    const iconConfig = getComponentTypeIcon(component?.type);
                    const IconComponent = iconConfig.icon;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Enhanced component icon */}
                          <IconComponent
                            size={28}
                            className={iconConfig.colorClass}
                          />
                          <div>
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
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Enhanced Quantity Controls */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id!,
                                  Math.max(1, (item.quantity || 1) - 1)
                                )
                              }
                              disabled={
                                item.quantity === 1 ||
                                updateQuantityMutation.isPending
                              }
                              className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-12 text-center font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.id!,
                                  (item.quantity || 1) + 1
                                )
                              }
                              disabled={updateQuantityMutation.isPending}
                              className="w-8 h-8 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[100px]">
                            <div className="text-sm text-gray-500">
                              Line Total
                            </div>
                            <div className="font-bold text-gray-900 text-lg">
                              $
                              {(
                                (component?.price || 0) * (item.quantity || 1)
                              ).toFixed(2)}
                            </div>
                          </div>

                          {/* Enhanced Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id!)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Remove this item from cart"
                          >
                            <X size={16} />
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

        {/* Enhanced Sidebar - Quick Add & Checkout - Takes 1 column */}
        <div className="space-y-6">
          {/* Enhanced Quick Add Component Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <Plus size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold">Quick Add</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Add individual components directly to your cart
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Component
                </label>
                <select
                  value={addComponentId}
                  onChange={(e) => setAddComponentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a component...</option>
                  {allComponents
                    ?.filter(
                      (c: ComponentResponse) =>
                        c.stockQuantity && c.stockQuantity > 0
                    )
                    .map((comp: ComponentResponse) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.type} - {comp.name} (${comp.price?.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                    disabled={addQuantity <= 1}
                    className="w-8 h-8 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={addQuantity}
                    onChange={(e) =>
                      setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                    className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setAddQuantity(addQuantity + 1)}
                    className="w-8 h-8 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={!addComponentId || createItemMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {createItemMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {createItemMutation.isPending ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* Enhanced Checkout Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold">Checkout</h3>
            </div>

            {/* Cart Summary */}
            {cartItems.length > 0 ? (
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ${(shoppingCart?.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${(shoppingCart?.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 mb-6">
                <Package size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No items in cart</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <CreditCard size={18} />
              {cartItems.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
            </button>

            {cartItems.length > 0 && (
              <div className="text-xs text-gray-500 mt-2 text-center">
                Tax will be calculated at checkout
              </div>
            )}
          </div>

          {/* Enhanced Help Text */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">
                Shopping Cart Tips
              </h4>
            </div>
            <ul className="text-xs text-blue-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Add components from your saved builds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Add individual components using Quick Add
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Mix and match from different sources
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Items stay in cart until checkout or removed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Use "Clear All" to quickly empty your cart
              </li>
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

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearConfirmed}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Success Modal */}
      <ConfirmModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onConfirm={() => setShowSuccess(false)}
        title={modalMessage.title}
        message={modalMessage.message}
        confirmText="OK"
        variant="info"
      />

      {/* Error Modal */}
      <ConfirmModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        onConfirm={() => setShowError(false)}
        title={modalMessage.title}
        message={modalMessage.message}
        confirmText="OK"
        variant="danger"
      />
    </div>
  );
});

export default ShoppingCart;
