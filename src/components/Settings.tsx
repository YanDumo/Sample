import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Settings() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    specialization: "",
    licenseNumber: "",
  });

  const userProfile = useQuery(api.userProfiles.getCurrentUserProfile);
  const updateProfile = useMutation(api.userProfiles.updateUserProfile);

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        specialization: userProfile.specialization || "",
        licenseNumber: userProfile.licenseNumber || "",
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address || undefined,
        specialization: formData.specialization || undefined,
        licenseNumber: formData.licenseNumber || undefined,
      });
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">⚙️ Settings</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="font-medium text-gray-900 mb-4">Profile Information</h4>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
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
                  Last Name
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
                Phone
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

            {userProfile.role === "admin" && (
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
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  setFormData({
                    firstName: userProfile.firstName || "",
                    lastName: userProfile.lastName || "",
                    phone: userProfile.phone || "",
                    address: userProfile.address || "",
                    specialization: userProfile.specialization || "",
                    licenseNumber: userProfile.licenseNumber || "",
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-gray-900">{userProfile.firstName} {userProfile.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Role</p>
                <p className="text-gray-900 capitalize">
                  {userProfile.role === "admin" ? "Veterinarian/Staff" : "Pet Owner"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-gray-900">{userProfile.phone}</p>
              </div>
            </div>

            {userProfile.address && (
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-gray-900">{userProfile.address}</p>
              </div>
            )}

            {userProfile.role === "admin" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.specialization && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Specialization</p>
                    <p className="text-gray-900">{userProfile.specialization}</p>
                  </div>
                )}
                {userProfile.licenseNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">License Number</p>
                    <p className="text-gray-900">{userProfile.licenseNumber}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="font-medium text-gray-900 mb-4">Account Settings</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Email Notifications</h5>
              <p className="text-sm text-gray-600">Receive appointment reminders and updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">SMS Notifications</h5>
              <p className="text-sm text-gray-600">Receive text message reminders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
