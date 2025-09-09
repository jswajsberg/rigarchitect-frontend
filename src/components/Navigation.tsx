/**
 * Main navigation component with tab switching and user menu
 * @param {NavigationProps} props - Active tab state and setter function
 * @returns {JSX.Element} Navigation bar with tabs, budget controls, and user menu
 */
import React, { useState } from "react";
import { useAuth, useAuthMode } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useUpdateUserBudget } from "../api/user-controller/user-controller";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, // Components
  Wrench, // PC Builder
  Package, // Order History
  ShoppingCart, // Shopping Cart
  User, // User menu
  LogOut, // Logout
  LogIn, // Guest login
  UserPlus, // Guest signup
  Edit3, // Edit budget
  Save, // Save budget
  X, // Cancel budget edit
  DollarSign, // Budget indicator
  ChevronDown, // User menu dropdown
  Lock, // Change password
  Eye, // Show password
  EyeOff, // Hide password
  Loader2, // Loading spinner
  AlertCircle, // Error icon
  CheckCircle2, // Success icon
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { user: authUser, logout } = useAuth();
  const { mode, isAuthenticated, isGuest } = useAuthMode();
  const { shoppingCartItemCount } = useCart();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'signup' | null>(null);

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const updateBudgetMutation = useUpdateUserBudget({
    mutation: {
      onSuccess: () => {
        setIsEditingBudget(false);
        // The AuthContext will automatically sync the updated budget
        queryClient.invalidateQueries({
          queryKey: ["/api/v1/users"],
        });
      },
      onError: (error) => {
        console.error("Failed to update budget:", error);
        alert("Failed to update budget. Please try again.");
      },
    },
  });

  // Enhanced tabs with professional Lucide icons - adjusted for guest vs authenticated
  const tabs = [
    {
      id: "components",
      label: "Components",
      icon: Search,
      color: "text-blue-600",
    },
    {
      id: "builds",
      label: isGuest ? "Build PC" : "PC Builder",
      icon: Wrench,
      color: "text-purple-600",
    },
    ...(isAuthenticated ? [{
      id: "orders",
      label: "Order History",
      icon: Package,
      color: "text-green-600",
    }] : []),
    ...(!isGuest ? [{
      id: "cart",
      label: "Shopping Cart",
      icon: ShoppingCart,
      color: "text-orange-600",
      badge: shoppingCartItemCount > 0 ? shoppingCartItemCount : undefined,
    }] : []),
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleBudgetEdit = () => {
    setBudgetInput((authUser?.budget || 0).toString());
    setIsEditingBudget(true);
  };

  const handleBudgetSave = async () => {
    if (!authUser?.id) return;

    const newBudget = parseFloat(budgetInput);
    if (isNaN(newBudget) || newBudget < 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    // Soft cap at $9999
    const cappedBudget = Math.min(newBudget, 9999);

    await updateBudgetMutation.mutateAsync({
      id: authUser.id,
      data: { budget: cappedBudget },
    });
  };

  const handleBudgetCancel = () => {
    setIsEditingBudget(false);
    setBudgetInput("");
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Left - Enhanced Logo + Tabs */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">RigArchitect</h1>
            </div>

            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={
                        activeTab === tab.id ? tab.color : "text-gray-500"
                      }
                    />
                    <span>{tab.label}</span>

                    {/* Enhanced cart badge */}
                    {tab.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Enhanced User/Guest Menu */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Budget Display - Only for authenticated users */}
            {isAuthenticated && authUser && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-green-600" />
                <span className="text-gray-600">Budget:</span>
                {isEditingBudget ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      min="0"
                      max="9999"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                      autoFocus
                    />
                    <button
                      onClick={handleBudgetSave}
                      disabled={updateBudgetMutation.isPending}
                      className="p-1 text-green-600 hover:text-green-700 disabled:text-gray-400"
                      title="Save budget"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleBudgetCancel}
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Cancel edit"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600">
                      ${authUser.budget?.toFixed(2) || "0.00"}
                    </span>
                    <button
                      onClick={handleBudgetEdit}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit budget"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Guest Mode Buttons */}
            {isGuest && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Guest Mode</span>
                <button
                  onClick={() => setShowAuthModal('login')}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setShowAuthModal('signup')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <UserPlus size={16} />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            {/* Enhanced User Menu - Only for authenticated users */}
            {isAuthenticated && authUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm font-medium">{authUser.name}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showUserMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Enhanced Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {authUser.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {authUser.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="text-sm text-gray-600">
                            Current Budget:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            ${authUser.budget?.toFixed(2) || "0.00"}
                          </span>
                          <button
                            onClick={() => {
                              handleBudgetEdit();
                              setShowUserMenu(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Edit budget"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowChangePassword(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Lock size={16} className="text-blue-600" />
                        <span className="text-sm">Change Password</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut size={16} className="text-red-600" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={showAuthModal}
          onClose={() => setShowAuthModal(null)}
        />
      )}
    </nav>
  );
};

/**
 * Modal for changing user password with validation
 * @param {ChangePasswordModalProps} props - Close callback function
 * @returns {JSX.Element} Password change modal with form validation
 */
interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { changePassword, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    const result = await changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.success) {
      setSuccess("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setError(result.error || "Failed to change password");
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
          <p className="text-gray-600 mt-2">
            Update your password to keep your account secure
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                required
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Enter current password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff size={16} className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye size={16} className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Enter new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeOff size={16} className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye size={16} className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Confirm new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeOff size={16} className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye size={16} className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Lock size={14} className="text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Security Tips:</p>
              <p>Use a strong, unique password with uppercase, lowercase, numbers, and symbols.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal for login/signup for guest users
 * @param {AuthModalProps} props - Mode and close callback
 * @returns {JSX.Element} Auth modal with login or signup form
 */
interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose }) => {
  const { login, signup, isLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    budget: "5000"
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (isSignup && !formData.name) {
      setError("Please enter your name");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      let result;
      
      if (isSignup) {
        result = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          budget: parseFloat(formData.budget) || 5000
        });
      } else {
        result = await login({
          email: formData.email,
          password: formData.password
        });
      }

      if (result.success) {
        setSuccess(isSignup ? "Account created successfully!" : "Signed in successfully!");
        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || `Failed to ${isSignup ? 'create account' : 'sign in'}`);
      }
    } catch (error) {
      setError(`Failed to ${isSignup ? 'create account' : 'sign in'}. Please try again.`);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isSignup ? (
              <UserPlus size={32} className="text-blue-600" />
            ) : (
              <LogIn size={32} className="text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignup ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignup 
              ? 'Join RigArchitect and save your builds' 
              : 'Welcome back to RigArchitect'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}

          {/* Name Field - Only for signup */}
          {isSignup && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={isSignup}
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          {/* Budget Field - Only for signup */}
          {isSignup && (
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Initial Budget ($)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                min="100"
                max="9999"
                value={formData.budget}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                placeholder="5000"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Your PC building budget</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isSignup ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isSignup ? (
                  <>
                    <UserPlus size={16} />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </>
            )}
          </button>

          {/* Mode Switch */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-1 disabled:opacity-50"
            >
              {isSignup ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          {/* Cancel Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Navigation;
