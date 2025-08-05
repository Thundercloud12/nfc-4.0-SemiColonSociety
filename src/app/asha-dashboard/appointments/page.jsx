"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import offlineManager from "@/lib/offlineManager";
import OfflineStatus from "@/components/OfflineStatus";

export default function AppointmentScheduling() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isOffline, setIsOffline] = useState(false);
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
    
    // Check initial offline status
    setIsOffline(!navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      // Check if offline and save locally
      if (!navigator.onLine) {
        console.log('[AppointmentScheduling] Offline - saving appointment locally');
        
        const offlineResult = await offlineManager.storeAppointmentOffline(
          formData, 
          session.user.id
        );
        
        if (offlineResult.success) {
          setMessage("📴 Appointment scheduled offline! It will be synced when connection is restored.");
          setFormData({
            patientId: "",
            appointmentDate: "",
            reason: "Regular checkup",
            location: "PHC/Home visit",
            notes: "",
          });
        } else {
          setMessage("❌ Failed to save appointment offline. Please try again.");
        }
        return;
      }

      // Online - save normally
      const response = await fetch("/api/asha/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Appointment scheduled successfully!");
        setFormData({
          patientId: "",
          appointmentDate: "",
          reason: "Regular checkup",
          location: "PHC/Home visit",
          notes: "",
        });
        fetchAppointments(); // Refresh appointments list
      } else {
        setMessage("❌ " + (data.error || "Failed to schedule appointment"));
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      
      // If network error and we're offline, try to save locally
      if (!navigator.onLine) {
        try {
          const offlineResult = await offlineManager.storeAppointmentOffline(
            formData, 
            session.user.id
          );
          
          if (offlineResult.success) {
            setMessage("📴 Connection issue detected. Appointment saved offline and will sync when connection is restored.");
            setFormData({
              patientId: "",
              appointmentDate: "",
              reason: "Regular checkup",
              location: "PHC/Home visit",
              notes: "",
            });
          } else {
            setMessage("❌ Failed to save appointment. Please try again.");
          }
        } catch (offlineError) {
          console.error("Failed to save offline:", offlineError);
          setMessage("❌ Unable to save appointment offline. Please check your device storage and try again.");
        }
      } else {
        setMessage("❌ Error scheduling appointment. Please check your connection and try again.");
      }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6">
      <OfflineStatus />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-t-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-pink-100 p-3 rounded-full mr-4">
                  📅
                </span>
                Appointment Scheduling
                {isOffline && (
                  <span className="ml-3 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                    📴 Offline Mode
                  </span>
                )}
              </h1>
              <p className="text-gray-600 text-lg">
                {isOffline 
                  ? "Offline mode: Appointments will be saved locally and synced later 💾" 
                  : "Schedule and manage appointments with your patients"
                }
              </p>
            </div>
            <button
              onClick={() => router.push("/asha-dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule New Appointment */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-pink-100 p-2 rounded-lg mr-3">
                ➕
              </span>
              Schedule New Appointment
            </h2>
            
            {patients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-pink-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-lg font-medium">No patients assigned yet.</p>
                <p className="text-sm mt-2">
                  Please add patients to your list first.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Patient *
                  </label>
                  <select
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Appointment Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    required
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Reason for Visit
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  >
                    <option value="Regular checkup">🔍 Regular checkup</option>
                    <option value="Prenatal checkup">🤱 Prenatal checkup</option>
                    <option value="Follow-up visit">📋 Follow-up visit</option>
                    <option value="Emergency consultation">🚨 Emergency consultation</option>
                    <option value="Vaccination">💉 Vaccination</option>
                    <option value="Health education">📚 Health education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., PHC/Home visit, Community Center"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Any additional notes for the appointment"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scheduling...
                    </span>
                  ) : (
                    "📅 Schedule Appointment"
                  )}
                </button>
              </form>
            )}

            {message && (
              <div
                className={`mt-6 p-4 rounded-xl border-l-4 ${
                  message.includes("successfully")
                    ? "bg-green-50 text-green-800 border-green-400"
                    : "bg-red-50 text-red-800 border-red-400"
                } shadow-sm`}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    {message.includes("successfully") ? "✅" : "❌"}
                  </span>
                  {message}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-pink-100 p-2 rounded-lg mr-3">
                  📋
                </span>
                Upcoming Appointments
              </span>
              <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {appointments.length}
              </span>
            </h2>
            
            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-pink-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📅</span>
                </div>
                <p className="text-lg font-medium">No appointments scheduled yet.</p>
                <p className="text-sm mt-2">Your scheduled appointments will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border-2 border-pink-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-pink-200 bg-gradient-to-r from-white to-pink-25"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-pink-100 p-1 rounded text-sm">👤</span>
                          <h3 className="font-bold text-gray-800 text-lg">
                            {appointment.patient?.name || 'Patient Name'}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <span>📞</span>
                          {appointment.patient?.phone || 'Phone Number'}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-2 text-xs font-bold rounded-full ${getStatusColor(
                          appointment.status
                        )} uppercase tracking-wide`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                        <span className="text-pink-500">📅</span>
                        <span className="font-medium text-gray-700">Date:</span>
                        <span className="text-gray-800">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                        <span className="text-pink-500">🎯</span>
                        <span className="font-medium text-gray-700">Reason:</span>
                        <span className="text-gray-800">{appointment.reason}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
                        <span className="text-pink-500">📍</span>
                        <span className="font-medium text-gray-700">Location:</span>
                        <span className="text-gray-800">{appointment.location}</span>
                      </div>
                      {appointment.notes && (
                        <div className="flex items-start gap-2 p-2 bg-pink-50 rounded-lg">
                          <span className="text-pink-500 mt-0.5">📝</span>
                          <span className="font-medium text-gray-700">Notes:</span>
                          <span className="text-gray-800 flex-1">{appointment.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #fdf2f8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ec4899;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #db2777;
        }
      `}</style>
    </div>
  );
}
