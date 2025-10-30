import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AppointmentScheduler({ isAdmin }: { isAdmin: boolean }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const appointments = useQuery(api.appointments.listAppointments, {
    date: new Date(selectedDate).getTime(),
  });
  
  const pets = useQuery(api.pets.listPets, {});
  const owners = useQuery(api.owners.listOwners, {});
  
  const availableSlots = useQuery(api.appointments.getAvailableTimeSlots, {
    date: new Date(selectedDate).getTime(),
  });

  const updateStatus = useMutation(api.appointments.updateAppointmentStatus);

  const handleStatusUpdate = async (appointmentId: Id<"appointments">, status: "pending" | "confirmed" | "completed" | "cancelled" | "declined") => {
    try {
      await updateStatus({ appointmentId, status });
      toast.success(`Appointment ${status}`);
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">📅 Appointments</h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={today}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowBookingForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Book Appointment
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h4 className="font-medium text-gray-900">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
        </div>
        
        <div className="divide-y">
          {appointments?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No appointments scheduled for this date</p>
            </div>
          ) : (
            appointments?.map((appointment) => (
              <div key={appointment._id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-lg">{appointment.appointmentTime}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Pet:</strong> {appointment.pet?.name} ({appointment.pet?.species})</p>
                      <p><strong>Owner:</strong> {appointment.owner?.name}</p>
                      <p><strong>Service:</strong> {appointment.service}</p>
                      {appointment.veterinarian && (
                        <p><strong>Vet:</strong> {appointment.veterinarian}</p>
                      )}
                      {appointment.notes && (
                        <p><strong>Notes:</strong> {appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  {appointment.status === 'confirmed' && isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          selectedDate={selectedDate}
          availableSlots={availableSlots || []}
          pets={pets || []}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}

function BookingForm({ 
  selectedDate, 
  availableSlots, 
  pets, 
  onClose 
}: { 
  selectedDate: string;
  availableSlots: string[];
  pets: any[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    petId: "",
    appointmentTime: "",
    service: "",
    veterinarian: "",
    notes: "",
  });

  const createAppointment = useMutation(api.appointments.createAppointment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.petId || !formData.appointmentTime || !formData.service) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createAppointment({
        petId: formData.petId as Id<"pets">,
        appointmentDate: new Date(selectedDate).getTime(),
        appointmentTime: formData.appointmentTime,
        service: formData.service,
        veterinarian: formData.veterinarian || undefined,
        notes: formData.notes || undefined,
      });
      
      toast.success("Appointment booked successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to book appointment");
    }
  };

  const services = [
    "General Checkup",
    "Vaccination",
    "Dental Cleaning",
    "Surgery",
    "Emergency Visit",
    "Grooming",
    "X-Ray",
    "Blood Test",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Book New Appointment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pet *
              </label>
              <select
                value={formData.petId}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a pet</option>
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.species})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot *
              </label>
              <select
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a time</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veterinarian
              </label>
              <input
                type="text"
                value={formData.veterinarian}
                onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any special notes or concerns..."
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
                Book Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
