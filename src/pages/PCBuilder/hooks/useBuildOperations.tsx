// src/components/PCBuilder/hooks/useBuildOperations.tsx
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../../../contexts/CartContext";
import { useSelectedUserId } from "../../../contexts/UserContext";
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
}

export const useBuildOperations = ({
  selectedBuildItems,
  createItemMutation,
}: UseBuildOperationsProps) => {
  const queryClient = useQueryClient();
  const selectedUserId = useSelectedUserId();
  useCart();

  // Get user carts to access shopping cart (DRAFT status)
  const { data: userCarts } = useGetUserCarts(selectedUserId || 0, {
    query: { enabled: !!selectedUserId },
  });

  // Builder context
  const {
    selectedBuildId,
    setSelectedBuildId,
    currentBuild,
    setCurrentBuild,
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
  const handleSaveBuild = useCallback(async () => {
    if (!buildName.trim()) {
      alert("Please enter a build name");
      return;
    }

    if (!selectedUserId) {
      alert("Please select a user first");
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

      const buildType =
        componentCount > 0
          ? `with ${componentCount} components`
          : "(empty build)";
      alert(`Build "${buildName}" saved successfully ${buildType}!`);
    } catch (error: any) {
      console.error("Failed to save build:", error);
      alert(
        `Failed to save build: ${
          error.response?.data?.message || error.message
        }`
      );
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
      if (build) {
        setBuildName(build.name || "");
      }
    },
    [setSelectedBuildId, setIsModifyingExisting, setBuildName]
  );

  // Delete build
  const handleDeleteBuild = useCallback(
    async (buildId: number, buildNameParam: string) => {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${buildNameParam}"? This action cannot be undone.`
      );
      if (!confirmDelete) return;

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

        alert(`Build "${buildNameParam}" deleted successfully.`);
      } catch (error: any) {
        console.error("Failed to delete build:", error);
        alert("Failed to delete build. Please try again.");
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
  const handleClearBuild = useCallback(() => {
    setCurrentBuild({});
    setBuildName("");
    setSelectedBuildId(null);
    setIsModifyingExisting(false);
  }, [
    setCurrentBuild,
    setBuildName,
    setSelectedBuildId,
    setIsModifyingExisting,
  ]);

  // Create new build with name confirmation
  const handleBuildNameConfirm = useCallback(
    async (newBuildName: string) => {
      if (!selectedUserId) {
        alert("Please select a user first");
        return;
      }

      try {
        // Create new empty build immediately
        const newBuildResponse = await createCartMutation.mutateAsync({
          userId: selectedUserId,
          data: { name: newBuildName, status: "ACTIVE" },
        });

        const newBuildId = newBuildResponse.data.id!;

        // Clear all build state and set up for new build
        setCurrentBuild({});
        setBuildName(newBuildName);
        setSelectedBuildId(newBuildId);
        setIsModifyingExisting(true);

        // Refresh builds list
        queryClient.invalidateQueries({
          queryKey: [`/api/v1/carts/user/${selectedUserId}`],
        });

        alert(`New build "${newBuildName}" created successfully!`);
      } catch (error: any) {
        console.error("Failed to create new build:", error);
        alert(
          `Failed to create new build: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    [
      selectedUserId,
      createCartMutation,
      setCurrentBuild,
      setBuildName,
      setSelectedBuildId,
      setIsModifyingExisting,
      queryClient,
    ]
  );

  // Add build to shopping cart (DRAFT status cart)
  const handleAddToCart = useCallback(async () => {
    if (!selectedUserId) {
      alert("Please select a user first.");
      return;
    }

    if (Object.keys(currentBuild).length === 0) {
      alert("Build is empty. Add some components first.");
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

      alert(`${componentCount} build components added to shopping cart!`);
    } catch (error: any) {
      console.error("Failed to add build to cart:", error);
      alert("Failed to add build to cart. Please try again.");
    }
  }, [
    currentBuild,
    createItemMutation,
    createCartMutation,
    queryClient,
    selectedUserId,
  ]);

  return {
    handleSaveBuild,
    handleLoadBuild,
    handleDeleteBuild,
    handleClearBuild,
    handleBuildNameConfirm,
    handleAddToCart,
  };
};
