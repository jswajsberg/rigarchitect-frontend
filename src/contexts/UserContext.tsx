/**
 * User context for managing user selection and multi-user functionality
 * @module UserContext
 */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  useGetAllUsers,
  useGetCurrentUser,
} from "../api/user-controller/user-controller";
import { useAuth } from "./AuthContext";
import type { UserResponse } from "../api/model";

interface UserContextType {
  // Current selected user (for admin/multi-user management)
  selectedUser: UserResponse | null;

  // All available users (for admin features)
  allUsers: UserResponse[];

  // Loading states
  isLoadingUsers: boolean;
  isLoadingCurrentUser: boolean;

  // Actions
  selectUser: (user: UserResponse) => void;
  refreshUsers: () => void;

  // Errors
  usersError: Error | null;
  currentUserError: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user: authUser, isAuthenticated } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // Fetch all users for admin/selection features
  const {
    data: allUsersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAllUsers({
    query: {
      enabled: isAuthenticated, // Only fetch if authenticated
    },
  });

  // Fetch current user (fallback for when auth user isn't available)
  const {
    data: currentUserData,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
  } = useGetCurrentUser({
    query: {
      enabled: isAuthenticated && !authUser, // Only if authenticated but no auth user
    },
  });

  // Set initial selected user based on authenticated user or current user
  useEffect(() => {
    if (isAuthenticated) {
      if (authUser && !selectedUser) {
        // Use authenticated user as selected user
        setSelectedUser(authUser);
      } else if (currentUserData?.data && !selectedUser && !authUser) {
        // Fallback to current user endpoint
        setSelectedUser(currentUserData.data);
      }
    } else {
      // Clear selected user when not authenticated
      setSelectedUser(null);
    }
  }, [authUser, currentUserData, selectedUser, isAuthenticated]);

  // Extract users array from response
  const allUsers = allUsersData?.data || [];

  const selectUser = (user: UserResponse) => {
    setSelectedUser(user);
  };

  const refreshUsers = () => {
    refetchUsers();
  };

  const contextValue: UserContextType = {
    selectedUser,
    allUsers,
    isLoadingUsers,
    isLoadingCurrentUser,
    selectUser,
    refreshUsers,
    usersError: usersError as Error | null,
    currentUserError: currentUserError as Error | null,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// Helper hooks for common use cases
export const useSelectedUser = () => {
  const { selectedUser } = useUserContext();
  return selectedUser;
};

export const useSelectedUserId = () => {
  const { selectedUser } = useUserContext();
  return selectedUser?.id || null;
};

// New helper hooks that prioritize auth user
export const useCurrentUser = () => {
  const { user: authUser } = useAuth();
  const { selectedUser } = useUserContext();

  // Return authenticated user first, then selected user
  return authUser || selectedUser;
};

export const useCurrentUserId = () => {
  const currentUser = useCurrentUser();
  return currentUser?.id || null;
};
