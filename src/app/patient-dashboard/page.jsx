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
    
    // Check if user is pregnant woman
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

  if (status === "loading" || loading) {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Patient Dashboard
          </h1>
          <p className="text-gray-600">Welcome, {session.user.name}</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => router.push("/patient-dashboard/symptom-logger")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Log Symptoms
            </button>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Upcoming Appointments
              </h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {upcomingAppointments.length}
              </span>
            </div>
            
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No upcoming appointments</p>
                <p className="text-sm mt-2">
                  Your ASHA worker will schedule appointments for you.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {appointment.reason}
                        </h3>
                        <p className="text-sm text-gray-600">
                          with ASHA {appointment.ashaWorker.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {getDaysUntil(appointment.appointmentDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {appointment.location}
                      </p>
                      <p>
                        <span className="font-medium">ASHA Contact:</span>{" "}
                        {appointment.ashaWorker.phone}
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

          {/* Missed Appointments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Missed Appointments
              </h2>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {missedAppointments.length}
              </span>
            </div>
            
            {missedAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No missed appointments</p>
                <p className="text-sm mt-2">
                  Great job keeping up with your healthcare schedule!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {missedAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border border-red-200 rounded-lg p-4 bg-red-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {appointment.reason}
                        </h3>
                        <p className="text-sm text-gray-600">
                          with ASHA {appointment.ashaWorker.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                          Missed
                        </span>
                        <p className="text-xs text-red-500 mt-1">
                          {getDaysUntil(appointment.appointmentDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p>
                        <span className="font-medium">Location:</span>{" "}
                        {appointment.location}
                      </p>
                      <p>
                        <span className="font-medium">ASHA Contact:</span>{" "}
                        {appointment.ashaWorker.phone}
                      </p>
                      {appointment.notes && (
                        <p>
                          <span className="font-medium">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <strong>Action needed:</strong> Please contact your ASHA worker to reschedule this appointment.
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
