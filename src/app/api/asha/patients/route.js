import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function GET() {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    // Find the ASHA worker and populate their assigned patients
    const ashaWorker = await User.findById(session.user.id)
      .populate('assignedPatients', 'name phone email role uniqueCode pregnancyInfo')
      .select('assignedPatients');

    if (!ashaWorker) {
      return errorResponse("ASHA worker not found", 404);
    }

    return successResponse({ 
      patients: ashaWorker.assignedPatients || [] 
    });

  } catch (error) {
    console.error("Error fetching patients:", error);
    return errorResponse("Internal server error", 500);
  }
}
