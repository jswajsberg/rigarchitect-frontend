/**
 * Hook for managing PC builder operations like save, load, delete, and add to cart
 * @param {UseBuildOperationsProps} props - Configuration and mutation objects
 * @returns {Object} Build operation handlers and modal states
 */
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../../../contexts/CartContext";
import { useSelectedUserId } from "../../../contexts/UserContext";
import { useAuth } from "../../../contexts/AuthContext";
import {
  useCreateCartForUser,
  useUpdateCart,
  useDeleteCart,
  useGetUserCarts,
} from "../../../api/build-cart-controller/build-cart-controller";
import {
  useCreateItem as useCreateCartItem,
  useDeleteItem,
} from "../../../api/cart-item-controller/cart-item-controller";
import { useBuilder } from "../../../contexts/BuilderContext";

interface UseBuildOperationsProps {
  selectedBuildItems?: { data?: Array<{ id?: number }> };
  createItemMutation: any; // Accept the mutation from parent
  setHasUnsavedChanges?: (value: boolean) => void; // For clearing unsaved changes after save
  lastOperationRef?: React.MutableRefObject<{ type: 'save' | 'load', timestamp: number } | null>; // For tracking recent operations
}

export const useBuildOperations = ({
  selectedBuildItems,
  createItemMutation,
  setHasUnsavedChanges,
  lastOperationRef,
}: UseBuildOperationsProps) => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  const { user: authUser } = useAuth();
  useCart();

  // Modal states for replacing browser popups
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });
  const [clearConfirmMessage, setClearConfirmMessage] = useState("");

  // Get user carts to access shopping cart (DRAFT status)
  const { data: userCarts } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId && selectedUserId > 0 },
  });

  // Builder context
  const {
    selectedBuildId,
    setSelectedBuildId,
    currentBuild,
    setCurrentBuild,
    setPriceRange,
    buildName,
    setBuildName,
    isModifyingExisting,
    setIsModifyingExisting,
  } = useBuilder();

  // API mutations
  const createCartMutation = useCreateCartForUser();
  const updateCartMutation = useUpdateCart();
  const deleteCartMutation = useDeleteCart();
  const createCartItemMutation = useCreateCartItem();
  const deleteItemMutation = useDeleteItem();

  // Save build (create new or update existing)
  const handleSaveBuild = useCallback(async (silent = false) => {
    if (!buildName.trim()) {
      if (!silent) {
        setModalMessage({
          title: "Build Name Required",
          message: "Please enter a build name before saving."
        });
        setShowError(true);
      }
      return;
    }

    if (!selectedUserId) {
      if (!silent) {
        setModalMessage({
          title: "User Required",
          message: "Please select a user before saving the build."
        });
        setShowError(true);
      }
      return;
    }

    try {
      let targetBuildId: number;

      if (isModifyingExisting && selectedBuildId) {
        // Update existing build
        await updateCartMutation.mutateAsync({
          id: selectedBuildId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = selectedBuildId;

        // Remove existing items
        if (selectedBuildItems?.data) {
          await Promise.all(
            selectedBuildItems.data.map((item) =>
              deleteItemMutation.mutateAsync({ id: item.id! })
            )
          );
        }
      } else {
        // Create new build
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: buildName, status: "ACTIVE" },
        });
        targetBuildId = newBuildResponse.data.id!;
        setSelectedBuildId(targetBuildId);
        setIsModifyingExisting(true);
      }

      // Add components to build
      const addPromises: Promise<unknown>[] = [];
      let componentCount = 0;

      Object.values(currentBuild).forEach((component) => {
        if (Array.isArray(component)) {
          component.forEach((comp) => {
            componentCount++;
            addPromises.push(
              createCartItemMutation.mutateAsync({
                data: {
                  cartId: targetBuildId,
                  componentId: comp.id!,
                  quantity: 1,
                },
              })
            );
          });
        } else if (component) {
          componentCount++;
          addPromises.push(
            createCartItemMutation.mutateAsync({
              data: {
                cartId: targetBuildId,
                componentId: component.id!,
                quantity: 1,
              },
            })
          );
        }
      });

      if (componentCount > 0) {
        await Promise.all(addPromises);
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${targetBuildId}`],
      });

      // Only show popup for manual saves
      if (!silent) {
        const buildType =
          componentCount > 0
            ? `with ${componentCount} components`
            : "(empty build)";
        setModalMessage({
          title: "Build Saved",
          message: `Build "${buildName}" saved successfully ${buildType}!`
        });
        setShowSaveSuccess(true);
      }
      
      // Clear unsaved changes flag after successful save
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }
    } catch (error: any) {
      console.error("Failed to save build:", error);
      if (!silent) {
        setModalMessage({
          title: "Save Failed",
          message: `Failed to save build: ${error.response?.data?.message || error.message}`
        });
        setShowError(true);
      }
    }
  }, [
    buildName,
    selectedUserId,
    currentBuild,
    isModifyingExisting,
    selectedBuildId,
    selectedBuildItems,
    updateCartMutation,
    createCartMutation,
    deleteItemMutation,
    createCartItemMutation,
    queryClient,
    setSelectedBuildId,
    setIsModifyingExisting,
  ]);

  // Load build into builder
  const handleLoadBuild = useCallback(
    (buildId: number, savedBuilds: Array<{ id?: number; name?: string }>) => {
      setSelectedBuildId(buildId);
      setIsModifyingExisting(true);

      const build = savedBuilds.find((b) => b.id === buildId);
      if (build && build.name) {
        // Ensure clean string handling
        const cleanName = String(build.name).trim();
        setBuildName(cleanName);
      } else {
        setBuildName("Untitled Build");
      }

      // Restore price range to user's budget when loading existing build
      const userBudget = authUser?.budget || 5000;
      setPriceRange({ min: 0, max: userBudget });

      // Clear unsaved changes when loading a build
      if (setHasUnsavedChanges) {
        setHasUnsavedChanges(false);
      }

      // Mark this as a load operation to prevent immediate unsaved changes flag
      if (lastOperationRef) {
        lastOperationRef.current = { type: 'load', timestamp: Date.now() };
      }
    },
    [setSelectedBuildId, setIsModifyingExisting, setBuildName, setPriceRange, setHasUnsavedChanges, lastOperationRef, authUser]
  );

  // Delete build
  const handleDeleteBuild = useCallback(
    async (buildId: number, buildNameParam: string) => {
      // Show confirmation modal instead of browser confirm
      setDeleteTarget({ id: buildId, name: buildNameParam });
      setShowDeleteConfirm(true);
    },
    []
  );

  // Execute delete after confirmation
  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;

    const { id: buildId, name: buildNameParam } = deleteTarget;

    try {
      await deleteCartMutation.mutateAsync({ id: buildId });

      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });

      if (selectedBuildId === buildId) {
        setSelectedBuildId(null);
        setCurrentBuild({});
        setBuildName("");
        setIsModifyingExisting(false);
      }

      setModalMessage({
        title: "Build Deleted",
        message: `Build "${buildNameParam}" deleted successfully.`
      });
      setShowSaveSuccess(true);
    } catch (error: any) {
      console.error("Failed to delete build:", error);
      setModalMessage({
        title: "Delete Failed",
        message: "Failed to delete build. Please try again."
      });
      setShowError(true);
    } finally {
      setDeleteTarget(null);
      setShowDeleteConfirm(false);
    }
    },
    [
      deleteCartMutation,
      queryClient,
      selectedUserId,
      selectedBuildId,
      setSelectedBuildId,
      setCurrentBuild,
      setBuildName,
      setIsModifyingExisting,
    ]
  );

  // Clear build
  const handleClearBuild = useCallback(async () => {
    const componentCount = Object.keys(currentBuild).length;
    if (componentCount === 0) {
      // Nothing to clear
      return;
    }

    const isSavedBuild = selectedBuildId && isModifyingExisting;
    const confirmMessage = isSavedBuild 
      ? `This will remove all ${componentCount} components from the saved build "${buildName}" and cannot be undone.`
      : `This will remove all ${componentCount} selected components and cannot be undone.`;

    setClearConfirmMessage(confirmMessage);
    setShowClearConfirm(true);
  }, [currentBuild, selectedBuildId, isModifyingExisting, buildName]);

  // Execute clear after confirmation
  const handleClearConfirmed = useCallback(async () => {
    const isSavedBuild = selectedBuildId && isModifyingExisting;

    try {
      // If this is a saved build, remove all items from the database
      if (isSavedBuild && selectedBuildItems?.data) {
        await Promise.all(
          selectedBuildItems.data.map((item) =>
            deleteItemMutation.mutateAsync({ id: item.id! })
          )
        );

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/items/cart/${selectedBuildId}`],
        });
      }

      // Clear local state and restore price range to user's budget
      setCurrentBuild({});
      setBuildName("");
      setSelectedBuildId(null);
      setIsModifyingExisting(false);

      // Reset price range to user's budget
      const userBudget = authUser?.budget || 5000;
      setPriceRange({ min: 0, max: userBudget });

      if (isSavedBuild) {
        setModalMessage({
          title: "Build Cleared",
          message: `Saved build "${buildName}" has been cleared of all components.`
        });
        setShowSaveSuccess(true);
      }
    } catch (error: any) {
      console.error("Failed to clear build:", error);
      setModalMessage({
        title: "Clear Failed",
        message: "Failed to clear build. Please try again."
      });
      setShowError(true);
    } finally {
      setShowClearConfirm(false);
    }
  }, [
    currentBuild,
    selectedBuildId,
    isModifyingExisting,
    buildName,
    selectedBuildItems,
    deleteItemMutation,
    queryClient,
    setCurrentBuild,
    setBuildName,
    setSelectedBuildId,
    setIsModifyingExisting,
    setPriceRange,
    authUser,
  ]);

  // Create new build with name confirmation
  const handleBuildNameConfirm = useCallback(
    async (newBuildName: string, priceRange?: { min: number; max: number }) => {
      if (!selectedUserId) {
        setModalMessage({
          title: "User Required",
          message: "Please select a user before creating a build."
        });
        setShowError(true);
        return;
      }

      // Ensure clean string input
      const cleanBuildName = String(newBuildName).trim();
      
      if (!cleanBuildName) {
        setModalMessage({
          title: "Build Name Required",
          message: "Build name cannot be empty."
        });
        setShowError(true);
        return;
      }

      try {
        // Create new empty build immediately
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: cleanBuildName, status: "ACTIVE" },
        });

        const newBuildId = newBuildResponse.data.id!;

        // Clear all build state and set up for new build
        setCurrentBuild({});
        setBuildName(cleanBuildName);
        setSelectedBuildId(newBuildId);
        setIsModifyingExisting(true);
        
        // Set custom price range if provided
        if (priceRange) {
          setPriceRange(priceRange);
        }

        // Clear unsaved changes flag when creating new build
        if (setHasUnsavedChanges) {
          setHasUnsavedChanges(false);
        }

        // Refresh builds list
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });

        // New builds are auto-saved without user notification
      } catch (error: any) {
        console.error("Failed to create new build:", error);
        setModalMessage({
          title: "Create Failed",
          message: `Failed to create new build: ${error.response?.data?.message || error.message}`
        });
        setShowError(true);
      }
    },
    [
      selectedUserId,
      createCartMutation,
      setCurrentBuild,
      setBuildName,
      setSelectedBuildId,
      setIsModifyingExisting,
      setPriceRange,
      queryClient,
    ]
  );

  // Add build to shopping cart (DRAFT status cart)
  const handleAddToCart = useCallback(async () => {
    if (!selectedUserId) {
      setModalMessage({
        title: "User Required",
        message: "Please select a user first."
      });
      setShowError(true);
      return;
    }

    if (Object.keys(currentBuild).length === 0) {
      setModalMessage({
        title: "Empty Build",
        message: "Build is empty. Add some components first."
      });
      setShowError(true);
      return;
    }

    try {
      // Find or create shopping cart (DRAFT status)
      let shoppingCart =
        userCarts?.data?.find((cart) => cart.status === "DRAFT") || null;

      // Create shopping cart if it doesn't exist
      if (!shoppingCart) {
        const newCartResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: "Shopping Cart", status: "DRAFT" },
        });
        shoppingCart = newCartResponse.data;
      }

      const addPromises: Promise<unknown>[] = [];
      let componentCount = 0;

      Object.values(currentBuild).forEach((component) => {
        if (Array.isArray(component)) {
          component.forEach((comp) => {
            componentCount++;
            addPromises.push(
              createItemMutation.mutateAsync({
                data: {
                  cartId: shoppingCart.id!,
                  componentId: comp.id!,
                  quantity: 1,
                },
              })
            );
          });
        } else if (component) {
          componentCount++;
          addPromises.push(
            createItemMutation.mutateAsync({
              data: {
                cartId: shoppingCart.id!,
                componentId: component.id!,
                quantity: 1,
              },
            })
          );
        }
      });

      await Promise.all(addPromises);

      // Invalidate queries to refresh shopping cart data
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/carts/user/${selectedUserId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/v1/items/cart/${shoppingCart.id}`],
      });

      setModalMessage({
        title: "Added to Cart",
        message: `${componentCount} build components added to shopping cart!`
      });
      setShowSaveSuccess(true);
    } catch (error: any) {
      console.error("Failed to add build to cart:", error);
      setModalMessage({
        title: "Add to Cart Failed",
        message: "Failed to add build to cart. Please try again."
      });
      setShowError(true);
    }
  }, [
    currentBuild,
    createItemMutation,
    createCartMutation,
    queryClient,
    selectedUserId,
  ]);

  return {
    // Functions
    handleSaveBuild,
    handleLoadBuild,
    handleDeleteBuild,
    handleDeleteConfirmed,
    handleClearBuild,
    handleClearConfirmed,
    handleBuildNameConfirm,
    handleAddToCart,
    
    // Modal states
    showDeleteConfirm,
    setShowDeleteConfirm,
    showClearConfirm,
    setShowClearConfirm,
    showSaveSuccess,
    setShowSaveSuccess,
    showError,
    setShowError,
    deleteTarget,
    modalMessage,
    setModalMessage,
    clearConfirmMessage,
    setClearConfirmMessage,
  };
};
