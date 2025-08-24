// src/pages/SignUp.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import AuthLayout from "../components/AuthLayout";

interface SignUpProps {
  onBackToLogin?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onBackToLogin }) => {
  const { signup, isLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    budget: "5000",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear server error
    if (serverError) setServerError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Budget validation
    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget < 0) {
      newErrors.budget = "Please enter a valid budget amount";
    } else if (budget > 50000) {
      newErrors.budget = "Budget cannot exceed $50,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signup({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      budget: parseFloat(formData.budget),
    });

    if (!result.success) {
      setServerError(result.error || "Signup failed");
    }
    // On success, the AuthContext will automatically log the user in
  };

  const budgetOptions = [
    { value: "1000", label: "$1,000 - Budget Build" },
    { value: "2500", label: "$2,500 - Mid-Range" },
    { value: "5000", label: "$5,000 - High-End" },
    { value: "10000", label: "$10,000 - Enthusiast" },
    { value: "custom", label: "Custom Amount" },
  ];

  const [showCustomBudget, setShowCustomBudget] = useState(false);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "custom") {
      setShowCustomBudget(true);
      setFormData((prev) => ({ ...prev, budget: "" }));
    } else {
      setShowCustomBudget(false);
      setFormData((prev) => ({ ...prev, budget: value }));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join RigArchitect and start building your dream PC"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Name field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.name ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

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
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.email ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
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
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.password ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Create a password (min. 6 characters)"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.confirmPassword ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Budget field */}
        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-medium text-gray-700"
          >
            Initial Budget
          </label>
          {!showCustomBudget ? (
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleBudgetChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.budget ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                id="budget"
                name="budget"
                type="number"
                min="0"
                max="50000"
                step="100"
                value={formData.budget}
                onChange={handleInputChange}
                className={`flex-1 mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.budget ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter custom amount"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomBudget(false);
                  setFormData((prev) => ({ ...prev, budget: "5000" }));
                }}
                className="mt-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          )}
          {errors.budget && (
            <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Don't worry, you can change this later in your profile
          </p>
        </div>

        {/* Server error display */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{serverError}</p>
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
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </button>

        {/* Back to login link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-sm text-blue-600 hover:text-blue-500"
            disabled={isLoading}
          >
            Already have an account? Sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
