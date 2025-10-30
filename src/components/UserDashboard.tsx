import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppointmentScheduler } from "./AppointmentScheduler";
import { PetManagement } from "./PetManagement";
import { Settings } from "./Settings";
import { Help } from "./Help";

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState<"appointments" | "pets" | "settings" | "help">("appointments");
  
  const userProfile = useQuery(api.userProfiles.getCurrentUserProfile);
  const myAppointments = useQuery(api.appointments.listAppointments, {});

  const upcomingAppointments = myAppointments?.filter(apt => 
    apt.appointmentDate >= Date.now() && apt.status !== "cancelled"
  ).length || 0;

  const tabs = [
    { key: "appointments", label: "My Appointments", icon: "📅", count: upcomingAppointments },
    { key: "pets", label: "My Pets", icon: "🐕" },
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
              <h1 className="text-2xl font-bold text-gray-900">VetCare Portal</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {userProfile?.firstName} {userProfile?.lastName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Pet Owner
              </span>
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
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "appointments" && <AppointmentScheduler isAdmin={false} />}
        {activeTab === "pets" && <PetManagement isAdmin={false} />}
        {activeTab === "settings" && <Settings />}
        {activeTab === "help" && <Help />}
      </div>
    </div>
  );
}
