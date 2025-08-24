// src/components/ProtectedRoute.tsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps components that require authentication.
 * Redirects to login if user is not authenticated.
 * Shows loading spinner while checking authentication status.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return fallback || <Login />;
  }

  // User is authenticated - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
