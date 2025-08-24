// src/pages/Login.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGetAllUsers } from "../api/user-controller/user-controller";
import AuthLayout from "../components/AuthLayout";
import type { UserResponse } from "../api/model";

const Login: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

  // Debug mode state
  const [showDebugMode, setShowDebugMode] = useState(false);

  // Fetch all users for debug mode
  const { data: allUsersData, isLoading: usersLoading } = useGetAllUsers({
    query: { enabled: showDebugMode },
  });
  const allUsers = allUsersData?.data || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });

    if (!result.success) {
      setError(result.error || "Login failed");
    }
  };

  const handleQuickLogin = (user: UserResponse) => {
    quickLogin(user);
  };

  const toggleDebugMode = () => {
    setShowDebugMode(!showDebugMode);
    setError(null);
  };

  if (showSignUp) {
    // Dynamic import would be better, but for now we'll use a simple toggle
    const SignUp = React.lazy(() => import("./SignUp"));
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <SignUp onBackToLogin={() => setShowSignUp(false)} />
      </React.Suspense>
    );
  }

  return (
    <AuthLayout
      title="Sign in to RigArchitect"
      subtitle="Welcome back! Please sign in to your account"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>

        {/* Sign up link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Don't have an account? Sign up
          </button>
        </div>

        {/* Debug mode toggle - Only shown in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={toggleDebugMode}
              className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
            >
              <span>🔧</span>
              {showDebugMode ? "Hide Debug Mode" : "Show Debug Mode"}
            </button>
          </div>
        )}
      </form>

      {/* Debug user selector */}
      {showDebugMode && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Quick Login (Development Mode)
          </h3>

          {usersLoading ? (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">Loading users...</span>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                No users found in database
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border text-sm transition-colors"
                  disabled={isLoading}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>ID: {user.id}</p>
                      <p>Budget: ${user.budget?.toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;
