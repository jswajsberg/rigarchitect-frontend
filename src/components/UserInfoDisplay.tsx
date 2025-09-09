/**
 * Displays user information in compact or detailed format
 * @param {UserInfoDisplayProps} props - Display options for email and variant
 * @returns {JSX.Element} User info display with loading and empty states
 */
import React from "react";
import { useUserContext } from "../contexts/UserContext";

interface UserInfoDisplayProps {
  showEmail?: boolean;
  variant?: "compact" | "detailed";
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({
  showEmail = false,
  variant = "compact",
}) => {
  const { selectedUser, isLoadingCurrentUser } = useUserContext();

  if (isLoadingCurrentUser) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (!selectedUser) {
    return <div className="text-gray-500 text-sm">No user selected</div>;
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="font-medium text-gray-900">{selectedUser.name}</span>
        <span className="text-gray-500">•</span>
        <span className="font-semibold text-green-600">
          ${selectedUser.budget?.toFixed(2)}
        </span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedUser.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active User
          </span>
        </div>

        {showEmail && selectedUser.email && (
          <p className="text-sm text-gray-600">{selectedUser.email}</p>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Budget:</span>
            <span className="text-lg font-bold text-green-600">
              ${selectedUser.budget?.toFixed(2)}
            </span>
          </div>
        </div>

        {selectedUser.createdAt && (
          <div className="text-xs text-gray-400 pt-1">
            Member since {new Date(selectedUser.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfoDisplay;
