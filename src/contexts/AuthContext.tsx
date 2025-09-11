/**
 * Authentication context providing login, signup, and user session management
 * @module AuthContext
 */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAllUsers, // Added to sync budget updates
} from "../api/user-controller/user-controller";
import type { UserResponse } from "../api/model";
import { authAPI, authService } from "../services/AuthService";
import { guestService } from "../services/GuestService";
import { guestCartService } from "../services/GuestCartService";
import { migrateGuestData } from "../api/authentication/authentication";
import { createCartForUser } from "../api/build-cart-controller/build-cart-controller";
import { createItem as createCartItem } from "../api/cart-item-controller/cart-item-controller";

// Authentication types
interface AuthUser extends UserResponse {
  // Authentication state can be extended with roles and permissions
  isAuthenticated: true;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  budget?: number;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface AuthContextType {
  // Current state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;

  // Actions
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    userData: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    passwordData: ChangePasswordData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Guest mode actions
  initializeGuestMode: () => Promise<void>;
  migrateGuestToUser: () => Promise<{ success: boolean; error?: string }>;

  // JWT authentication methods
  refreshToken?: () => Promise<boolean>;
  getAuthHeaders?: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Keep authUser budget in sync with backend data after purchases
  const { data: allUsersData } = useGetAllUsers({
    query: {
      enabled: !!user?.isAuthenticated, // Only fetch when authenticated
      staleTime: 0, // Always refetch to get latest budget
    },
  });


  // Initialize auth state from localStorage on mount and setup axios interceptors
  useEffect(() => {
    initializeAuth();
    
    // Setup axios interceptors for JWT tokens
    authService.setupAxiosInterceptors();
  }, []);


  // Sync authUser budget with latest backend data when users data updates
  useEffect(() => {
    if (user?.isAuthenticated && allUsersData?.data) {
      const updatedUserData = allUsersData.data.find((u) => u.id === user.id);
      if (updatedUserData && updatedUserData.budget !== user.budget) {
        // Update the auth user with fresh budget data
        const updatedAuthUser: AuthUser = {
          ...user,
          budget: updatedUserData.budget,
        };
        setUser(updatedAuthUser);
        saveAuthState(updatedUserData); // Persist updated budget to localStorage
      }
    }
  }, [allUsersData, user]);

  const initializeAuth = async () => {
    try {
      // Check localStorage for existing session
      const storedAuth = localStorage.getItem("rigarchitect_auth");
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);

        // JWT token validation would be performed here
        // For now, just check if we have user data
        if (authData.user && authData.user.id) {
          setUser({ ...authData.user, isAuthenticated: true });
          setIsGuest(false);
          setIsLoading(false);
          return;
        }
      }

      // If no authenticated user, initialize guest mode
      await initializeGuestMode();
    } catch (error) {
      console.error("Error initializing auth:", error);
      // Clear corrupted auth data
      localStorage.removeItem("rigarchitect_auth");
      // Fall back to guest mode
      await initializeGuestMode();
    }
  };

  const saveAuthState = (userData: UserResponse) => {
    // For now, save user data to localStorage
    // JWT tokens would be saved here in a production system
    const authData = {
      user: userData,
      // Additional token data would be included here
      timestamp: Date.now(),
    };
    localStorage.setItem("rigarchitect_auth", JSON.stringify(authData));
  };

  const clearAuthState = () => {
    localStorage.removeItem("rigarchitect_auth");
    // Clear JWT tokens
    localStorage.removeItem("rigarchitect_access_token");
    localStorage.removeItem("rigarchitect_refresh_token");
    localStorage.removeItem("rigarchitect_token_expiry");
  };

  const initializeGuestMode = async () => {
    try {
      // Initialize guest session
      await guestService.ensureValidSession();
      setIsGuest(true);
      setUser(null);
    } catch (error) {
      console.error("Error initializing guest mode:", error);
      setIsGuest(true);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateGuestToUser = async (userData: UserResponse): Promise<{ success: boolean; error?: string }> => {
    try {
      const sessionId = guestService.getSessionForMigration();
      if (!sessionId) {
        return {
          success: false,
          error: "No guest session found to migrate"
        };
      }

      // Save guest cart data before migration
      const guestCartData = guestCartService.exportCartData();
      
      // Migrate guest data to user account (builds, etc.)
      await migrateGuestData({
        sessionId
      });

      // Clear guest session and cart
      guestService.clearSession();
      guestCartService.clearCart();
      setIsGuest(false);

      // Migrate guest cart to authenticated user cart
      if (guestCartData && guestCartData.items && guestCartData.items.length > 0) {
        try {
          // Create a shopping cart for the new user
          const newCartResponse = await createCartForUser(
            userData.id, 
            { name: "Shopping Cart", status: "DRAFT" }
          );
          
          const cartId = newCartResponse.data.id;
          
          // Add all guest cart items to the new user cart
          for (const item of guestCartData.items) {
            await createCartItem({
              cartId,
              componentId: item.component.id,
              quantity: item.quantity
            });
          }
          
          // Invalidate cart queries to refresh UI
          queryClient.invalidateQueries({
            queryKey: [`/api/v1/carts/user/${userData.id}`],
          });
          queryClient.invalidateQueries({
            queryKey: [`/api/v1/items/cart/${cartId}`],
          });
        } catch (error) {
          console.error("Error migrating guest cart:", error);
          // Don't fail the entire migration if cart migration fails
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error migrating guest data:", error);
      return {
        success: false,
        error: "Failed to migrate guest data"
      };
    }
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Use JWT authentication
      const response = await authAPI.login(credentials.email, credentials.password);
      
      // Store JWT tokens
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem("rigarchitect_access_token", response.accessToken);
        localStorage.setItem("rigarchitect_refresh_token", response.refreshToken);
        localStorage.setItem("rigarchitect_token_expiry", response.expiresAt.toString());
      }

      // Set authenticated user
      const authUser: AuthUser = {
        ...response.user,
        isAuthenticated: true,
      };
      setUser(authUser);
      setIsGuest(false);
      saveAuthState(response.user);

      // Migrate guest data if user was previously a guest
      if (isGuest) {
        await migrateGuestToUser(response.user);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }
      
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    userData: SignUpData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Use JWT signup
      const response = await authAPI.signup({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        budget: userData.budget || 5000,
      });

      // Store JWT tokens
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem("rigarchitect_access_token", response.accessToken);
        localStorage.setItem("rigarchitect_refresh_token", response.refreshToken);
        localStorage.setItem("rigarchitect_token_expiry", response.expiresAt.toString());
      }

      // Set authenticated user (auto-login after signup)
      const authUser: AuthUser = {
        ...response.user,
        isAuthenticated: true,
      };
      setUser(authUser);
      setIsGuest(false);
      saveAuthState(response.user);

      // Migrate guest data if user was previously a guest
      if (isGuest) {
        await migrateGuestToUser(response.user);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Signup error:", error);

      // Handle specific error cases
      if (error.response?.status === 409) {
        return {
          success: false,
          error: "An account with this email already exists",
        };
      }

      return {
        success: false,
        error: "Signup failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    passwordData: ChangePasswordData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      return { success: true };
    } catch (error: any) {
      console.error("Password change error:", error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: "You must be logged in to change your password",
        };
      }
      
      return {
        success: false,
        error: "Failed to change password. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    clearAuthState();

    // Clear all cached data
    queryClient.clear();

    // Reinitialize guest mode after logout
    await initializeGuestMode();

    // Server-side token invalidation would occur here
  };


  // JWT utility methods
  const getAuthHeaders = (): Record<string, string> => {
    // JWT token would be included in Authorization header
    return {
      // 'Authorization': `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  };

  const refreshToken = async (): Promise<boolean> => {
    // JWT token refresh logic would be implemented here
    return true;
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user?.isAuthenticated,
    isGuest,
    isLoading: isLoading,
    login,
    signup,
    changePassword,
    logout,
    // Guest mode methods
    initializeGuestMode,
    migrateGuestToUser,
    // JWT methods
    getAuthHeaders,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper hooks for common use cases
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useIsGuest = () => {
  const { isGuest } = useAuth();
  return isGuest;
};

export const useAuthMode = () => {
  const { isAuthenticated, isGuest } = useAuth();
  return {
    isAuthenticated,
    isGuest,
    mode: isAuthenticated ? 'authenticated' : isGuest ? 'guest' : 'loading'
  };
};
