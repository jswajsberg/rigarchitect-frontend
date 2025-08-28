// src/components/Navigation.tsx - Enhanced with professional Lucide icons
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useUpdateUserBudget } from "../api/user-controller/user-controller";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, // Components
  Wrench, // PC Builder
  Package, // Order History
  ShoppingCart, // Shopping Cart
  User, // User menu
  LogOut, // Logout
  Edit3, // Edit budget
  Save, // Save budget
  X, // Cancel budget edit
  DollarSign, // Budget indicator
  ChevronDown, // User menu dropdown
} from "lucide-react";

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

  // Enhanced tabs with professional Lucide icons
  const tabs = [
    {
      id: "components",
      label: "Components",
      icon: Search,
      color: "text-blue-600",
    },
    {
      id: "builds",
      label: "PC Builder",
      icon: Wrench,
      color: "text-purple-600",
    },
    {
      id: "orders",
      label: "Order History",
      icon: Package,
      color: "text-green-600",
    },
    {
      id: "cart",
      label: "Shopping Cart",
      icon: ShoppingCart,
      color: "text-orange-600",
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
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left - Enhanced Logo + Tabs */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">RigArchitect</h1>
            </div>

            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={
                        activeTab === tab.id ? tab.color : "text-gray-500"
                      }
                    />
                    <span>{tab.label}</span>

                    {/* Enhanced cart badge */}
                    {tab.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Enhanced User Menu */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Budget Display */}
            {authUser && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-gray-600">Budget:</span>
                {isEditingBudget ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      min="0"
                      max="9999"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                      autoFocus
                    />
                    <button
                      onClick={handleBudgetSave}
                      disabled={updateBudgetMutation.isPending}
                      className="p-1 text-green-600 hover:text-green-700 disabled:text-gray-400"
                      title="Save budget"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleBudgetCancel}
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Cancel edit"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600">
                      ${authUser.budget?.toFixed(2) || "0.00"}
                    </span>
                    <button
                      onClick={handleBudgetEdit}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit budget"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced User Menu */}
            {authUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium">{authUser.name}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Enhanced Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {authUser.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {authUser.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="text-sm text-gray-600">
                            Current Budget:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            ${authUser.budget?.toFixed(2) || "0.00"}
                          </span>
                          <button
                            onClick={() => {
                              handleBudgetEdit();
                              setShowUserMenu(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Edit budget"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut size={16} className="text-red-600" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;
