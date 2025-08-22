// src/contexts/UserContext.tsx
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
import type { UserResponse } from "../api/model";

interface UserContextType {
  // Current selected user
  selectedUser: UserResponse | null;

  // All available users
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
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // Fetch all users for selection
  const {
    data: allUsersData,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetAllUsers();

  // Fetch current user (default selection)
  const {
    data: currentUserData,
    isLoading: isLoadingCurrentUser,
    error: currentUserError,
  } = useGetCurrentUser();

  // Set initial selected user when current user data loads
  useEffect(() => {
    if (currentUserData?.data && !selectedUser) {
      setSelectedUser(currentUserData.data);
    }
  }, [currentUserData, selectedUser]);

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
