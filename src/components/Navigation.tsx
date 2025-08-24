// src/components/Navigation.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user: authUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const tabs = [
    { id: "components", label: "Components", icon: "🔧" },
    { id: "builds", label: "Build Requests", icon: "🖥️" },
    { id: "orders", label: "Order History", icon: "📦" },
    { id: "cart", label: "Cart Management", icon: "🛒" },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
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
              <div className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg whitespace-nowrap">
                Budget: ${authUser.budget?.toLocaleString()}
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
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {authUser?.name}
                      </p>
                      <p className="text-sm text-gray-500">{authUser?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Budget: ${authUser?.budget?.toLocaleString()}
                      </p>
                    </div>

                    {/* Profile actions */}
                    <button
                      onClick={() => {
                        alert("Profile settings coming soon!");
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <span>⚙️</span>
                      <span>Profile Settings</span>
                      <span className="ml-auto text-xs text-gray-400">
                        Soon
                      </span>
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
