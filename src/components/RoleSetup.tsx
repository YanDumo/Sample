import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function RoleSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    licenseNumber: "",
  });

  const createProfile = useMutation(api.userProfiles.createUserProfile);
  const createDemoData = useMutation(api.demoData.createDemoData);

  const handleDemoAccess = async (role: "admin" | "user") => {
    try {
      const demoData = role === "admin" ? {
        role: role as "admin",
        firstName: "Dr. Demo",
        lastName: "Veterinarian", 
        email: "demo.vet@vetcare.com",
        phone: "(555) 123-4567",
        address: "123 Demo Clinic Street",
        specialization: "Small Animal Medicine",
        licenseNumber: "VET-DEMO-2024",
      } : {
        role: role as "user",
        firstName: "Demo",
        lastName: "Pet Owner",
        email: "demo.owner@petcare.com", 
        phone: "(555) 987-6543",
        address: "456 Pet Owner Lane",
      };

      await createProfile(demoData);
      
      // Create demo data after profile creation
      await createDemoData({ role });
      
      toast.success(`Demo ${role === "admin" ? "Veterinarian" : "Pet Owner"} profile created!`);
      onComplete();
    } catch (error) {
      toast.error("Failed to create demo profile");
    }
  };

  const handleRoleSelect = (role: "admin" | "user") => {
    setSelectedRole(role);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) return;

    try {
      await createProfile({
        role: selectedRole,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || undefined,
        specialization: selectedRole === "admin" ? formData.specialization || undefined : undefined,
        licenseNumber: selectedRole === "admin" ? formData.licenseNumber || undefined : undefined,
      });

      toast.success("Profile created successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to create profile");
    }
  };

  if (step === "role") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to VetCare</h2>
            <p className="text-gray-600">Please select your role to get started</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect("admin")}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">👨‍⚕️</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Veterinarian / Clinic Staff</h3>
                  <p className="text-sm text-gray-600">
                    Manage appointments, patient records, and inventory
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("user")}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🐕</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pet Owner</h3>
                  <p className="text-sm text-gray-600">
                    Book appointments and manage your pets' health records
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Demo Access Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">🚀 Try Demo Access</h4>
              <p className="text-sm text-gray-600">Explore instantly with pre-configured demo accounts</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoAccess("admin")}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                👨‍⚕️ Demo Vet
              </button>
              <button
                onClick={() => handleDemoAccess("user")}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                🐕 Demo Owner
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              Demo accounts come with sample data and full functionality
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedRole === "admin" ? "Veterinarian Setup" : "Pet Owner Setup"}
          </h2>
          <p className="text-gray-600">Please provide your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {selectedRole === "admin" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Small Animal Medicine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Veterinary license number"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep("role")}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
