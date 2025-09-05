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
  showFilters: boolean;
  onToggleFilters: () => void;
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
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  inStockOnly,
  onInStockOnlyChange,
  componentTypes,
  onClearAllFilters,
  disabled = false,
}: SearchBarProps) => {
  // Calculate active filter count
  const activeFilterCount = [
    filters.brand.trim(),
    filters.compatibilityTag.trim(),
    filters.maxPrice.trim(),
    filters.minStock && filters.minStock !== '0' ? filters.minStock : '',
    inStockOnly ? 'inStock' : ''
  ].filter(Boolean).length;
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      {/* Main Search Row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search components (try: mobo, gfx, mem, cooler, AM4, DDR5, ATX, brand names...)"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        
        <button
          onClick={onToggleFilters}
          disabled={disabled}
          className={`relative px-4 py-2 rounded font-medium text-sm transition-colors ${
            showFilters
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } disabled:bg-gray-400`}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <label className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded hover:bg-green-100">
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
      </div>

      {/* Smart Search Hint */}
      <div className="text-xs text-gray-500 mb-4">
        Smart search with slang support: mobo→motherboard, gfx→GPU, mem→RAM, etc. 
        Also detects compatibility (AM4, DDR4, ATX) and component types.
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onChange={(e) => onFilterChange("compatibilityTag", e.target.value)}
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
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end mt-4">
            {onClearAllFilters && (
              <button
                onClick={onClearAllFilters}
                disabled={disabled}
                className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed text-sm font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
