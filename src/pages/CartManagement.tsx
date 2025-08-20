
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

export default CartManagement;
