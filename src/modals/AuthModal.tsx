/**
 * Authentication modal that can show login or signup forms
 * @param {AuthModalProps} props - Modal props with mode switching and close handlers
 * @returns {JSX.Element | null} Authentication modal or null if closed
 */
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}) => {
  const [currentMode, setCurrentMode] = useState<"login" | "signup">(initialMode);
  const { isAuthenticated } = useAuth();

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Close modal and call success callback when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [isAuthenticated, isOpen, onClose, onSuccess]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Modal Content */}
          <div className="p-6">
            {currentMode === "login" ? (
              <div>
                {/* Custom Login Form for Modal */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Sign in to save your build
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Access your saved builds and continue where you left off
                  </p>
                </div>

                {/* We'll embed a simplified login form here */}
                <LoginForm 
                  onSwitchToSignup={() => setCurrentMode("signup")}
                  inModal={true}
                />
              </div>
            ) : (
              <div>
                {/* Custom Signup Form for Modal */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create your account
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Save your build and access it from any device
                  </p>
                </div>

                <SignUpForm 
                  onSwitchToLogin={() => setCurrentMode("login")}
                  inModal={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified Login Form Component for Modal
interface LoginFormProps {
  onSwitchToSignup: () => void;
  inModal?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, inModal = false }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      setError(result.error || "Login failed");
    }
    // Success is handled by useEffect in parent modal
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your password"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Signing in...
          </div>
        ) : (
          "Sign in"
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-sm text-blue-600 hover:text-blue-500"
          disabled={isLoading}
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  );
};

// Simplified Signup Form Component for Modal
interface SignUpFormProps {
  onSwitchToLogin: () => void;
  inModal?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin, inModal = false }) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setSuccess("Account created successfully!");
      setError(null);
      // Success is handled by useEffect in parent modal
    } else {
      setError(result.error || "Failed to create account");
      setSuccess(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your full name"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="At least 6 characters"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Confirm your password"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Budget (Optional)
        </label>
        <input
          name="budget"
          type="number"
          min="0"
          max="9999"
          step="0.01"
          value={formData.budget}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1500.00"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Set your PC building budget (max $9,999)
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Creating account...
          </div>
        ) : (
          "Create account"
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-blue-600 hover:text-blue-500"
          disabled={isLoading}
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
};

export default AuthModal;