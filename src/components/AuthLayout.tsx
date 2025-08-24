// src/components/AuthLayout.tsx
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Shared layout component for authentication pages (Login, SignUp).
 * Provides consistent styling and branding across auth flows.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-md p-8">{children}</div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>RigArchitect &copy; 2025 - Custom PC Build Platform</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
