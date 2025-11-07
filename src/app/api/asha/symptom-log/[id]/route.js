import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import SymptomLog from "@/models/SymptomLog";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function PUT(request, { params }) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { id: symptomLogId } = params;
    const { recommendedActions } = await request.json();

    if (!symptomLogId) {
      return errorResponse("Symptom log ID is required", 400);
    }

    if (!recommendedActions || !Array.isArray(recommendedActions)) {
      return errorResponse("Recommended actions must be an array", 400);
    }

    // Find the symptom log and populate patient info
    const symptomLog = await SymptomLog.findById(symptomLogId).populate('patient');
    
    if (!symptomLog) {
      return errorResponse("Symptom log not found", 404);
    }

    // Verify the patient is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (!ashaWorker.assignedPatients.includes(symptomLog.patient._id.toString())) {
      return errorResponse("Patient is not assigned to you", 403);
    }

    // Update the symptom log with recommended actions
    symptomLog.recommendedActions = recommendedActions;
    await symptomLog.save();

    return successResponse({
      success: true,
      message: "Recommended actions updated successfully",
      symptomLog: symptomLog
    });

  } catch (error) {
    console.error("Error updating recommended actions:", error);
    return errorResponse("Internal server error", 500);
  }
}
