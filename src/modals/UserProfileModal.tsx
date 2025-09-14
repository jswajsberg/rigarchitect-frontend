/**
 * User profile modal with full routing support
 * Displays over the current page with backdrop blur
 * @returns {JSX.Element} Modal overlay with user profile management interface
 */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth, useAuthMode } from "../contexts/AuthContext";
import { useGetCurrentUser, useUpdateUser, useDeleteUser } from "../api/user-controller/user-controller";
import { useChangePassword } from "../api/authentication/authentication";
import {
  User,
  Mail,
  DollarSign,
  Lock,
  Save,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Calendar,
  Loader2,
  X
} from "lucide-react";

interface FormData {
  name: string;
  email: string;
  budget: number;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout, updateUserProfile } = useAuth();
  const { isAuthenticated } = useAuthMode();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser({
    query: {
      enabled: Boolean(isAuthenticated && isOpen), // Only fetch when authenticated and modal is open
      retry: false, // Don't retry on 401 errors
    }
  });
  
  // Mutations
  const updateUserMutation = useUpdateUser();
  const changePasswordMutation = useChangePassword();
  const deleteUserMutation = useDeleteUser();

  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: currentUser?.data?.name || "",
    email: currentUser?.data?.email || "",
    budget: currentUser?.data?.budget || 0
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // UI states
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changesMade, setChangesMade] = useState(false);

  // Update form data when user data loads
  useEffect(() => {
    if (currentUser?.data) {
      setFormData({
        name: currentUser.data.name || "",
        email: currentUser.data.email || "",
        budget: currentUser.data.budget || 0
      });
    }
  }, [currentUser]);

  // Reset changes flag when modal opens
  useEffect(() => {
    if (isOpen) {
      setChangesMade(false);
      setSuccess(null);
      setErrors({});
    }
  }, [isOpen]);

  // Handle refresh when modal closes and changes were made
  const prevIsOpenRef = React.useRef(isOpen);
  useEffect(() => {
    // If modal was open and is now closed, and changes were made
    if (prevIsOpenRef.current && !isOpen && changesMade) {
      console.log("Modal closed with changes, refreshing data...");
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/users/current"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/v1/users"]
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, changesMade, queryClient]);

  // Handle modal close with navigation
  const handleClose = () => {
    // Navigate back to previous page
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      // Fallback to home if no history
      navigate('/', { replace: true });
    }
    onClose();
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const clearMessages = () => {
    setErrors({});
    setSuccess(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    clearMessages();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    clearMessages();
  };

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.budget < 0) {
      newErrors.budget = "Budget cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm() || !currentUser?.data?.id) {
      console.log("Validation failed:", { formValid: validateProfileForm(), userId: currentUser?.data?.id });
      return;
    }

    console.log("Submitting profile update:", { id: currentUser.data.id, data: formData });

    try {
      const result = await updateUserMutation.mutateAsync({
        id: currentUser.data.id,
        data: formData
      });
      
      console.log("Profile update successful:", result);
      
      // Sync the updated data to AuthContext so navbar updates immediately
      await updateUserProfile(result.data);
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setChangesMade(true); // Mark that changes were made
    } catch (error: any) {
      console.error("Profile update failed:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update profile";
      setErrors({ submit: errorMessage });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    try {
      await changePasswordMutation.mutateAsync({
        data: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      });
      setSuccess("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setChangesMade(true); // Mark that changes were made
    } catch (error: any) {
      setErrors({ password: error?.response?.data?.message || "Failed to change password" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.data?.id) return;

    try {
      await deleteUserMutation.mutateAsync({ id: currentUser.data.id });
      setSuccess("Account deleted successfully. You will be logged out.");
      setTimeout(() => {
        logout();
        handleClose();
      }, 2000);
    } catch (error: any) {
      setErrors({ delete: error?.response?.data?.message || "Failed to delete account" });
    }
    setShowDeleteConfirm(false);
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600 mt-1">Manage your profile, password, and account preferences</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {userLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="p-6">
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">{success}</span>
                </div>
              )}

              {errors.submit && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{errors.submit}</span>
                </div>
              )}

              <div className="space-y-8">
                {/* Account Information */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditing ? 'bg-gray-50' : ''
                        } ${errors.name ? 'border-red-300' : ''}`}
                      />
                      {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditing ? 'bg-gray-50' : ''
                        } ${errors.email ? 'border-red-300' : ''}`}
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Budget Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Budget (USD)
                      </label>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          !isEditing ? 'bg-gray-50' : ''
                        } ${errors.budget ? 'border-red-300' : ''}`}
                      />
                      {errors.budget && <p className="text-red-600 text-sm mt-1">{errors.budget}</p>}
                    </div>

                    {isEditing && (
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={updateUserMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateUserMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              name: currentUser?.data?.name || "",
                              email: currentUser?.data?.email || "",
                              budget: currentUser?.data?.budget || 0
                            });
                            clearMessages();
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>

                  {/* Account Details */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Member Since:</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(currentUser?.data?.createdAt)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Updated:</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(currentUser?.data?.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Change Password */}
                <section className="pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    <Lock className="w-5 h-5 inline mr-2" />
                    Change Password
                  </h2>

                  {errors.password && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800">{errors.password}</span>
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                            errors.currentPassword ? 'border-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                            errors.newPassword ? 'border-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                            errors.confirmPassword ? 'border-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Change Password
                    </button>
                  </form>
                </section>

                {/* Delete Account */}
                <section className="pt-8 border-t border-gray-200">
                  <h2 className="text-lg font-medium text-red-900 mb-4">
                    <Trash2 className="w-5 h-5 inline mr-2" />
                    Delete Account
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-red-800">
                      <strong>Warning:</strong> This action cannot be undone. Deleting your account will permanently remove all your data, including builds, cart items, and order history.
                    </p>
                  </div>

                  {errors.delete && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800">{errors.delete}</span>
                    </div>
                  )}

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-900 font-medium">Are you absolutely sure you want to delete your account?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteUserMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteUserMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Yes, Delete Account
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;