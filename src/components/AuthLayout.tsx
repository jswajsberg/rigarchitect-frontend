// src/components/AuthLayout.tsx - Enhanced with professional Lucide icons and modern styling
import React from "react";
import { Wrench } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Enhanced shared layout component for authentication pages (Login, SignUp).
 * Provides consistent styling and branding across auth flows with modern design.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Enhanced Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wrench size={28} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>

        {/* Enhanced Main content */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
          {children}
        </div>

        {/* Enhanced Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Wrench size={14} className="text-blue-600" />
            <span>RigArchitect &copy; 2025 - Custom PC Build Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
