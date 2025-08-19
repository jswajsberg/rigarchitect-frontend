import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Navigation component
type NavigationProps = {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'cart', label: 'Cart Management', icon: '🛒' },
    { id: 'components', label: 'Component Catalog', icon: '🔧' },
    { id: 'builds', label: 'Build Requests', icon: '⚙️' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Rig Architect</h1>
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Placeholder pages
const CartManagement = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Cart Management</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Current Cart Items</h3>
        <div className="text-gray-500">Loading cart items...</div>
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
            <div className="font-medium">Sample Component</div>
            <div className="text-sm text-gray-600">Quantity: 2 | $299.99</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Add to Cart</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Component ID" 
            className="w-full p-2 border rounded"
          />
          <input 
            type="number" 
            placeholder="Quantity" 
            className="w-full p-2 border rounded"
            min="1"
          />
          <button 
            onClick={() => console.log('Add to cart clicked')}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ComponentCatalog = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Component Catalog</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">Available Components</h3>
      <div className="text-gray-500 mb-4">Browse and search components...</div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU'].map((type) => (
          <div key={type} className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium">{type} Components</h4>
            <div className="text-sm text-gray-600 mt-1">View {type.toLowerCase()} options</div>
            <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
              Browse →
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BuildRequests = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Build Requests</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Create New Build Request</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Build Name" 
            className="w-full p-2 border rounded"
          />
          <textarea 
            placeholder="Build Description" 
            className="w-full p-2 border rounded h-24"
          />
          <select className="w-full p-2 border rounded">
            <option>Standard Build</option>
            <option>Gaming Build</option>
            <option>Workstation Build</option>
          </select>
          <button 
            onClick={() => console.log('Build request submitted')}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Submit Build Request
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Recent Build Requests</h3>
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
            <div className="font-medium">Gaming Rig v1</div>
            <div className="text-sm text-gray-600">Status: In Progress</div>
            <div className="text-sm text-gray-500">Created: 2 hours ago</div>
          </div>
          <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
            <div className="font-medium">Office Workstation</div>
            <div className="text-sm text-gray-600">Status: Completed</div>
            <div className="text-sm text-gray-500">Created: 1 day ago</div>
          </div>
          <div className="p-3 bg-red-50 rounded border-l-4 border-red-500">
            <div className="font-medium">Budget Build</div>
            <div className="text-sm text-gray-600">Status: Failed</div>
            <div className="text-sm text-gray-500">Created: 3 days ago</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main App component
const App = () => {
  const [activeTab, setActiveTab] = useState('cart');

  const renderContent = () => {
    switch (activeTab) {
      case 'cart':
        return <CartManagement />;
      case 'components':
        return <ComponentCatalog />;
      case 'builds':
        return <BuildRequests />;
      default:
        return <CartManagement />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="max-w-7xl mx-auto">
          {renderContent()}
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;