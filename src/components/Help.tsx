import { useState } from "react";

export function Help() {
  const [activeSection, setActiveSection] = useState<"faq" | "contact" | "guides">("faq");

  const faqData = [
    {
      question: "How do I book an appointment?",
      answer: "Navigate to the 'My Appointments' tab and click 'Book New Appointment'. Select your pet, choose a date and time, and provide the reason for the visit."
    },
    {
      question: "Can I cancel or reschedule an appointment?",
      answer: "Yes, you can cancel appointments from the 'My Appointments' tab. For rescheduling, please cancel the existing appointment and book a new one, or contact the clinic directly."
    },
    {
      question: "How do I add a new pet to my account?",
      answer: "Go to the 'My Pets' tab and click 'Add New Pet'. Fill in your pet's information including name, species, breed, age, and any medical notes."
    },
    {
      question: "Where can I view my pet's medical history?",
      answer: "In the 'My Pets' tab, click on any pet card to view detailed information including vaccination records, medical history, and current medications."
    },
    {
      question: "What should I do in case of an emergency?",
      answer: "For emergencies, please call the clinic directly at (555) 123-4567. Do not rely on the online booking system for urgent medical situations."
    }
  ];

  const adminFaqData = [
    {
      question: "How do I handle pending appointment requests?",
      answer: "Check the 'Pending Requests' tab regularly. You can confirm or decline appointments, and add notes explaining your decision."
    },
    {
      question: "How do I add medical records for a pet?",
      answer: "In the 'Pet Records' tab, find the pet and click to view details. You can add vaccinations, medications, and update medical notes."
    },
    {
      question: "How do I manage inventory?",
      answer: "Use the 'Inventory' tab to track supplies, medications, and equipment. The system provides low stock alerts and expiration tracking."
    },
    {
      question: "Can I see all appointments for a specific day?",
      answer: "Yes, in the 'Appointments' tab, use the date filter to view all appointments for any specific day."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">❓ Help & Support</h3>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 border-b">
        {[
          { key: "faq", label: "FAQ", icon: "❓" },
          { key: "guides", label: "User Guides", icon: "📖" },
          { key: "contact", label: "Contact Support", icon: "📞" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
              activeSection === tab.key
                ? "bg-blue-100 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      {activeSection === "faq" && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Frequently Asked Questions</h4>
          
          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <details key={index} className="bg-white rounded-lg border">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                  {faq.question}
                </summary>
                <div className="px-4 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Admin-specific FAQ */}
          <div className="mt-8">
            <h5 className="font-medium text-gray-900 mb-4">For Veterinarians & Staff</h5>
            <div className="space-y-3">
              {adminFaqData.map((faq, index) => (
                <details key={index} className="bg-blue-50 rounded-lg border border-blue-200">
                  <summary className="p-4 cursor-pointer font-medium text-blue-900 hover:bg-blue-100">
                    {faq.question}
                  </summary>
                  <div className="px-4 pb-4 text-blue-700">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Guides Section */}
      {activeSection === "guides" && (
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">User Guides</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="text-3xl mb-3">🐕</div>
              <h5 className="font-semibold text-gray-900 mb-2">Pet Owner Guide</h5>
              <p className="text-gray-600 text-sm mb-4">
                Learn how to manage your pets' health records and book appointments.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Setting up your pet profiles</li>
                <li>• Booking and managing appointments</li>
                <li>• Viewing medical history</li>
                <li>• Understanding vaccination schedules</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="text-3xl mb-3">👨‍⚕️</div>
              <h5 className="font-semibold text-gray-900 mb-2">Veterinarian Guide</h5>
              <p className="text-gray-600 text-sm mb-4">
                Complete guide for managing clinic operations and patient care.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Managing appointment requests</li>
                <li>• Updating patient records</li>
                <li>• Inventory management</li>
                <li>• Generating reports</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="text-3xl mb-3">📱</div>
              <h5 className="font-semibold text-gray-900 mb-2">Mobile Access</h5>
              <p className="text-gray-600 text-sm mb-4">
                Access VetCare on your mobile device for on-the-go management.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Responsive design tips</li>
                <li>• Mobile-friendly features</li>
                <li>• Quick actions</li>
                <li>• Offline capabilities</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="text-3xl mb-3">🔒</div>
              <h5 className="font-semibold text-gray-900 mb-2">Privacy & Security</h5>
              <p className="text-gray-600 text-sm mb-4">
                Understanding how your data is protected and managed.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Data encryption</li>
                <li>• Access controls</li>
                <li>• Privacy settings</li>
                <li>• HIPAA compliance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Section */}
      {activeSection === "contact" && (
        <div className="space-y-6">
          <h4 className="font-medium text-gray-900">Contact Support</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <h5 className="font-semibold text-gray-900 mb-4">🏥 Clinic Information</h5>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-gray-600">123 Veterinary Lane<br />Pet City, PC 12345</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Phone</p>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">info@vetcare.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Hours</p>
                  <p className="text-gray-600">
                    Mon-Fri: 8:00 AM - 6:00 PM<br />
                    Sat: 9:00 AM - 4:00 PM<br />
                    Sun: Emergency only
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h5 className="font-semibold text-gray-900 mb-4">📧 Send us a Message</h5>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Technical Support</option>
                    <option>Appointment Issue</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe your issue or question..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">🚨</span>
              <h5 className="font-medium text-red-800">Emergency Contact</h5>
            </div>
            <p className="text-red-700 text-sm">
              For veterinary emergencies, please call our emergency line at <strong>(555) 911-PETS</strong> 
              or visit the nearest emergency animal hospital. Do not use this system for urgent medical situations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
