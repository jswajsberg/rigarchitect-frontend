// src/pages/Login.tsx - Enhanced with professional Lucide icons and modern styling
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";
import {
  Mail,
  Lock,
  LogIn,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


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

      </form>

    </AuthLayout>
  );
};

export default Login;
