
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
            <div className="text-sm text-gray-600 mt-1">
              View {type.toLowerCase()} options
            </div>
            <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
              Browse →
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ComponentCatalog;
