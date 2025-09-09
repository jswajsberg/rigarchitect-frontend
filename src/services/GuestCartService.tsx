/**
 * Guest cart service for managing shopping cart in localStorage for anonymous users
 * @module GuestCartService
 */
import type { ComponentResponse } from '../api/model';
import { guestService } from './GuestService';

export interface GuestCartItem {
  id: string;
  component: ComponentResponse;
  quantity: number;
  addedAt: Date;
}

export interface GuestCart {
  items: GuestCartItem[];
  totalPrice: number;
  totalItems: number;
  updatedAt: Date;
}

class GuestCartService {
  private static instance: GuestCartService;
  private cart: GuestCart | null = null;
  private readonly STORAGE_KEY = 'rigarchitect_guest_cart';

  private constructor() {
    this.initializeCart();
  }

  static getInstance(): GuestCartService {
    if (!GuestCartService.instance) {
      GuestCartService.instance = new GuestCartService();
    }
    return GuestCartService.instance;
  }

  /**
   * Initialize cart from localStorage
   */
  private initializeCart() {
    try {
      const storedCart = localStorage.getItem(this.STORAGE_KEY);
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        this.cart = {
          ...cartData,
          items: cartData.items.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          })),
          updatedAt: new Date(cartData.updatedAt)
        };
      } else {
        this.cart = this.createEmptyCart();
      }
    } catch (error) {
      console.error('Error initializing guest cart:', error);
      this.cart = this.createEmptyCart();
    }
  }

  /**
   * Create empty cart structure
   */
  private createEmptyCart(): GuestCart {
    return {
      items: [],
      totalPrice: 0,
      totalItems: 0,
      updatedAt: new Date()
    };
  }

  /**
   * Save cart to localStorage
   */
  private saveCart() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cart));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }

  /**
   * Recalculate cart totals
   */
  private recalculateTotals() {
    if (!this.cart) return;

    this.cart.totalItems = this.cart.items.reduce((total, item) => total + item.quantity, 0);
    this.cart.totalPrice = this.cart.items.reduce((total, item) => {
      return total + (item.component.price * item.quantity);
    }, 0);
    this.cart.updatedAt = new Date();
  }

  /**
   * Get current cart
   * @returns Current guest cart state
   */
  getCart(): GuestCart {
    if (!this.cart) {
      this.initializeCart();
    }
    return this.cart!;
  }

  /**
   * Add item to cart
   * @param component The component to add to cart
   * @param quantity The quantity to add (defaults to 1)
   * @returns The added or updated cart item
   */
  addItem(component: ComponentResponse, quantity: number = 1): GuestCartItem {
    if (!this.cart) {
      this.initializeCart();
    }

    // Check if item already exists
    const existingItemIndex = this.cart!.items.findIndex(
      item => item.component.id === component.id
    );

    let updatedItem: GuestCartItem;

    if (existingItemIndex >= 0) {
      // Update existing item
      this.cart!.items[existingItemIndex].quantity += quantity;
      updatedItem = this.cart!.items[existingItemIndex];
    } else {
      // Add new item
      updatedItem = {
        id: `guest_item_${component.id}_${Date.now()}`,
        component,
        quantity,
        addedAt: new Date()
      };
      this.cart!.items.push(updatedItem);
    }

    this.recalculateTotals();
    this.saveCart();

    return updatedItem;
  }

  /**
   * Update item quantity
   * @param itemId The ID of the cart item to update
   * @param quantity The new quantity (removes item if <= 0)
   * @returns True if update was successful, false if item not found
   */
  updateItemQuantity(itemId: string, quantity: number): boolean {
    if (!this.cart) return false;

    const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    this.cart.items[itemIndex].quantity = quantity;
    this.recalculateTotals();
    this.saveCart();

    return true;
  }

  /**
   * Remove item from cart
   * @param itemId The ID of the cart item to remove
   * @returns True if removal was successful, false if item not found
   */
  removeItem(itemId: string): boolean {
    if (!this.cart) return false;

    const itemIndex = this.cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    this.cart.items.splice(itemIndex, 1);
    this.recalculateTotals();
    this.saveCart();

    return true;
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cart = this.createEmptyCart();
    this.saveCart();
  }

  /**
   * Get cart item count
   * @returns Total number of items in cart
   */
  getItemCount(): number {
    return this.cart?.totalItems || 0;
  }

  /**
   * Get cart total price
   * @returns Total price of all items in cart
   */
  getTotalPrice(): number {
    return this.cart?.totalPrice || 0;
  }

  /**
   * Check if cart is empty
   * @returns True if cart has no items, false otherwise
   */
  isEmpty(): boolean {
    return !this.cart || this.cart.items.length === 0;
  }

  /**
   * Get cart items
   * @returns Array of all cart items
   */
  getItems(): GuestCartItem[] {
    return this.cart?.items || [];
  }

  /**
   * Find item by component ID
   * @param componentId The component ID to search for
   * @returns Cart item if found, undefined otherwise
   */
  findItemByComponentId(componentId: number): GuestCartItem | undefined {
    return this.cart?.items.find(item => item.component.id === componentId);
  }

  /**
   * Convert cart to build format for persistence
   * @param buildName Name for the saved build (defaults to 'My Cart Build')
   * @returns Promise that resolves when build is saved
   * @throws Error if cart is empty
   */
  async saveCartAsBuild(buildName: string = 'My Cart Build'): Promise<void> {
    if (!this.cart || this.cart.items.length === 0) {
      throw new Error('Cannot save empty cart as build');
    }

    const buildData = {
      name: buildName,
      components: this.cart.items.map(item => ({
        ...item.component,
        quantity: item.quantity
      })),
      totalPrice: this.cart.totalPrice,
      createdFrom: 'cart',
      createdAt: new Date()
    };

    await guestService.saveBuild(buildData);
  }

  /**
   * Load build into cart
   * @param buildData Build data containing components array
   */
  loadBuildIntoCart(buildData: any): void {
    this.clearCart();
    
    if (buildData.components && Array.isArray(buildData.components)) {
      buildData.components.forEach((component: any) => {
        this.addItem(component, component.quantity || 1);
      });
    }
  }

  /**
   * Export cart data for migration
   * @returns Cart data object for migration to user account
   */
  exportCartData(): any {
    return {
      items: this.cart?.items || [],
      totalPrice: this.cart?.totalPrice || 0,
      totalItems: this.cart?.totalItems || 0,
      updatedAt: this.cart?.updatedAt || new Date()
    };
  }

  /**
   * Import cart data (for migration from guest to user)
   * @param cartData Cart data to import
   */
  importCartData(cartData: any): void {
    try {
      this.cart = {
        items: cartData.items || [],
        totalPrice: cartData.totalPrice || 0,
        totalItems: cartData.totalItems || 0,
        updatedAt: new Date(cartData.updatedAt) || new Date()
      };
      this.saveCart();
    } catch (error) {
      console.error('Error importing cart data:', error);
      this.cart = this.createEmptyCart();
    }
  }
}

// Export singleton instance
export const guestCartService = GuestCartService.getInstance();

// Export utility hooks
export const useGuestCart = () => {
  const getCart = () => guestCartService.getCart();
  const addItem = (component: ComponentResponse, quantity?: number) => 
    guestCartService.addItem(component, quantity);
  const updateQuantity = (itemId: string, quantity: number) => 
    guestCartService.updateItemQuantity(itemId, quantity);
  const removeItem = (itemId: string) => 
    guestCartService.removeItem(itemId);
  const clearCart = () => guestCartService.clearCart();
  const saveAsBuild = (name?: string) => guestCartService.saveCartAsBuild(name);
  const loadBuild = (buildData: any) => guestCartService.loadBuildIntoCart(buildData);

  return {
    getCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    saveAsBuild,
    loadBuild,
    itemCount: guestCartService.getItemCount(),
    totalPrice: guestCartService.getTotalPrice(),
    isEmpty: guestCartService.isEmpty()
  };
};