/* eslint-disable react-refresh/only-export-components */
// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetUserByEmail,
  useCreateUser,
  useGetAllUsers, // Added to sync budget updates
} from "../api/user-controller/user-controller";
import type { UserResponse, UserRequest } from "../api/model";

// Authentication types
interface AuthUser extends UserResponse {
  // Future: can add JWT tokens, roles, permissions here
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

interface AuthContextType {
  // Current state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    userData: SignUpData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Debug/Development features
  quickLogin: (user: UserResponse) => void;

  // Future JWT methods (placeholders for easy integration)
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
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Get user by email query (only runs when we have a pending email)
  const {
    data: userByEmailData,
    isLoading: emailQueryLoading,
    error: emailQueryError,
    refetch: refetchUserByEmail,
  } = useGetUserByEmail(pendingEmail || "", {
    query: {
      enabled: !!pendingEmail,
      retry: false,
    },
  });

  // Keep authUser budget in sync with backend data after purchases
  const { data: allUsersData } = useGetAllUsers({
    query: {
      enabled: !!user?.isAuthenticated, // Only fetch when authenticated
      staleTime: 0, // Always refetch to get latest budget
    },
  });

  // Create user mutation
  const createUserMutation = useCreateUser({
    mutation: {
      onSuccess: (response) => {
        if (response.data) {
          // Auto-login after successful signup
          setUser({ ...response.data, isAuthenticated: true });
          setPendingEmail(null);
          saveAuthState(response.data);
        }
      },
    },
  });

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle user by email query result
  useEffect(() => {
    if (userByEmailData?.data && pendingEmail) {
      // User found - complete login
      const authUser: AuthUser = {
        ...userByEmailData.data,
        isAuthenticated: true,
      };
      setUser(authUser);
      setPendingEmail(null);
      saveAuthState(userByEmailData.data);
    }
  }, [userByEmailData, pendingEmail]);

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

        // Future: Validate JWT token here
        // For now, just check if we have user data
        if (authData.user && authData.user.id) {
          setUser({ ...authData.user, isAuthenticated: true });
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      // Clear corrupted auth data
      localStorage.removeItem("rigarchitect_auth");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = (userData: UserResponse) => {
    // For now, save user data to localStorage
    // Future: Save JWT tokens here instead
    const authData = {
      user: userData,
      // Future: add tokens, expiry, etc.
      timestamp: Date.now(),
    };
    localStorage.setItem("rigarchitect_auth", JSON.stringify(authData));
  };

  const clearAuthState = () => {
    localStorage.removeItem("rigarchitect_auth");
    // Future: Clear JWT tokens from httpOnly cookies or secure storage
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // For now, we just check if user exists by email
      // Future: Send credentials to JWT authentication endpoint
      setPendingEmail(credentials.email);

      // Trigger the user lookup
      await refetchUserByEmail();

      // The useEffect will handle the success case
      if (emailQueryError) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
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

      const userRequest: UserRequest = {
        name: userData.name,
        email: userData.email,
        budget: userData.budget || 5000, // Default budget
        // Future: password will be sent to backend for hashing
        // For now, backend creates placeholder password
      };

      await createUserMutation.mutateAsync({ data: userRequest });

      return { success: true };
    } catch (error: unknown) {
      console.error("Signup error:", error);

      // Handle specific error cases
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 409
      ) {
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

  const logout = () => {
    setUser(null);
    clearAuthState();

    // Clear all cached data
    queryClient.clear();

    // Future: Invalidate JWT tokens on server
  };

  const quickLogin = (userData: UserResponse) => {
    // Debug/development feature - bypass normal login flow
    const authUser: AuthUser = {
      ...userData,
      isAuthenticated: true,
    };
    setUser(authUser);
    saveAuthState(userData);
  };

  // Future JWT utility methods (placeholders)
  const getAuthHeaders = (): Record<string, string> => {
    // Future: Return JWT token in Authorization header
    return {
      // 'Authorization': `Bearer ${jwtToken}`,
      "Content-Type": "application/json",
    };
  };

  const refreshToken = async (): Promise<boolean> => {
    // Future: Refresh JWT token logic
    return true;
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user?.isAuthenticated,
    isLoading: isLoading || emailQueryLoading || createUserMutation.isPending,
    login,
    signup,
    logout,
    quickLogin,
    // Future JWT methods
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
