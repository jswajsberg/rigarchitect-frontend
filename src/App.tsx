// src/App.tsx - Updated with BuildManagement routing + BuilderProvider
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AuthProvider, useAuthMode } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import {
  NavigationProvider,
  useNavigation,
} from "./contexts/NavigationContext";
import { BuilderProvider } from "./contexts/BuilderContext";
import { ComponentCatalogProvider } from "./contexts/ComponentCatalogContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import ShoppingCart from "./pages/ShoppingCart";
import ComponentCatalog from "./pages/ComponentCatalog";
import OrderHistory from "./pages/OrderHistory";
import PCBuilder from "./pages/PCBuilder";
import AuthModal from "./modals/AuthModal";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevents refetching when user returns to tab
    },
  },
});

// Main App Content Component
const AppContent = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { mode } = useAuthMode();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"login" | "signup">("login");

  // Function to open auth modal - will be passed down to components that need it
  const openAuthModal = (mode: "login" | "signup" = "signup") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "cart":
        return <ShoppingCart />;
      case "components":
        return <ComponentCatalog />;
      case "orders":
        // Orders only available for authenticated users
        return mode === 'authenticated' ? <OrderHistory /> : <ComponentCatalog />;
      case "builds":
        return <PCBuilder openAuthModal={openAuthModal} />;
      default:
        return <ComponentCatalog />; // Default to component catalog for guests
    }
  };

  // Show loading while auth mode is being determined
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto">{renderContent()}</main>
      
      {/* Global Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          // Optional: Handle successful authentication
          console.log("User authenticated successfully");
        }}
      />
    </div>
  );
};

// App Wrapper with Context Providers
const AppWithProviders = () => {
  return (
    <UserProvider>
      <CartProvider>
        <NavigationProvider>
          <ComponentCatalogProvider>
            <BuilderProvider>
              <AppContent />
            </BuilderProvider>
          </ComponentCatalogProvider>
        </NavigationProvider>
      </CartProvider>
    </UserProvider>
  );
};

// Main App Component with all providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppWithProviders />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
