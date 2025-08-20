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

export default BuildRequests;
