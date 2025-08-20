type NavigationProps = {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
};

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "cart", label: "Cart Management", icon: "🛒" },
    { id: "components", label: "Component Catalog", icon: "🔧" },
    { id: "builds", label: "Build Requests", icon: "⚙️" },
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
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
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

export default Navigation;
