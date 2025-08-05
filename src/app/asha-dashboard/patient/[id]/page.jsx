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

  useEffect(() => {
    console.log("[PatientDetails] useEffect triggered with:", {
      status,
      sessionExists: !!session,
      userRole: session?.user?.role,
      patientId
    });
    
    if (status === "loading") {
      console.log("[PatientDetails] Session is still loading, waiting...");
      return;
    }
    
    if (!session) {
      console.log("[PatientDetails] No session found, redirecting to login");
      router.push("/login");
      return;
    }
    
    if (session.user.role !== "asha") {
      console.log("[PatientDetails] User is not ASHA worker, role:", session.user.role, "redirecting to home");
      router.push("/");
      return;
    }
    
    if (patientId) {
      console.log("[PatientDetails] Valid session and patientId found, fetching patient details for ID:", patientId);
      fetchPatientDetails();
    } else {
      console.warn("[PatientDetails] No patientId provided in URL params");
    }
  }, [session, status, router, patientId]);

  const fetchPatientDetails = async () => {
    console.log("[PatientDetails] Starting fetchPatientDetails for patientId:", patientId);
    console.log("[PatientDetails] Making API call to:", `/api/asha/patient/${patientId}`);
    
    try {
      const response = await fetch(`/api/asha/patient/${patientId}`);
      
      console.log("[PatientDetails] API response status:", response.status);
      console.log("[PatientDetails] API response ok:", response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log("[PatientDetails] Successfully fetched patient data:", {
          patientName: data.patient?.name,
          patientRole: data.patient?.role,
          symptomLogsCount: data.patient?.symptomLogs?.length || 0,
          hasPregnancyInfo: !!data.patient?.pregnancyInfo
        });
        console.log("[PatientDetails] Full patient data structure:", data);
        
        setPatient(data.patient);
        console.log("[PatientDetails] Patient state updated successfully");
      } else {
        const errorData = await response.json();
        console.error("[PatientDetails] API request failed with status:", response.status);
        console.error("[PatientDetails] Error response data:", errorData);
        
        const errorMessage = errorData.error || "Failed to fetch patient details";
        setError(errorMessage);
        console.log("[PatientDetails] Error state set to:", errorMessage);
      }
    } catch (error) {
      console.error("[PatientDetails] Network or parsing error occurred:", error);
      console.error("[PatientDetails] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = "Error loading patient details";
      setError(errorMessage);
      console.log("[PatientDetails] Error state set to:", errorMessage);
    } finally {
      setLoading(false);
      console.log("[PatientDetails] Loading state set to false");
    }
  };

  const formatDate = (dateString) => {
    console.log("[PatientDetails] Formatting date:", dateString);
    try {
      const formattedDate = new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log("[PatientDetails] Date formatted successfully:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("[PatientDetails] Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const getSeverityColor = (severity) => {
    console.log("[PatientDetails] Getting severity color for:", severity);
    const severityLower = severity?.toLowerCase();
    let colorClass;
    
    switch (severityLower) {
      case "mild":
        colorClass = "bg-green-100 text-green-700";
        break;
      case "moderate":
        colorClass = "bg-yellow-100 text-yellow-700";
        break;
      case "severe":
        colorClass = "bg-red-100 text-red-700";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-700";
        console.warn("[PatientDetails] Unknown severity level:", severity);
    }
    
    console.log("[PatientDetails] Severity color class:", colorClass);
    return colorClass;
  };

  const getPriorityColor = (priority) => {
    console.log("[PatientDetails] Getting priority color for:", priority);
    const priorityUpper = priority?.toUpperCase();
    let colorClass;
    
    switch (priorityUpper) {
      case "LOW":
        colorClass = "bg-green-100 text-green-800 border-green-200";
        break;
      case "MEDIUM":
        colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
        break;
      case "HIGH":
        colorClass = "bg-red-100 text-red-800 border-red-200";
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800 border-gray-200";
        console.warn("[PatientDetails] Unknown priority level:", priority);
    }
    
    console.log("[PatientDetails] Priority color class:", colorClass);
    return colorClass;
  };

  if (status === "loading" || loading) {
    console.log("[PatientDetails] Rendering loading state - status:", status, "loading:", loading);
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    console.log("[PatientDetails] Rendering null - no session");
    return null;
  }

  if (error) {
    console.log("[PatientDetails] Rendering error state:", error);
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => {
              console.log("[PatientDetails] Back button clicked, navigating to dashboard");
              router.push("/asha-dashboard");
            }}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    console.log("[PatientDetails] Rendering patient not found state");
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded">
            Patient not found.
          </div>
          <button
            onClick={() => {
              console.log("[PatientDetails] Back button clicked from not found state, navigating to dashboard");
              router.push("/asha-dashboard");
            }}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  console.log("[PatientDetails] Rendering main patient details view for:", patient.name);
  console.log("[PatientDetails] Patient symptom logs count:", patient.symptomLogs?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Patient Details
              </h1>
              <p className="text-gray-600">View patient information and symptom logs</p>
            </div>
            <button
              onClick={() => {
                console.log("[PatientDetails] Back to Dashboard button clicked");
                router.push("/asha-dashboard");
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Patient Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold text-gray-800">{patient.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-800">{patient.phone}</p>
                </div>
                
                {patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-800">{patient.email}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-700 ml-2">
                    {patient.role}
                  </span>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Unique Code</label>
                  <p className="text-gray-800 font-mono">{patient.uniqueCode}</p>
                </div>
                
                {patient.pregnancyInfo && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-800 mb-2">Pregnancy Information</h3>
                    
                    {patient.pregnancyInfo.month && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500">Month</label>
                        <p className="text-gray-800">{patient.pregnancyInfo.month}</p>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.expectedDeliveryDate && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500">Expected Delivery</label>
                        <p className="text-gray-800">
                          {new Date(patient.pregnancyInfo.expectedDeliveryDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.medications && patient.pregnancyInfo.medications.length > 0 && (
                      <div className="mb-2">
                        <label className="text-sm font-medium text-gray-500">Medications</label>
                        <ul className="text-gray-800 text-sm">
                          {patient.pregnancyInfo.medications.map((med, index) => (
                            <li key={index}>• {med}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {patient.pregnancyInfo.highRisk && (
                      <div className="mb-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Symptom Logs ({patient.symptomLogs?.length || 0})
              </h2>
              
              {!patient.symptomLogs || patient.symptomLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">No symptom logs recorded</p>
                  <p className="text-sm mt-2">
                    Patient hasn't logged any symptoms yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {patient.symptomLogs.map((log) => (
                    <div
                      key={log._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-800">
                            Symptom Log
                          </h3>
                          {log.priority && (
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(log.priority)}`}>
                              {log.priority} PRIORITY
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.loggedAt)}
                        </span>
                      </div>
                      
                      {log.generalCondition && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-gray-600">General Condition:</label>
                          <p className="text-gray-800 mt-1">{log.generalCondition}</p>
                        </div>
                      )}
                      
                      {log.symptoms && log.symptoms.length > 0 && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-gray-600">Symptoms:</label>
                          <div className="mt-2 space-y-2">
                            {log.symptoms.map((symptom, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-800">{symptom.name}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(symptom.severity)}`}>
                                    {symptom.severity}
                                  </span>
                                </div>
                                {symptom.duration && (
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Duration:</span> {symptom.duration}
                                  </p>
                                )}
                                {symptom.description && (
                                  <p className="text-sm text-gray-700">{symptom.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {log.additionalNotes && (
                        <div className="mb-3">
                          <label className="text-sm font-medium text-gray-600">Additional Notes:</label>
                          <p className="text-gray-800 mt-1">{log.additionalNotes}</p>
                        </div>
                      )}
                      
                      {log.recommendedActions && log.recommendedActions.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Recommended Actions:</label>
                          <ul className="text-gray-800 mt-1">
                            {log.recommendedActions.map((action, index) => (
                              <li key={index} className="text-sm">• {action}</li>
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
    </div>
  );
}
