import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import SymptomLog from "@/models/SymptomLog";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function GET(request) {
  try {
    const { session, error } = await initApiRoute(['pregnant']);
    if (error) return error;

    // Find all symptom logs for this patient
    const symptomLogs = await SymptomLog.find({ patient: session.user.id })
      .sort({ loggedAt: -1 }) // Sort by most recent first
      .populate('ashaWorker', 'name phone')
      .lean();

    return successResponse({
      success: true,
      symptomLogs: symptomLogs
    });

  } catch (error) {
    console.error("Error fetching patient symptom logs:", error);
    return errorResponse("Internal server error", 500);
  }
}
