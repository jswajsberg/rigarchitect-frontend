// src/components/SearchBar.tsx

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
  onClearAllFilters?: () => void;
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
  onClearAllFilters,
  disabled = false,
}: SearchBarProps) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      {/* Simple Search */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search components (try: mobo, gfx, mem, cooler, AM4, DDR5, ATX, brand names...)"
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
            Smart search with slang support: mobo→motherboard, gfx→GPU, mem→RAM,
            etc. Also detects compatibility (AM4, DDR4, ATX) and component
            types.
          </div>
        )}
      </div>

      {/* Advanced Search Filters */}
      {showAdvancedSearch && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange("type", e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <option value="">All Types</option>
              {componentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              placeholder="e.g., ASUS, MSI, Intel"
              value={filters.brand}
              onChange={(e) => onFilterChange("brand", e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compatibility
            </label>
            <input
              type="text"
              placeholder="e.g., AM4, DDR4, ATX"
              value={filters.compatibilityTag}
              onChange={(e) =>
                onFilterChange("compatibilityTag", e.target.value)
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price ($)
            </label>
            <input
              type="number"
              placeholder="e.g., 500"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange("maxPrice", e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Stock
            </label>
            <input
              type="number"
              placeholder="Minimum quantity"
              value={filters.minStock}
              onChange={(e) => onFilterChange("minStock", e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 h-10">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onInStockOnlyChange(e.target.checked)}
                className="rounded"
                disabled={disabled}
              />
              <span className="text-sm font-medium text-green-700">
                In Stock Only
              </span>
            </label>
            {onClearAllFilters && (
              <button
                onClick={onClearAllFilters}
                disabled={disabled}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed h-10 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
