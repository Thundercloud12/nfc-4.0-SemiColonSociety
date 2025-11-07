import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import SymptomLog from "@/models/SymptomLog";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function GET(request, { params }) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { id: patientId } = params;

    if (!patientId) {
      return errorResponse("Patient ID is required", 400);
    }

    // Verify the patient is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (!ashaWorker.assignedPatients.includes(patientId)) {
      return errorResponse("Patient is not assigned to you", 403);
    }

    // Find the patient and populate symptom logs
    const patient = await User.findById(patientId)
      .populate({
        path: 'symptomLogs',
        options: { sort: { loggedAt: -1 } } // Sort by most recent first
      })
      .select('-password'); // Exclude password field

    if (!patient) {
      return errorResponse("Patient not found", 404);
    }

    return successResponse({
      patient: patient
    });

  } catch (error) {
    console.error("Error fetching patient details:", error);
    return errorResponse("Internal server error", 500);
  }
}
