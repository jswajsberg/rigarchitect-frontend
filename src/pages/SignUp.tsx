/**
 * User registration page with form validation
 * @param {SignUpProps} props - Callback to return to login page
 * @returns {JSX.Element} Signup form with validation and success handling
 */
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";
import {
  User,
  Mail,
  Lock,
  DollarSign,
  UserPlus,
  Loader2,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";

interface SignUpProps {
  onBackToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onBackToLogin }) => {
  const { signup, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    budget: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (
      formData.budget &&
      (parseFloat(formData.budget) < 0 || parseFloat(formData.budget) > 9999)
    ) {
      setError("Budget must be between $0 and $9,999");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await signup({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
    });

    if (result.success) {
      setSuccess("Account created successfully! You can now sign in.");
      setError(null);
      // Auto-switch to login after 2 seconds
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    } else {
      setError(result.error || "Failed to create account");
      setSuccess(null);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join RigArchitect and start building your perfect PC"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enhanced Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        )}

        {/* Enhanced Error Display */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Enhanced Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </div>
        </div>

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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Create a secure password"
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
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info size={12} />
            Password must be at least 6 characters
          </p>
        </div>

        {/* Enhanced Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
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

        {/* Enhanced Budget Field (Optional) */}
        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Budget (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign size={18} className="text-gray-400" />
            </div>
            <input
              id="budget"
              name="budget"
              type="number"
              min="0"
              max="9999"
              step="0.01"
              value={formData.budget}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="1500.00"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info size={12} />
            Set your PC building budget (max $9,999)
          </p>
        </div>

        {/* Enhanced Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Create account
            </>
          )}
        </button>

        {/* Enhanced Back to login link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
            disabled={isLoading}
          >
            <LogIn size={16} />
            Already have an account? Sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
