// src/components/Navigation.tsx - Updated with cart item count and simple budget editing
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useUpdateUserBudget } from "../api/user-controller/user-controller";
import { useQueryClient } from "@tanstack/react-query";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user: authUser, logout } = useAuth();
  const { shoppingCartItemCount } = useCart();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const updateBudgetMutation = useUpdateUserBudget({
    mutation: {
      onSuccess: () => {
        setIsEditingBudget(false);
        // The AuthContext will automatically sync the updated budget
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/users"],
        });
      },
      onError: (error) => {
        console.error("Failed to update budget:", error);
        alert("Failed to update budget. Please try again.");
      },
    },
  });

  const tabs = [
    { id: "components", label: "Components", icon: "🔧" },
    { id: "builds", label: "PC Builder", icon: "🖥️" },
    { id: "orders", label: "Order History", icon: "📦" },
    {
      id: "cart",
      label: "Shopping Cart",
      icon: "🛒",
      badge: shoppingCartItemCount > 0 ? shoppingCartItemCount : undefined,
    },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleBudgetEdit = () => {
    setBudgetInput((authUser?.budget || 0).toString());
    setIsEditingBudget(true);
  };

  const handleBudgetSave = async () => {
    if (!authUser?.id) return;

    const newBudget = parseFloat(budgetInput);
    if (isNaN(newBudget) || newBudget < 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    // Soft cap at $9999
    const cappedBudget = Math.min(newBudget, 9999);

    await updateBudgetMutation.mutateAsync({
      id: authUser.id,
      data: { budget: cappedBudget },
    });
  };

  const handleBudgetCancel = () => {
    setIsEditingBudget(false);
    setBudgetInput("");
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left - Logo + Tabs */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">RigArchitect</h1>
            </div>
            <div className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 relative ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 bg-blue-500 text-white text-xs font-medium rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Center - Welcome message (hidden on small screens) */}
          {authUser && (
            <div className="hidden md:flex flex-1 justify-center">
              <div className="text-sm text-gray-600 whitespace-nowrap">
                Welcome back,{" "}
                <span className="font-medium text-gray-900">
                  {authUser.name}
                </span>
              </div>
            </div>
          )}

          {/* Right - Budget + User menu */}
          <div className="flex items-center space-x-4">
            {authUser && (
              <div className="w-40 flex items-center">
                {!isEditingBudget ? (
                  // Display mode
                  <button
                    onClick={handleBudgetEdit}
                    className="w-full text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-center"
                    title="Click to edit budget"
                  >
                    Budget: ${authUser.budget?.toLocaleString()}
                  </button>
                ) : (
                  // Edit mode
                  <div className="w-full flex items-center bg-blue-50 border border-blue-200 rounded-lg px-2 py-2">
                    <span className="text-sm font-semibold text-blue-700 mr-1">
                      $
                    </span>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      onBlur={handleBudgetSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") handleBudgetCancel();
                      }}
                      className="flex-1 text-sm font-semibold text-blue-700 bg-transparent border-none focus:outline-none text-center"
                      min="0"
                      max="9999"
                      disabled={updateBudgetMutation.isPending}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {authUser?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b">
                    {authUser?.email}
                  </div>

                  {/* Profile Settings - Future feature */}
                  <button
                    onClick={() => {
                      console.log("Profile settings - Coming soon");
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span>⚙️</span>
                    <span>Profile Settings</span>
                    <span className="ml-auto text-xs text-gray-400">Soon</span>
                  </button>

                  {/* Development info */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="border-t border-gray-100 px-4 py-2">
                      <p className="text-xs text-gray-400">Dev Mode</p>
                      <p className="text-xs text-gray-500">
                        ID: {authUser?.id}
                      </p>
                    </div>
                  )}

                  {/* Logout */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navigation;
