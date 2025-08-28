// src/pages/Login.tsx - Enhanced with professional Lucide icons and modern styling
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGetAllUsers } from "../api/user-controller/user-controller";
import AuthLayout from "../components/AuthLayout";
import type { UserResponse } from "../api/model";
import {
  Mail,
  Lock,
  LogIn,
  Loader2,
  UserPlus,
  Code2,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  DollarSign,
  Zap,
} from "lucide-react";

const Login: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <Loader2
                size={32}
                className="animate-spin text-blue-600 mx-auto mb-4"
              />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }
      >
        <SignUp onBackToLogin={() => setShowSignUp(false)} />
      </React.Suspense>
    );
  }

  return (
    <AuthLayout
      title="Sign in to RigArchitect"
      subtitle="Welcome back! Build your perfect PC."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Enhanced Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Enhanced Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff
                  size={18}
                  className="text-gray-400 hover:text-gray-600"
                />
              ) : (
                <Eye size={18} className="text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={18} />
              Sign in
            </>
          )}
        </button>

        {/* Enhanced Sign up link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
          >
            <UserPlus size={16} />
            Don't have an account? Sign up
          </button>
        </div>

        {/* Enhanced Debug mode toggle */}
        {process.env.NODE_ENV === "development" && (
          <div className="border-t pt-6">
            <button
              type="button"
              onClick={toggleDebugMode}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Code2 size={16} />
              {showDebugMode ? "Hide Debug Mode" : "Show Debug Mode"}
            </button>
          </div>
        )}
      </form>

      {/* Enhanced Debug user selector */}
      {showDebugMode && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-yellow-600" />
            <h3 className="text-sm font-medium text-gray-900">
              Quick Login (Development Mode)
            </h3>
          </div>

          {usersLoading ? (
            <div className="text-center py-4">
              <Loader2
                size={24}
                className="animate-spin text-blue-600 mx-auto mb-2"
              />
              <span className="text-sm text-gray-500">Loading users...</span>
            </div>
          ) : allUsers.length === 0 ? (
            <div className="text-center py-4">
              <User size={24} className="text-gray-400 mx-auto mb-2" />
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
                  className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm transition-all group"
                  disabled={isLoading}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p className="flex items-center gap-1">
                        <span className="text-gray-500">ID:</span> {user.id}
                      </p>
                      <p className="flex items-center gap-1 font-medium text-green-600">
                        <DollarSign size={12} />
                        {user.budget?.toLocaleString() || "0"}
                      </p>
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
