/**
 * Authentication wrapper component for protected routes
 * @param {ProtectedRouteProps} props - Children to protect and optional fallback component
 * @returns {JSX.Element} Protected content, loading state, or login page
 */
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

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
