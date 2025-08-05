"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FamilyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/family-login");
      return;
    }
    
    if (session.user.role !== "family") {
      router.push("/");
      return;
    }
    
    fetchPatientDetails();
  }, [session, status, router]);

  const fetchPatientDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/family/patient-details");
      
      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch patient details");
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setError("Error loading patient details");
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

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return "bg-green-100 text-green-700";
      case "moderate":
        return "bg-yellow-100 text-yellow-700";
      case "severe":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border-2 border-red-300 text-red-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <span className="mr-3 text-2xl">❌</span>
              <div>
                <h3 className="font-bold text-lg">Error Loading Patient Information</h3>
                <p>{error}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push("/family-login")}
              className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={fetchPatientDetails}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-700 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <span className="mr-3 text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-lg">No Patient Information Found</h3>
                <p>Unable to find patient details linked to your account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-pink-100 p-3 rounded-full mr-4">
                  👨‍👩‍👧‍👦
                </span>
                Family Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Monitoring health information for {patient.name}</p>
            </div>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-pink-100 p-2 rounded-lg mr-3">
                  🤱
                </span>
                Patient Information
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <label className="text-sm font-semibold text-pink-700 uppercase tracking-wide">Name</label>
                  <p className="text-xl font-bold text-gray-800 mt-1">{patient.name}</p>
                </div>
                
                <div className="p-4 bg-pink-50 rounded-lg">
                  <label className="text-sm font-semibold text-pink-700 uppercase tracking-wide">Phone</label>
                  <p className="text-lg font-semibold text-gray-800 mt-1 flex items-center">
                    <span className="mr-2">📞</span>
                    {patient.phone}
                  </p>
                </div>
                
                {patient.email && (
                  <div className="p-4 bg-pink-50 rounded-lg">
                    <label className="text-sm font-semibold text-pink-700 uppercase tracking-wide">Email</label>
                    <p className="text-lg font-semibold text-gray-800 mt-1 flex items-center">
                      <span className="mr-2">📧</span>
                      {patient.email}
                    </p>
                  </div>
                )}
                
                <div className="p-4 bg-pink-50 rounded-lg">
                  <label className="text-sm font-semibold text-pink-700 uppercase tracking-wide">Member Since</label>
                  <p className="text-lg font-semibold text-gray-800 mt-1 flex items-center">
                    <span className="mr-2">📅</span>
                    {formatDate(patient.memberSince)}
                  </p>
                </div>
                
                {patient.pregnancyInfo && (
                  <div className="border-t-2 border-pink-200 pt-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                      <span className="bg-purple-100 p-2 rounded-lg mr-3">
                        🤱
                      </span>
                      Pregnancy Information
                    </h3>
                    
                    {patient.pregnancyInfo.month && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                        <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Pregnancy Month</label>
                        <p className="text-lg font-bold text-gray-800 mt-1">{patient.pregnancyInfo.month} months</p>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.expectedDeliveryDate && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                        <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Expected Delivery</label>
                        <p className="text-lg font-bold text-gray-800 mt-1 flex items-center">
                          <span className="mr-2">📅</span>
                          {new Date(patient.pregnancyInfo.expectedDeliveryDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.medications && patient.pregnancyInfo.medications.length > 0 && (
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                        <label className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Medications</label>
                        <ul className="text-gray-800 text-sm mt-2 space-y-1">
                          {patient.pregnancyInfo.medications.map((med, index) => (
                            <li key={index} className="flex items-center">
                              <span className="mr-2 text-purple-500">💊</span>
                              {med}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.highRisk && (
                      <div className="mb-4">
                        <span className="px-4 py-2 text-sm font-bold rounded-full bg-red-500 text-white flex items-center w-fit">
                          <span className="mr-2">⚠️</span>
                          High Risk Pregnancy
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Symptom Logs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="bg-pink-100 p-2 rounded-lg mr-3">
                    📊
                  </span>
                  Recent Symptom Logs
                </span>
                <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {patient.symptomLogs?.length || 0}
                </span>
              </h2>
              
              {!patient.symptomLogs || patient.symptomLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="bg-pink-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-xl font-medium text-gray-600">No symptom logs recorded</p>
                  <p className="text-sm mt-3 text-gray-500">
                    Your loved one hasn't logged any symptoms yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100">
                  {patient.symptomLogs.map((log) => (
                    <div
                      key={log._id}
                      className="border-2 border-pink-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-pink-200 bg-gradient-to-r from-white to-pink-25"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-gray-800 text-lg flex items-center">
                            <span className="bg-pink-100 p-2 rounded-lg mr-3">
                              📝
                            </span>
                            Symptom Log
                          </h3>
                          {log.priority && (
                            <span className={`px-4 py-2 text-xs font-bold rounded-full border-2 ${getPriorityColor(log.priority)} uppercase tracking-wide shadow-sm`}>
                              {log.priority} PRIORITY
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {formatDate(log.loggedAt)}
                        </span>
                      </div>
                      
                      {log.generalCondition && (
                        <div className="mb-4 p-4 bg-pink-50 rounded-lg border-l-4 border-pink-400">
                          <label className="text-sm font-bold text-pink-700 uppercase tracking-wide">General Condition:</label>
                          <p className="text-gray-800 mt-2 text-lg">{log.generalCondition}</p>
                        </div>
                      )}
                      
                      {log.symptoms && log.symptoms.length > 0 && (
                        <div className="mb-4">
                          <label className="text-sm font-bold text-pink-700 uppercase tracking-wide mb-3 block">Symptoms:</label>
                          <div className="space-y-3">
                            {log.symptoms.map((symptom, index) => (
                              <div key={index} className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border-l-4 border-pink-400 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-gray-800 text-lg flex items-center">
                                    <span className="mr-2">🔴</span>
                                    {symptom.name}
                                  </span>
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getSeverityColor(symptom.severity)}`}>
                                    {symptom.severity}
                                  </span>
                                </div>
                                {symptom.duration && (
                                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                                    <span className="font-semibold mr-2">⏱️ Duration:</span> 
                                    <span className="bg-white px-2 py-1 rounded">{symptom.duration}</span>
                                  </p>
                                )}
                                {symptom.description && (
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-pink-200 italic">
                                    "{symptom.description}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {log.additionalNotes && (
                        <div className="mb-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <label className="text-sm font-bold text-yellow-700 uppercase tracking-wide">Additional Notes:</label>
                          <p className="text-gray-800 mt-2 text-lg italic">"{log.additionalNotes}"</p>
                        </div>
                      )}
                      
                      {log.recommendedActions && log.recommendedActions.length > 0 && (
                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <label className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 block">Recommended Actions:</label>
                          <ul className="text-gray-800 space-y-2">
                            {log.recommendedActions.map((action, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="mr-2 text-green-500 font-bold">✓</span>
                                <span className="bg-white px-3 py-1 rounded-lg border border-green-200 flex-1">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-track-pink-100::-webkit-scrollbar-track {
          background: #fce7f3;
          border-radius: 10px;
        }
        .scrollbar-thumb-pink-300::-webkit-scrollbar-thumb {
          background: #f9a8d4;
          border-radius: 10px;
        }
        .scrollbar-thumb-pink-300::-webkit-scrollbar-thumb:hover {
          background: #f472b6;
        }
      `}</style>
    </div>
  );
}
