import { useGetAllComponents } from "../api/component-controller/component-controller";
import type { ComponentResponse } from "../api/model";

const ComponentCatalog = () => {
  // Fetch all components to calculate counts by type
  const { data: components, isLoading, error, refetch } = useGetAllComponents();

  const componentTypes = [
    { id: "CPU", name: "CPU", description: "Processors and chips" },
    { id: "GPU", name: "GPU", description: "Graphics cards" },
    { id: "RAM", name: "RAM", description: "Memory modules" },
    { id: "SSD", name: "SSD", description: "Solid state drives" },
    { id: "HDD", name: "HDD", description: "Hard disk drives" },
    { id: "Motherboard", name: "Motherboard", description: "Main boards" },
    { id: "PSU", name: "PSU", description: "Power supplies" },
    { id: "Case", name: "Case", description: "PC cases" },
    { id: "Cooler", name: "Cooler", description: "CPU coolers" },
  ];

  // Calculate component counts by type
  const getComponentCount = (type: string): number => {
    if (!components?.data || !Array.isArray(components.data)) return 0;
    return components.data.filter(
      (component: ComponentResponse) => component.type === type
    ).length;
  };

  const handleBrowseType = (typeId: string) => {
    console.log(`Browsing ${typeId} components`);
    // Later you can navigate to a filtered view or set state to show filtered components
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Component Catalog</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Component Catalog</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-red-600 mb-4">
            Error loading components: {error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Component Catalog</h2>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Available Components</h3>
        <div className="text-gray-500 mb-4">
          Browse and search from {components?.data?.length || 0} total
          components
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {componentTypes.map((type) => {
            const count = getComponentCount(type.id);
            return (
              <div
                key={type.id}
                className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{type.name}</h4>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    {count} items
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {type.description}
                </div>
                <button
                  onClick={() => handleBrowseType(type.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  disabled={count === 0}
                >
                  {count === 0 ? "No items available" : `Browse ${type.name} →`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComponentCatalog;
