"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentScheduling() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    patientId: "",
    appointmentDate: "",
    reason: "Regular checkup",
    location: "PHC/Home visit",
    notes: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      router.push("/");
      return;
    }
    
    fetchPatients();
    fetchAppointments();
  }, [session, status, router]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/asha/patients");
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/asha/appointments");
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/asha/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Appointment scheduled successfully!");
        setFormData({
          patientId: "",
          appointmentDate: "",
          reason: "Regular checkup",
          location: "PHC/Home visit",
          notes: "",
        });
        fetchAppointments(); // Refresh appointments list
      } else {
        setMessage(data.error || "Failed to schedule appointment");
      }
    } catch (error) {
      setMessage("Error scheduling appointment");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Appointment Scheduling
              </h1>
              <p className="text-gray-600">Schedule appointments with your patients</p>
            </div>
            <button
              onClick={() => router.push("/asha-dashboard")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule New Appointment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Schedule New Appointment
            </h2>
            
            {patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No patients assigned yet.</p>
                <p className="text-sm mt-2">
                  Please add patients to your list first.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.name} - {patient.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Regular checkup">Regular checkup</option>
                    <option value="Prenatal checkup">Prenatal checkup</option>
                    <option value="Follow-up visit">Follow-up visit</option>
                    <option value="Emergency consultation">Emergency consultation</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Health education">Health education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., PHC/Home visit, Community Center"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Any additional notes for the appointment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </form>
            )}

            {message && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  message.includes("successfully")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upcoming Appointments ({appointments.length})
            </h2>
            
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No appointments scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {/* <h3 className="font-semibold text-gray-800">
                          {appointment.patient.name}
                        </h3> */}
                        {/* <p className="text-sm text-gray-600">
                          {appointment.patient.phone}
                        </p> */}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p>
                        <span className="font-medium">Reason:</span>{" "}
                        {appointment.reason}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {appointment.location}
                      </p>
                      {appointment.notes && (
                        <p>
                          <span className="font-medium">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
