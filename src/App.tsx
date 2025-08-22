import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
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

const App = () => {
  const [activeTab, setActiveTab] = useState("cart");

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
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-100">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="max-w-7xl mx-auto">{renderContent()}</main>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </CartProvider>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;
