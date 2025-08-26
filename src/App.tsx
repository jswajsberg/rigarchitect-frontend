// src/App.tsx - Updated with BuildManagement routing + BuilderProvider
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import {
  NavigationProvider,
  useNavigation,
} from "./contexts/NavigationContext";
import { BuilderProvider } from "./contexts/BuilderContext"; // <-- NEW
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import ShoppingCart from "./pages/ShoppingCart";
import ComponentCatalog from "./pages/ComponentCatalog";
import OrderHistory from "./pages/OrderHistory";
import PCBuilder from "./pages/PCBuilder";

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
        return <ShoppingCart />;
      case "components":
        return <ComponentCatalog />;
      case "orders":
        return <OrderHistory />;
      case "builds":
        return <PCBuilder />;
      default:
        return <ShoppingCart />;
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
          <BuilderProvider>
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          </BuilderProvider>
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
