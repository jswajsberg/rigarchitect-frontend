export interface SearchFilters {
  type: string;
  brand: string;
  compatibilityTag: string;
  maxPrice: string;
  minStock: string;
}

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedSearch: boolean;
  onToggleAdvancedSearch: () => void;
  filters: SearchFilters;
  onFilterChange: (key: string, value: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (value: boolean) => void;
  componentTypes: Array<{ id: string; name: string; description: string }>;
  disabled?: boolean;
}

const SearchBar = ({
  searchTerm,
  onSearchTermChange,
  showAdvancedSearch,
  onToggleAdvancedSearch,
  filters,
  onFilterChange,
  inStockOnly,
  onInStockOnlyChange,
  componentTypes,
  disabled = false,
}: SearchBarProps) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      {/* Simple Search */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, brand, compatibility (e.g., AM4, DDR4, ATX), or component type..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={showAdvancedSearch || disabled}
          />
          <label className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded hover:bg-green-100">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockOnlyChange(e.target.checked)}
              className="rounded"
              disabled={showAdvancedSearch || disabled}
            />
            <span className="text-sm font-medium text-green-700">
              In Stock Only
            </span>
          </label>
          <button
            onClick={onToggleAdvancedSearch}
            disabled={disabled}
            className={`px-4 py-2 rounded font-medium ${
              showAdvancedSearch
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:bg-gray-400`}
          >
            {showAdvancedSearch ? "Simple Search" : "Advanced Search"}
          </button>
        </div>
        {!showAdvancedSearch && (
          <div className="text-xs text-gray-500 mt-1">
            Smart search: detects component types, compatibility tags (AM4,
            DDR4, ATX, etc.), RAM terms (DDR), or searches across all fields
            {inStockOnly && " • Showing only items in stock"}
          </div>
        )}
      </div>

      {/* Advanced Search */}
      {showAdvancedSearch && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Advanced Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => onFilterChange("type", e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              >
                <option value="">Any Type</option>
                {componentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g., Intel, AMD, NVIDIA"
                value={filters.brand}
                onChange={(e) => onFilterChange("brand", e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Compatibility Tag
              </label>
              <input
                type="text"
                placeholder="e.g., AM4, DDR4, ATX, PCIe4.0"
                value={filters.compatibilityTag}
                onChange={(e) =>
                  onFilterChange("compatibilityTag", e.target.value)
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Price
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g., 500.00"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Stock
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minStock}
                onChange={(e) => onFilterChange("minStock", e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
