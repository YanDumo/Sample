import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function PetManagement({ isAdmin }: { isAdmin: boolean }) {
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [showAddOwnerForm, setShowAddOwnerForm] = useState(false);
  
  const pets = useQuery(api.pets.listPets, {});
  const owners = useQuery(api.owners.listOwners, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">🐕 Pet Management</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddOwnerForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            + Add Owner
          </button>
          <button
            onClick={() => setShowAddPetForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Pet
          </button>
        </div>
      </div>

      {/* Pets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets?.map((pet) => {
          const owner = owners?.find(o => o._id === pet.ownerId);
          return (
            <div key={pet._id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{pet.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{pet.species}</p>
                </div>
                <span className="text-2xl">
                  {pet.species === 'dog' ? '🐕' : 
                   pet.species === 'cat' ? '🐱' : 
                   pet.species === 'bird' ? '🐦' : '🐾'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {pet.breed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span>{pet.breed}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span>{pet.age} years</span>
                </div>
                {pet.weight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span>{pet.weight} lbs</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner:</span>
                  <span>{owner?.name || 'Unknown'}</span>
                </div>
                {owner?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-xs">{owner.phone}</span>
                  </div>
                )}
              </div>

              {pet.medicalNotes && (
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                  <strong>Medical Notes:</strong> {pet.medicalNotes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pets?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🐾</div>
          <p className="text-gray-500">No pets registered yet</p>
          <p className="text-sm text-gray-400">Add an owner first, then add their pets</p>
        </div>
      )}

      {/* Add Pet Form */}
      {showAddPetForm && (
        <AddPetForm 
          owners={owners || []}
          onClose={() => setShowAddPetForm(false)} 
        />
      )}

      {/* Add Owner Form */}
      {showAddOwnerForm && (
        <AddOwnerForm onClose={() => setShowAddOwnerForm(false)} />
      )}
    </div>
  );
}

function AddPetForm({ 
  owners, 
  onClose 
}: { 
  owners: any[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
    ownerId: "",
    medicalNotes: "",
  });

  const createPet = useMutation(api.pets.createPet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.species || !formData.age || !formData.ownerId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createPet({
        name: formData.name,
        species: formData.species.toLowerCase(),
        breed: formData.breed || undefined,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        ownerId: formData.ownerId as any,
        medicalNotes: formData.medicalNotes || undefined,
      });
      
      toast.success("Pet added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add pet");
    }
  };

  const species = ["dog", "cat", "bird", "rabbit", "hamster", "fish", "reptile"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Pet</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pet Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species *
              </label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select species</option>
                {species.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age (years) *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner *
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select owner</option>
                {owners.map((owner) => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} - {owner.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Notes
              </label>
              <textarea
                value={formData.medicalNotes}
                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any allergies, conditions, or special notes..."
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
                Add Pet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddOwnerForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const createOwner = useMutation(api.owners.createOwner);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createOwner({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || undefined,
      });
      
      toast.success("Owner added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add owner");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Owner</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
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
                Phone Number *
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
                placeholder="Street address, city, state, zip"
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Owner
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
