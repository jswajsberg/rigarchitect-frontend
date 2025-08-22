// src/components/UserSelector.tsx
import React from "react";
import { useUserContext } from "../contexts/UserContext";
import type { UserResponse } from "../api/model";

const UserSelector: React.FC = () => {
  const { selectedUser, allUsers, isLoadingUsers, selectUser, usersError } =
    useUserContext();

  if (isLoadingUsers) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
        <span className="text-sm text-gray-500">Loading users...</span>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="text-red-600 text-sm">
        Error loading users: {usersError.message}
      </div>
    );
  }

  if (allUsers.length === 0) {
    return <div className="text-gray-500 text-sm">No users available</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <label
        htmlFor="user-select"
        className="text-sm font-medium text-gray-700"
      >
        User:
      </label>
      <select
        id="user-select"
        value={selectedUser?.id || ""}
        onChange={(e) => {
          const userId = parseInt(e.target.value);
          const user = allUsers.find((u: UserResponse) => u.id === userId);
          if (user) {
            selectUser(user);
          }
        }}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <option value="" disabled>
          Select a user...
        </option>
        {allUsers.map((user: UserResponse) => (
          <option key={user.id} value={user.id}>
            {user.name} (${user.budget})
          </option>
        ))}
      </select>
    </div>
  );
};

export default UserSelector;
