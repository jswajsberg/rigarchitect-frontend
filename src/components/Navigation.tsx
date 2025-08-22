// src/components/Navigation.tsx
import React from "react";
import UserSelector from "./UserSelector";
import UserInfoDisplay from "./UserInfoDisplay";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "cart", label: "Cart Management" },
    { id: "components", label: "Components" },
    { id: "builds", label: "Build Requests" },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and tabs */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">RigArchitect</h1>
            </div>

            <div className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side - User info and selector */}
          <div className="flex items-center space-x-6">
            <UserInfoDisplay variant="compact" />
            <div className="border-l border-gray-200 pl-6">
              <UserSelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
