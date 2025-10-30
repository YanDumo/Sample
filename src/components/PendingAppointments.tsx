import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function PendingAppointments() {
  const [selectedAppointment, setSelectedAppointment] = useState<Id<"appointments"> | null>(null);
  
  const pendingAppointments = useQuery(api.appointments.getPendingAppointments);
  const updateAppointmentStatus = useMutation(api.appointments.updateAppointmentStatus);

  const handleStatusUpdate = async (
    appointmentId: Id<"appointments">, 
    status: "confirmed" | "declined",
    notes?: string
  ) => {
    try {
      await updateAppointmentStatus({
        appointmentId,
        status,
        notes,
      });
      
      toast.success(`Appointment ${status} successfully`);
      setSelectedAppointment(null);
    } catch (error) {
      toast.error(`Failed to ${status} appointment`);
    }
  };

  if (!pendingAppointments) {
    return <div>Loading...</div>;
  }

  if (pendingAppointments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Appointments</h3>
        <p className="text-gray-500">All appointment requests have been handled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">⏳ Pending Appointment Requests</h3>
        <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
          {pendingAppointments.length} pending
        </div>
      </div>

      <div className="grid gap-4">
        {pendingAppointments.map((appointment) => (
          <div key={appointment._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg text-gray-900">
                    {appointment.pet?.name}
                  </h4>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                    PENDING
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><strong>Owner:</strong> {appointment.owner?.name}</p>
                    <p><strong>Phone:</strong> {appointment.owner?.phone}</p>
                    <p><strong>Email:</strong> {appointment.owner?.email}</p>
                  </div>
                  <div>
                    <p><strong>Pet Type:</strong> {appointment.pet?.species}</p>
                    <p><strong>Breed:</strong> {appointment.pet?.breed || "Mixed"}</p>
                    <p><strong>Age:</strong> {appointment.pet?.age} years</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Date & Time</p>
                  <p className="text-gray-900">
                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-900">{appointment.appointmentTime}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Service</p>
                  <p className="text-gray-900">{appointment.service}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Requested By</p>
                  <p className="text-gray-900">
                    {appointment.requester?.firstName} {appointment.requester?.lastName}
                  </p>
                </div>
              </div>
              
              {appointment.reason && (
                <div className="mt-3">
                  <p className="font-medium text-gray-700">Reason for Visit</p>
                  <p className="text-gray-900">{appointment.reason}</p>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-3">
                  <p className="font-medium text-gray-700">Additional Notes</p>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleStatusUpdate(appointment._id, "confirmed")}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ✅ Confirm Appointment
              </button>
              <button
                onClick={() => setSelectedAppointment(appointment._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                ❌ Decline Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Decline Modal */}
      {selectedAppointment && (
        <DeclineModal
          appointmentId={selectedAppointment}
          onDecline={(notes) => handleStatusUpdate(selectedAppointment, "declined", notes)}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

function DeclineModal({
  appointmentId,
  onDecline,
  onClose,
}: {
  appointmentId: Id<"appointments">;
  onDecline: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDecline(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">Decline Appointment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for declining (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., No available slots, emergency cases only, etc."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Decline Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
