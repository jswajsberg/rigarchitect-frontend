// src/App.tsx - Updated with BuildManagement routing + BuilderProvider
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, useAuthMode } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import {
  NavigationProvider,
  useNavigation,
} from "./contexts/NavigationContext";
import { BuilderProvider } from "./contexts/BuilderContext";
import { ComponentCatalogProvider } from "./contexts/ComponentCatalogContext";
import { SharedDataProvider } from "./contexts/SharedDataContext";
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
const AppContent = React.memo(() => {
  const { activeTab, setActiveTab } = useNavigation();
  const { mode } = useAuthMode();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"login" | "signup">("login");

  // Function to open auth modal - will be passed down to components that need it
  const openAuthModal = (mode: "login" | "signup" = "signup") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // Memoized components to prevent unnecessary re-rendering
  const MemoizedShoppingCart = React.useMemo(() => 
    React.memo(() => <ShoppingCart openAuthModal={openAuthModal} setActiveTab={setActiveTab} />),
    [openAuthModal, setActiveTab]
  );

  const MemoizedComponentCatalog = React.useMemo(() => 
    React.memo(() => <ComponentCatalog />),
    []
  );

  const MemoizedOrderHistory = React.useMemo(() => 
    React.memo(() => <OrderHistory />),
    []
  );

  const MemoizedPCBuilder = React.useMemo(() => 
    React.memo(() => <PCBuilder openAuthModal={openAuthModal} />),
    [openAuthModal]
  );

  // Keep rendered components in state to prevent re-mounting
  const [renderedComponents] = React.useState(() => ({
    cart: <MemoizedShoppingCart />,
    components: <MemoizedComponentCatalog />,
    orders: mode === 'authenticated' ? <MemoizedOrderHistory /> : <MemoizedComponentCatalog />,
    builds: <MemoizedPCBuilder />
  }));

  // Update orders component when auth mode changes
  React.useEffect(() => {
    renderedComponents.orders = mode === 'authenticated' ? <MemoizedOrderHistory /> : <MemoizedComponentCatalog />;
  }, [mode, MemoizedOrderHistory, MemoizedComponentCatalog]);

  const renderContent = () => {
    return (
      <div style={{ display: 'contents' }}>
        {/* Render all components but hide inactive ones */}
        <div style={{ display: activeTab === 'cart' ? 'block' : 'none' }}>
          {renderedComponents.cart}
        </div>
        <div style={{ display: activeTab === 'components' ? 'block' : 'none' }}>
          {renderedComponents.components}
        </div>
        <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
          {renderedComponents.orders}
        </div>
        <div style={{ display: activeTab === 'builds' ? 'block' : 'none' }}>
          {renderedComponents.builds}
        </div>
      </div>
    );
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
        }}
      />
    </div>
  );
});

// App Wrapper with Context Providers
const AppWithProviders = React.memo(() => {
  return (
    <UserProvider>
      <CartProvider>
        <SharedDataProvider>
          <NavigationProvider>
            <ComponentCatalogProvider>
              <BuilderProvider>
                <AppContent />
              </BuilderProvider>
            </ComponentCatalogProvider>
          </NavigationProvider>
        </SharedDataProvider>
      </CartProvider>
    </UserProvider>
  );
});

// Main App Component with all providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AppWithProviders />} />
          </Routes>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
