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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Patient ${data.patient.name} added successfully!`);
        setPatientCode("");
        fetchPatients();
      } else {
        setMessage(data.error || "Failed to add patient");
      }
    } catch {
      setMessage("Error adding patient");
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ASHA Worker Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Patient: <span className="font-semibold">{session.user.name}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/asha-dashboard/appointments")}
                className="px-6 py-2 bg-gradient-to-r from-pink-300 to-pink-400 text-white rounded-lg hover:from-pink-400 hover:to-pink-500 shadow-md hover:shadow-lg transition-all"
              >
                Manage Appointments
              </button>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="px-6 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 shadow-md hover:shadow-lg transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Patient Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100 lg:col-span-1 flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Patient</h2>
            <form onSubmit={handleAddPatient} className="flex flex-col gap-4 w-full max-w-sm">
              <div>
                <label
                  htmlFor="patientCode"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Patient Unique Code
                </label>
                <input
                  type="text"
                  id="patientCode"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  placeholder="Enter patient's unique code"
                  className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? "Adding..." : "Add Patient"}
              </button>
            </form>
            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                  message.includes("successfully")
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Patients List */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              My Patients ({patients.length})
            </h2>
            {patients.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="text-lg font-medium">No patients assigned yet.</p>
                <p className="text-sm mt-2">
                  Use the form to add patients using their unique codes.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {patients.map((patient) => (
                  <div
                    key={patient._id}
                    className="border border-pink-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-white to-pink-50"
                    onClick={() =>
                      router.push(`/asha-dashboard/patient/${patient._id}`)
                    }
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {patient.name}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold ${
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
                      {patient.pregnancyInfo?.month && (
                        <p>
                          <span className="font-medium">Pregnancy Month:</span>{" "}
                          {patient.pregnancyInfo.month}
                        </p>
                      )}
                    </div>
                    <div className="mt-5">
                      <div className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium text-center shadow-md">
                        View Details →
                      </div>
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
