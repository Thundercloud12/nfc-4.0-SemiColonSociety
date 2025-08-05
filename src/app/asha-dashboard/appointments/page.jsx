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

    if (session.user.role !== "asha") {
      router.push("/");
      return;
    }

    fetchPatients();
    fetchAppointments();

    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [session, status, router]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/asha/patients");
      if (response.ok) {
        const data = await response.json();
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
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!navigator.onLine) {
        const offlineResult = await offlineManager.storeAppointmentOffline(
          formData,
          session.user.id
        );

        if (offlineResult.success) {
          setMessage("Appointment scheduled offline! It will sync when online.");
          resetForm();
        } else {
          setMessage("Failed to save appointment offline. Please try again.");
        }
        return;
      }

      const response = await fetch("/api/asha/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Appointment scheduled successfully!");
        resetForm();
        fetchAppointments();
      } else {
        setMessage(data.error || "Failed to schedule appointment");
      }
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      if (!navigator.onLine) {
        try {
          const offlineResult = await offlineManager.storeAppointmentOffline(
            formData,
            session.user.id
          );
          if (offlineResult.success) {
            setMessage(
              "Connection issue. Appointment saved offline and will sync later."
            );
            resetForm();
          } else {
            setMessage("Failed to save appointment. Please try again.");
          }
        } catch (offlineError) {
          console.error("Failed to save offline:", offlineError);
          setMessage(
            "Unable to save offline. Please check storage and try again."
          );
        }
      } else {
        setMessage(
          "Error scheduling appointment. Please check your connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      appointmentDate: "",
      reason: "Regular checkup",
      location: "PHC/Home visit",
      notes: "",
    });
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
        return "bg-pink-100 text-gray-800";
      case "completed":
        return "bg-green-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-gray-800";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-500">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6">
      <OfflineStatus />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-t-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                Appointment Scheduling
              </h1>
              <p className="text-gray-600 text-lg">
                Schedule and manage appointments with your patients.
              </p>
            </div>
            <button
              onClick={() => router.push("/asha-dashboard")}
              className="px-6 py-3 bg-gradient-to-r from-pink-300 to-pink-400 text-white rounded-lg hover:from-pink-400 hover:to-pink-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="mb-6 bg-pink-100 border border-pink-300 text-pink-700 px-4 py-3 rounded-lg shadow-sm text-center text-sm">
            You are offline. Appointments will be saved locally and synced
            when you're online.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule New Appointment */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Schedule New Appointment
            </h2>

            {patients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
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
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="Regular checkup">Regular checkup</option>
                    <option value="Prenatal checkup">Prenatal checkup</option>
                    <option value="Follow-up visit">Follow-up visit</option>
                    <option value="Emergency consultation">
                      Emergency consultation
                    </option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Health education">Health education</option>
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
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    placeholder="Any additional notes"
                    className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  {loading ? "Scheduling..." : "Schedule Appointment"}
                </button>
              </form>
            )}

            {message && (
              <div
                className={`mt-6 p-4 rounded-xl border-l-4 ${
                  message.includes("successfully") || message.includes("offline")
                    ? "bg-green-50 text-green-800 border-green-400"
                    : "bg-red-50 text-red-800 border-red-400"
                } shadow-sm`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
              Upcoming Appointments
              <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {appointments.length}
              </span>
            </h2>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">
                  No appointments scheduled yet.
                </p>
                <p className="text-sm mt-2">
                  Scheduled appointments will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-full overflow-y-auto custom-scrollbar">
                {appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border-2 border-pink-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-pink-200 bg-gradient-to-r from-white to-pink-25"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {appointment.patient?.name || "Patient Name"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.patient?.phone || "Phone Number"}
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
                      <div className="p-2 bg-pink-50 rounded-lg">
                        <span className="font-medium text-gray-700">Date: </span>
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="p-2 bg-pink-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Reason:{" "}
                        </span>
                        {appointment.reason}
                      </div>
                      <div className="p-2 bg-pink-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Location:{" "}
                        </span>
                        {appointment.location}
                      </div>
                      {appointment.notes && (
                        <div className="p-2 bg-pink-50 rounded-lg">
                          <span className="font-medium text-gray-700">
                            Notes:{" "}
                          </span>
                          {appointment.notes}
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
