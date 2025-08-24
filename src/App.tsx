// src/App.tsx - Updated with authentication
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import {
  NavigationProvider,
  useNavigation,
} from "./contexts/NavigationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import CartManagement from "./pages/CartManagement";
import ComponentCatalog from "./pages/ComponentCatalog";
import OrderHistory from "./pages/OrderHistory";
import BuildRequests from "./pages/BuildRequests";

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

// Main App Content Component (Protected)
const AppContent = () => {
  const { activeTab, setActiveTab } = useNavigation();

  const renderContent = () => {
    switch (activeTab) {
      case "cart":
        return <CartManagement />;
      case "components":
        return <ComponentCatalog />;
      case "orders":
        return <OrderHistory />;
      case "builds":
        return <BuildRequests />;
      default:
        return <CartManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-7xl mx-auto">{renderContent()}</main>
    </div>
  );
};

// Protected App Wrapper
const ProtectedApp = () => {
  return (
    <UserProvider>
      <CartProvider>
        <NavigationProvider>
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
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
        <ProtectedApp />
        <ReactQueryDevtools initialIsOpen={false} />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
