import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function InventoryDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showForecast, setShowForecast] = useState<Id<"inventory"> | null>(null);
  const [showExpiryAlerts, setShowExpiryAlerts] = useState(false);
  const [showWasteReport, setShowWasteReport] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "expiry" | "vaccines" | "waste">("inventory");
  
  const inventory = useQuery(api.inventory.listInventory, {
    category: selectedCategory || undefined,
  });
  
  const lowStockItems = useQuery(api.inventory.getLowStockAlerts, {});
  const expiryAlerts = useQuery(api.inventory.getExpiryAlerts, {});
  const vaccineSchedule = useQuery(api.inventory.getVaccineSchedule, {});
  const wasteReport = useQuery(api.inventory.getWasteReport, { days: 30 });
  
  const categories = ["medication", "supplies", "food", "equipment", "vaccines"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">📦 Inventory Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Item
        </button>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Expired Items</p>
              <p className="text-2xl font-bold text-red-700">{expiryAlerts?.expired.length || 0}</p>
            </div>
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-700">{expiryAlerts?.expiringSoon.length || 0}</p>
            </div>
            <span className="text-orange-500 text-2xl">⏰</span>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-700">{lowStockItems?.length || 0}</p>
            </div>
            <span className="text-yellow-500 text-2xl">📉</span>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Waste Value (30d)</p>
              <p className="text-2xl font-bold text-purple-700">${wasteReport?.summary.totalValue.toFixed(0) || 0}</p>
            </div>
            <span className="text-purple-500 text-2xl">🗑️</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {[
          { key: "inventory", label: "📦 Inventory", icon: "📦" },
          { key: "expiry", label: "⏰ Expiry Tracking", icon: "⏰" },
          { key: "vaccines", label: "💉 Vaccine Schedule", icon: "💉" },
          { key: "waste", label: "🗑️ Waste Report", icon: "🗑️" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-blue-100 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "inventory" && (
        <InventoryTab
          inventory={inventory}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onForecast={setShowForecast}
          lowStockItems={lowStockItems}
        />
      )}

      {activeTab === "expiry" && (
        <ExpiryTrackingTab expiryAlerts={expiryAlerts} />
      )}

      {activeTab === "vaccines" && (
        <VaccineScheduleTab vaccines={vaccineSchedule} />
      )}

      {activeTab === "waste" && (
        <WasteReportTab wasteReport={wasteReport} />
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <AddItemForm onClose={() => setShowAddForm(false)} />
      )}

      {/* Forecast Modal */}
      {showForecast && (
        <ForecastModal 
          itemId={showForecast} 
          onClose={() => setShowForecast(null)} 
        />
      )}
    </div>
  );
}

function InventoryTab({ 
  inventory, 
  categories, 
  selectedCategory, 
  setSelectedCategory, 
  onForecast,
  lowStockItems 
}: any) {
  return (
    <div className="space-y-4">
      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <h4 className="font-medium text-red-800">Low Stock Alerts</h4>
          </div>
          <div className="space-y-1">
            {lowStockItems.map((item: any) => (
              <p key={item._id} className="text-sm text-red-700">
                <strong>{item.itemName}</strong> - Only {item.currentStock} left (min: {item.minThreshold})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === "" 
              ? "bg-blue-100 text-blue-700" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Categories
        </button>
        {categories.map((category: string) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              selectedCategory === category 
                ? "bg-blue-100 text-blue-700" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory?.map((item: any) => (
          <InventoryCard 
            key={item._id} 
            item={item} 
            onForecast={() => onForecast(item._id)}
          />
        ))}
      </div>
    </div>
  );
}

function ExpiryTrackingTab({ expiryAlerts }: any) {
  const markAsExpired = useMutation(api.inventory.markAsExpired);

  const handleMarkExpired = async (itemId: Id<"inventory">) => {
    try {
      await markAsExpired({ itemId, reason: "Expired - marked by user" });
      toast.success("Item marked as expired and removed from stock");
    } catch (error) {
      toast.error("Failed to mark item as expired");
    }
  };

  if (!expiryAlerts) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Expired Items */}
      {expiryAlerts.expired.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-4 flex items-center gap-2">
            <span className="text-red-600">🚨</span>
            Expired Items ({expiryAlerts.expired.length})
          </h4>
          <div className="space-y-3">
            {expiryAlerts.expired.map((item: any) => (
              <div key={item._id} className="bg-white rounded-lg p-3 border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{item.itemName}</h5>
                    <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                    <p className="text-sm text-red-600">
                      Expired: {new Date(item.expirationDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Stock: {item.currentStock}</p>
                    {item.batchNumber && (
                      <p className="text-sm text-gray-600">Batch: {item.batchNumber}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleMarkExpired(item._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Mark as Waste
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      {expiryAlerts.expiringSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-4 flex items-center gap-2">
            <span className="text-orange-600">⚠️</span>
            Expiring Within 7 Days ({expiryAlerts.expiringSoon.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expiryAlerts.expiringSoon.map((item: any) => (
              <div key={item._id} className="bg-white rounded-lg p-3 border border-orange-200">
                <h5 className="font-medium text-gray-900">{item.itemName}</h5>
                <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                <p className="text-sm text-orange-600">
                  Expires: {new Date(item.expirationDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">Stock: {item.currentStock}</p>
                {item.batchNumber && (
                  <p className="text-sm text-gray-600">Batch: {item.batchNumber}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring This Month */}
      {expiryAlerts.expiringThisMonth.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-4 flex items-center gap-2">
            <span className="text-yellow-600">📅</span>
            Expiring This Month ({expiryAlerts.expiringThisMonth.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expiryAlerts.expiringThisMonth.map((item: any) => (
              <div key={item._id} className="bg-white rounded-lg p-3 border border-yellow-200">
                <h5 className="font-medium text-gray-900">{item.itemName}</h5>
                <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                <p className="text-sm text-yellow-600">
                  Expires: {new Date(item.expirationDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">Stock: {item.currentStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {expiryAlerts.totalAlerts === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-500">No expiry alerts at this time</p>
          <p className="text-sm text-gray-400">All items are within safe expiration dates</p>
        </div>
      )}
    </div>
  );
}

function VaccineScheduleTab({ vaccines }: any) {
  if (!vaccines) return <div>Loading...</div>;

  const expiredVaccines = vaccines.filter((v: any) => v.isExpired);
  const expiringSoon = vaccines.filter((v: any) => v.isExpiringSoon && !v.isExpired);
  const upcoming = vaccines.filter((v: any) => !v.isExpired && !v.isExpiringSoon);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">🚨 Expired Vaccines</h4>
          <p className="text-2xl font-bold text-red-700">{expiredVaccines.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">⚠️ Expiring Soon</h4>
          <p className="text-2xl font-bold text-orange-700">{expiringSoon.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">✅ Valid Vaccines</h4>
          <p className="text-2xl font-bold text-green-700">{upcoming.length}</p>
        </div>
      </div>

      {/* Vaccine Schedule Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="font-medium text-gray-900">💉 Vaccine Expiration Schedule</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vaccine</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Expiry Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Until Expiry</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Batch</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vaccines.map((vaccine: any) => (
                <tr key={vaccine._id} className={
                  vaccine.isExpired ? "bg-red-50" :
                  vaccine.isExpiringSoon ? "bg-orange-50" : ""
                }>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {vaccine.itemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {vaccine.currentStock}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {vaccine.expirationDate ? 
                      new Date(vaccine.expirationDate).toLocaleDateString() : 
                      "No expiry date"
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {vaccine.daysUntilExpiry !== null ? 
                      `${vaccine.daysUntilExpiry} days` : 
                      "N/A"
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {vaccine.batchNumber || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vaccine.isExpired ? "bg-red-100 text-red-700" :
                      vaccine.isExpiringSoon ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {vaccine.isExpired ? "Expired" :
                       vaccine.isExpiringSoon ? "Expiring Soon" :
                       "Valid"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {vaccines.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💉</div>
          <p className="text-gray-500">No vaccines in inventory</p>
          <p className="text-sm text-gray-400">Add vaccines to track their expiration dates</p>
        </div>
      )}
    </div>
  );
}

function WasteReportTab({ wasteReport }: any) {
  if (!wasteReport) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">💰 Total Waste Value</h4>
          <p className="text-2xl font-bold text-red-700">${wasteReport.summary.totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">📦 Items Wasted</h4>
          <p className="text-2xl font-bold text-orange-700">{wasteReport.summary.totalQuantity}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">📊 Waste Events</h4>
          <p className="text-2xl font-bold text-yellow-700">{wasteReport.summary.recordCount}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-800 mb-2">📈 Avg per Event</h4>
          <p className="text-2xl font-bold text-purple-700">
            ${wasteReport.summary.recordCount > 0 ? 
              (wasteReport.summary.totalValue / wasteReport.summary.recordCount).toFixed(2) : 
              "0.00"
            }
          </p>
        </div>
      </div>

      {/* Waste by Category */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="font-medium text-gray-900 mb-4">🗑️ Waste by Category (Last 30 Days)</h4>
        <div className="space-y-3">
          {Object.entries(wasteReport.summary.wasteByCategory).map(([category, data]: [string, any]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 capitalize">{category}</p>
                <p className="text-sm text-gray-600">{data.quantity} items wasted</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">${data.value.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Waste Records */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="font-medium text-gray-900">📋 Recent Waste Records</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {wasteReport.records.slice(0, 10).map((record: any) => (
                <tr key={record._id}>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(record.wasteDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {record.itemName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.quantityWasted}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.reason}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    ${record.totalValue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.batchNumber || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {wasteReport.records.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-gray-500">No waste recorded in the last 30 days</p>
          <p className="text-sm text-gray-400">Great job minimizing waste!</p>
        </div>
      )}
    </div>
  );
}

function InventoryCard({ 
  item, 
  onForecast 
}: { 
  item: any; 
  onForecast: () => void;
}) {
  const [showStockForm, setShowStockForm] = useState(false);
  const updateStock = useMutation(api.inventory.updateStock);

  const handleStockUpdate = async (quantityChange: number, reason: string, expirationDate?: number, batchNumber?: string) => {
    try {
      await updateStock({
        itemId: item._id,
        quantityChange,
        reason,
        expirationDate,
        batchNumber,
      });
      toast.success("Stock updated successfully");
      setShowStockForm(false);
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const isLowStock = item.currentStock <= item.minThreshold;
  const stockPercentage = Math.min((item.currentStock / (item.minThreshold * 2)) * 100, 100);
  
  // Check expiry status
  const now = Date.now();
  const isExpired = item.expirationDate && item.expirationDate < now;
  const isExpiringSoon = item.expirationDate && 
    item.expirationDate >= now && 
    item.expirationDate <= (now + (7 * 24 * 60 * 60 * 1000));

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${
      isExpired ? 'border-red-300 bg-red-50' : 
      isExpiringSoon ? 'border-orange-300 bg-orange-50' :
      isLowStock ? 'border-yellow-300' : ''
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{item.itemName}</h4>
          <p className="text-sm text-gray-500 capitalize">{item.category}</p>
        </div>
        <div className="flex gap-1">
          {isExpired && <span className="text-red-500 text-xl">🚨</span>}
          {isExpiringSoon && <span className="text-orange-500 text-xl">⚠️</span>}
          {isLowStock && <span className="text-yellow-500 text-xl">📉</span>}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Current Stock:</span>
          <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
            {item.currentStock}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Min Threshold:</span>
          <span>{item.minThreshold}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Unit Price:</span>
          <span>${item.unitPrice.toFixed(2)}</span>
        </div>
        
        {item.expirationDate && (
          <div className="flex justify-between text-sm">
            <span>Expires:</span>
            <span className={`${
              isExpired ? 'text-red-600 font-medium' :
              isExpiringSoon ? 'text-orange-600 font-medium' :
              'text-gray-600'
            }`}>
              {new Date(item.expirationDate).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {item.batchNumber && (
          <div className="flex justify-between text-sm">
            <span>Batch:</span>
            <span className="text-gray-600">{item.batchNumber}</span>
          </div>
        )}
        
        {item.storageRequirements && (
          <div className="text-xs text-gray-500 mt-2">
            Storage: {item.storageRequirements}
          </div>
        )}
        
        {/* Stock Level Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              stockPercentage > 50 ? 'bg-green-500' : 
              stockPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(stockPercentage, 5)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowStockForm(true)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Update Stock
        </button>
        <button
          onClick={onForecast}
          className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
        >
          📊 ML Forecast
        </button>
      </div>

      {showStockForm && (
        <StockUpdateForm
          item={item}
          onUpdate={handleStockUpdate}
          onClose={() => setShowStockForm(false)}
        />
      )}
    </div>
  );
}

function StockUpdateForm({ 
  item, 
  onUpdate, 
  onClose 
}: { 
  item: any;
  onUpdate: (quantity: number, reason: string, expirationDate?: number, batchNumber?: string) => void;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isIncrease, setIsIncrease] = useState(true);
  const [expirationDate, setExpirationDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    const expDate = expirationDate ? new Date(expirationDate).getTime() : undefined;
    
    onUpdate(
      isIncrease ? quantityNum : -quantityNum, 
      reason || (isIncrease ? "restock" : "usage"),
      expDate,
      batchNumber || undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Update Stock: {item.itemName}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsIncrease(true)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                  isIncrease ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                + Add Stock
              </button>
              <button
                type="button"
                onClick={() => setIsIncrease(false)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                  !isIncrease ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                - Remove Stock
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isIncrease ? "Restock from supplier" : "Used in appointment"}
              />
            </div>

            {isIncrease && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., BATCH2024001"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddItemForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    currentStock: "",
    minThreshold: "",
    unitPrice: "",
    supplier: "",
    expirationDate: "",
    batchNumber: "",
    storageRequirements: "",
  });

  const addItem = useMutation(api.inventory.addInventoryItem);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addItem({
        itemName: formData.itemName,
        category: formData.category,
        currentStock: parseInt(formData.currentStock),
        minThreshold: parseInt(formData.minThreshold),
        unitPrice: parseFloat(formData.unitPrice),
        supplier: formData.supplier || undefined,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate).getTime() : undefined,
        batchNumber: formData.batchNumber || undefined,
        storageRequirements: formData.storageRequirements || undefined,
      });
      
      toast.success("Item added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const categories = ["medication", "supplies", "food", "equipment", "vaccines"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Item</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Threshold *
                </label>
                <input
                  type="number"
                  value={formData.minThreshold}
                  onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., BATCH2024001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Requirements
              </label>
              <input
                type="text"
                value={formData.storageRequirements}
                onChange={(e) => setFormData({ ...formData, storageRequirements: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Refrigerate 2-8°C"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Simple Chart Components (keeping existing chart components)
function LineChart({ data, title, color = "#3B82F6" }: { data: number[]; title: string; color?: string }) {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-lg p-4 border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="relative h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          <polygon
            fill={`url(#gradient-${title})`}
            points={`0,100 ${points} 100,100`}
          />
        </svg>
        <div className="absolute top-0 right-0 text-xs text-gray-500">{maxValue.toFixed(1)}</div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-500">{minValue.toFixed(1)}</div>
      </div>
    </div>
  );
}

function BarChart({ data, labels, title, color = "#10B981" }: { 
  data: number[]; 
  labels: string[]; 
  title: string; 
  color?: string;
}) {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className="bg-white rounded-lg p-4 border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-16 text-xs text-gray-600 truncate">{labels[index]}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
              <div
                className="h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${(value / maxValue) * 100}%`,
                  backgroundColor: color
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GaugeChart({ value, max, title, color = "#F59E0B" }: { 
  value: number; 
  max: number; 
  title: string; 
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180;
  
  return (
    <div className="bg-white rounded-lg p-4 border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="relative w-32 h-16 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 50">
          <path
            d="M 10 40 A 30 30 0 0 1 90 40"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 40 A 30 30 0 0 1 90 40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 1.57} 157`}
          />
          <line
            x1="50"
            y1="40"
            x2={50 + 25 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={40 + 25 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-lg font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">/ {max}</div>
        </div>
      </div>
    </div>
  );
}

function ForecastModal({ 
  itemId, 
  onClose 
}: { 
  itemId: Id<"inventory">; 
  onClose: () => void;
}) {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const getForecast = useAction(api.inventory.getInventoryForecast);
  const usageHistory = useQuery(api.inventory.getUsageHistory, 
    forecast ? { itemId, days: 30 } : "skip"
  );

  const handleGetForecast = async () => {
    setLoading(true);
    try {
      const result = await getForecast({ itemId, days: 30 });
      setForecast(result);
    } catch (error) {
      toast.error("Failed to generate forecast");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = usageHistory ? (() => {
    const dailyUsage = new Map<string, number>();
    usageHistory.forEach((usage: any) => {
      const date = new Date(usage.usageDate).toISOString().split('T')[0];
      dailyUsage.set(date, (dailyUsage.get(date) || 0) + usage.quantityUsed);
    });

    const last30Days = [];
    const labels = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const shortLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      last30Days.push(dailyUsage.get(dateStr) || 0);
      labels.push(shortLabel);
    }

    return { usage: last30Days, labels };
  })() : { usage: [], labels: [] };

  // Generate forecast projection data
  const forecastData = forecast ? (() => {
    const dailyRate = parseFloat(forecast.forecast.dailyUsageRate.split(' ')[0]);
    const currentStock = forecast.currentStock;
    const projectionDays = 30;
    
    const stockProjection = [];
    for (let i = 0; i <= projectionDays; i++) {
      const projectedStock = Math.max(0, currentStock - (dailyRate * i));
      stockProjection.push(projectedStock);
    }
    
    return stockProjection;
  })() : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📊 ML Inventory Forecast</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {!forecast ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-600 mb-4">
                Generate machine learning-powered inventory forecast using statistical algorithms including moving averages, exponential smoothing, and trend analysis.
              </p>
              <button
                onClick={handleGetForecast}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Generate ML Forecast"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Item: {forecast.item}</h4>
                <p className="text-sm text-gray-600">Current Stock: {forecast.currentStock}</p>
                {forecast.expirationDate && (
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(forecast.expirationDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Generated: {new Date(forecast.generatedAt).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Method: {forecast.forecast.method}
                </p>
              </div>

              {/* Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage History Chart */}
                <div className="lg:col-span-2">
                  <LineChart 
                    data={chartData.usage} 
                    title="📈 Daily Usage History (Last 30 Days)"
                    color="#3B82F6"
                  />
                </div>

                {/* Stock Projection Chart */}
                <div className="lg:col-span-2">
                  <LineChart 
                    data={forecastData} 
                    title="📉 Stock Depletion Projection (Next 30 Days)"
                    color="#EF4444"
                  />
                </div>

                {/* Algorithm Performance */}
                <BarChart
                  data={[
                    parseFloat(forecast.forecast.algorithms.movingAverage7Days),
                    parseFloat(forecast.forecast.algorithms.movingAverage14Days),
                    parseFloat(forecast.forecast.algorithms.exponentialSmoothing)
                  ]}
                  labels={['7-Day MA', '14-Day MA', 'Exp. Smooth']}
                  title="🔧 Algorithm Predictions"
                  color="#8B5CF6"
                />

                {/* Stock Level Gauge */}
                <GaugeChart
                  value={forecast.currentStock}
                  max={forecast.currentStock + 50}
                  title="📊 Current Stock Level"
                  color="#10B981"
                />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">📈 Usage Rate</h5>
                  <p className="text-blue-700 text-sm">{forecast.forecast.dailyUsageRate}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Range: {forecast.forecast.confidenceInterval}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h5 className="font-medium text-orange-900 mb-2">⏰ Depletion</h5>
                  <p className="text-orange-700 text-sm">{forecast.forecast.depletionDate}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">📦 Reorder</h5>
                  <p className="text-green-700 text-sm">{forecast.forecast.recommendedReorder}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-2">🔍 Patterns</h5>
                  <p className="text-purple-700 text-sm">{forecast.forecast.patterns}</p>
                </div>
              </div>

              {/* Model Performance */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">🎯 Model Performance</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {forecast.forecast.confidence.split('(')[0].trim()}
                    </div>
                    <div className="text-sm text-gray-600">Confidence Level</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {forecast.forecast.confidence.split('(')[1]?.replace(')', '') || ''}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {forecast.forecast.trendStrength}
                    </div>
                    <div className="text-sm text-gray-600">Trend Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {forecast.forecast.seasonality.includes('Weekly') ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">Seasonality</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {forecast.forecast.seasonality}
                    </div>
                  </div>
                </div>
              </div>

              {/* Algorithm Details */}
              <details className="bg-blue-50 rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-blue-900 mb-2">
                  🔧 Algorithm Details & Technical Metrics
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 mt-3">
                  <div>
                    <p><strong>7-Day Moving Average:</strong> {forecast.forecast.algorithms.movingAverage7Days}</p>
                    <p><strong>14-Day Moving Average:</strong> {forecast.forecast.algorithms.movingAverage14Days}</p>
                    <p><strong>Exponential Smoothing:</strong> {forecast.forecast.algorithms.exponentialSmoothing}</p>
                  </div>
                  <div>
                    <p><strong>Trend Slope:</strong> {forecast.forecast.algorithms.trendSlope}</p>
                    <p><strong>Seasonal Adjustment:</strong> {forecast.forecast.algorithms.seasonalFactor}</p>
                    <p><strong>Data Points Analyzed:</strong> 60 days</p>
                  </div>
                </div>
              </details>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
