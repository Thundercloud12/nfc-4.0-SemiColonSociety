"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PatientDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingActions, setEditingActions] = useState({});
  const [newAction, setNewAction] = useState({});

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

    if (patientId) {
      fetchPatientDetails();
    }
  }, [session, status, router, patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`/api/asha/patient/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch patient details");
      }
    } catch (error) {
      setError("Error loading patient details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
        console.warn("[PatientDetails] Unknown priority level:", priority);
    }
    
    console.log("[PatientDetails] Priority color class:", colorClass);
    return colorClass;
  };

  const handleAddAction = async (logId) => {
    const action = newAction[logId]?.trim();
    if (!action) return;

    try {
      const response = await fetch(`/api/asha/symptom-log/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendedActions: [
            ...(patient.symptomLogs.find(log => log._id === logId)?.recommendedActions || []),
            action
          ]
        }),
      });

      if (response.ok) {
        // Refresh patient data to show updated actions
        await fetchPatientDetails();
        setNewAction(prev => ({ ...prev, [logId]: '' }));
        setEditingActions(prev => ({ ...prev, [logId]: false }));
      } else {
        console.error('Failed to add recommended action');
        setError('Failed to add recommended action');
      }
    } catch (error) {
      console.error('Error adding recommended action:', error);
      setError('Error adding recommended action');
    }
  };

  const toggleEditingActions = (logId) => {
    setEditingActions(prev => ({ ...prev, [logId]: !prev[logId] }));
    setNewAction(prev => ({ ...prev, [logId]: '' }));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pink-500">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => router.push("/asha-dashboard")}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-pink-100 border border-pink-300 text-gray-800 px-4 py-3 rounded">
            Patient not found.
          </div>
          <button
            onClick={() => router.push("/asha-dashboard")}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">
                Patient Details
              </h1>
              <p className="text-gray-600 text-lg">
                View comprehensive patient information and symptom logs
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Patient Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Name
                </label>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  {patient.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Phone
                </label>
                <p className="text-lg font-semibold text-gray-800 mt-1">
                  {patient.phone}
                </p>
              </div>
              {patient.email && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Email
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {patient.email}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Role
                </label>
                <span className="inline-block mx-5 px-4 py-2 mt-2 text-sm font-bold rounded-full bg-pink-500 text-white">
                  {patient.role}
                </span>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Unique Code
                </label>
                <p className="text-lg font-bold text-gray-800 mt-1 font-mono bg-pink-50 px-3 py-2 rounded border">
                  {patient.uniqueCode}
                </p>
              </div>

              {patient.pregnancyInfo && (
                <div className="border-t-2 border-pink-200 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4 text-lg">
                    Pregnancy Information
                  </h3>
                  {patient.pregnancyInfo.month && (
                    <p className="text-lg">
                      Month:{" "}
                      <span className="font-semibold">
                        {patient.pregnancyInfo.month} months
                      </span>
                    </p>
                  )}
                  {patient.pregnancyInfo.expectedDeliveryDate && (
                    <p className="text-lg mt-2">
                      Expected Delivery:{" "}
                      <span className="font-semibold">
                        {new Date(
                          patient.pregnancyInfo.expectedDeliveryDate
                        ).toLocaleDateString("en-IN")}
                      </span>
                    </p>
                  )}
                  {patient.pregnancyInfo.medications?.length > 0 && (
                    <ul className="list-disc pl-6 mt-2 text-gray-800">
                      {patient.pregnancyInfo.medications.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  )}
                  {patient.pregnancyInfo.highRisk && (
                    <span className="px-4 py-2 text-sm font-bold rounded-full bg-red-500 text-white mt-3 inline-block">
                      High Risk Pregnancy
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Symptom Logs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-pink-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="bg-pink-100 p-2 rounded-lg mr-3">
                    📊
                  </span>
                  Symptom Logs
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
                    Patient hasn't logged any symptoms yet. Encourage them to use the symptom logger.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar pr-2">
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
                              <div key={index} className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border-l-4 border-pink-400 shadow-sm">
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
                        <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <label className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3 block">Recommended Actions:</label>
                          <ul className="text-gray-800 space-y-2 mb-3">
                            {log.recommendedActions.map((action, index) => (
                              <li key={index} className="text-sm flex items-start">
                                <span className="mr-2 text-green-500 font-bold">✓</span>
                                <span className="bg-white px-3 py-1 rounded-lg border border-green-200 flex-1">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Add Recommended Actions Section */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-bold text-blue-700 uppercase tracking-wide">Add Recommended Action:</label>
                          <button
                            onClick={() => toggleEditingActions(log._id)}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${
                              editingActions[log._id] 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {editingActions[log._id] ? 'Cancel' : '+ Add Action'}
                          </button>
                        </div>
                        
                        {editingActions[log._id] && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAction[log._id] || ''}
                              onChange={(e) => setNewAction(prev => ({ ...prev, [log._id]: e.target.value }))}
                              placeholder="Enter recommended action..."
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddAction(log._id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddAction(log._id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        )}
                        
                        {!editingActions[log._id] && (!log.recommendedActions || log.recommendedActions.length === 0) && (
                          <p className="text-sm text-gray-600 italic">No recommended actions added yet. Click "Add Action" to provide guidance.</p>
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
