import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppointmentScheduler } from "./AppointmentScheduler";
import { InventoryDashboard } from "./InventoryDashboard";
import { PetManagement } from "./PetManagement";
import { PendingAppointments } from "./PendingAppointments";
import { Settings } from "./Settings";
import { Help } from "./Help";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"appointments" | "pending" | "pets" | "inventory" | "settings" | "help">("pending");
  
  const userProfile = useQuery(api.userProfiles.getCurrentUserProfile);
  const pendingAppointments = useQuery(api.appointments.getPendingAppointments);

  const tabs = [
    { key: "pending", label: "Pending Requests", icon: "⏳", count: pendingAppointments?.length },
    { key: "appointments", label: "Appointments", icon: "📅" },
    { key: "pets", label: "Pet Records", icon: "🐕" },
    { key: "inventory", label: "Inventory", icon: "📦" },
    { key: "settings", label: "Settings", icon: "⚙️" },
    { key: "help", label: "Help", icon: "❓" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VetCare Admin</h1>
              <p className="text-sm text-gray-600">
                Welcome back, Dr. {userProfile?.firstName} {userProfile?.lastName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {userProfile?.specialization && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {userProfile.specialization}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 py-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "pending" && <PendingAppointments />}
        {activeTab === "appointments" && <AppointmentScheduler isAdmin={true} />}
        {activeTab === "pets" && <PetManagement isAdmin={true} />}
        {activeTab === "inventory" && <InventoryDashboard />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "help" && <Help />}
      </div>
    </div>
  );
}
