"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [missedAppointments, setMissedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "pregnant") {
      router.push("/");
      return;
    }

    fetchAppointments();
  }, [session, status, router]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/patient/appointments");
      if (response.ok) {
        const data = await response.json();

        setUpcomingAppointments(data.upcomingAppointments || []);
        setMissedAppointments(data.missedAppointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
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

  const getDaysUntil = (dateString) => {
    const appointmentDate = new Date(dateString);
    const today = new Date();
    const timeDiff = appointmentDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Tomorrow";
    if (daysDiff > 1) return `In ${daysDiff} days`;
    return `${Math.abs(daysDiff)} days ago`;
  };

 const handleEmergency = () => {
  if (!session) {
    alert("User session not found");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const response = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id, // user identifier
            userLocation: { lat, lng },
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert("Emergency alert sent successfully to your ASHA worker!");
        } else {
          alert(data.error || "Failed to send emergency alert.");
        }
      } catch (error) {
        console.error(error);
        alert("Error sending emergency alert. Please try again.");
      }
    },
    (error) => {
      alert("Unable to retrieve your location: " + error.message);
    },
    { enableHighAccuracy: true }
  );
};


  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🤱</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Patient Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Welcome back, {session.user.name}! 💖
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/patient-dashboard/symptom-logger")}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                📝 Log Symptoms
              </button>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={handleEmergency}
            className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-lg shadow-lg transition duration-200"
          >
            🚨 Emergency Alert
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="bg-blue-100 p-2 rounded-lg mr-3">📅</span>
                Upcoming Appointments
              </h2>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                {upcomingAppointments.length}
              </span>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">
                  No upcoming appointments
                </p>
                <p className="text-sm">
                  Your ASHA worker will schedule appointments for you.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-blue-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg flex items-center">
                          <span className="mr-2">🏥</span>
                          {appointment.reason}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          with ASHA {appointment.ashaWorker.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-bold ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                        <p className="text-xs text-blue-600 mt-2 font-semibold">
                          {getDaysUntil(appointment.appointmentDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">🗓️ Date:</span>
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">📍 Location:</span>
                        {appointment.location}
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">📞 ASHA Contact:</span>
                        {appointment.ashaWorker.phone}
                      </p>
                      {appointment.notes && (
                        <p className="flex items-start">
                          <span className="font-semibold mr-2">📝 Notes:</span>
                          <span className="flex-1">{appointment.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missed Appointments */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="bg-red-100 p-2 rounded-lg mr-3">⚠️</span>
                Missed Appointments
              </h2>
              <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                {missedAppointments.length}
              </span>
            </div>

            {missedAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-xl font-bold text-gray-700 mb-2">
                  No missed appointments
                </p>
                <p className="text-sm">
                  Great job keeping up with your healthcare schedule! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100">
                {missedAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border-2 border-red-300 rounded-xl p-6 bg-red-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg flex items-center">
                          <span className="mr-2">❌</span>
                          {appointment.reason}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          with ASHA {appointment.ashaWorker.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 text-xs rounded-full bg-red-200 text-red-800 font-bold">
                          Missed
                        </span>
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          {getDaysUntil(appointment.appointmentDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">🗓️ Date:</span>
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">📍 Location:</span>
                        {appointment.location}
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">📞 ASHA Contact:</span>
                        {appointment.ashaWorker.phone}
                      </p>
                      {appointment.notes && (
                        <p className="flex items-start">
                          <span className="font-semibold mr-2">📝 Notes:</span>
                          <span className="flex-1">{appointment.notes}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg text-sm text-yellow-800">
                      <div className="flex items-center">
                        <span className="mr-2">⚡</span>
                        <strong>Action needed:</strong>
                      </div>
                      <p className="mt-1">
                        Please contact your ASHA worker to reschedule this
                        appointment.
                      </p>
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