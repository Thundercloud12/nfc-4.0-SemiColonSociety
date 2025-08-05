"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AshaDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [patientCode, setPatientCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/asha/add-patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Patient ${data.patient.name} added successfully!`);
        setPatientCode("");
        fetchPatients(); // Refresh the patients list
      } else {
        setMessage(data.error || "Failed to add patient");
      }
    } catch (error) {
      setMessage("Error adding patient");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ASHA Worker Dashboard
          </h1>
          <p className="text-gray-600">Welcome, {session.user.name}</p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => router.push("/asha-dashboard/appointments")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Manage Appointments
            </button>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Add Patient Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Add New Patient
          </h2>
          <form onSubmit={handleAddPatient} className="flex gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="patientCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Patient Unique Code
              </label>
              <input
                type="text"
                id="patientCode"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                placeholder="Enter patient's unique code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Adding..." : "Add Patient"}
            </button>
          </form>
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

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            My Patients ({patients.length})
          </h2>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No patients assigned yet.</p>
              <p className="text-sm mt-2">
                Use the form above to add patients using their unique codes.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/asha-dashboard/patient/${patient._id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {patient.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        patient.role === "pregnant"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {patient.role}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Phone:</span> {patient.phone}
                    </p>
                    {patient.email && (
                      <p>
                        <span className="font-medium">Email:</span> {patient.email}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Code:</span> {patient.uniqueCode}
                    </p>
                    {patient.pregnancyInfo && patient.pregnancyInfo.month && (
                      <p>
                        <span className="font-medium">Pregnancy Month:</span>{" "}
                        {patient.pregnancyInfo.month}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm text-center">
                      Click to View Details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
