import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function DELETE(request) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { patientId } = await request.json();

    if (!patientId) {
      return errorResponse("Patient ID is required", 400);
    }

    // Remove patient from ASHA worker's assigned patients
    const result = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { assignedPatients: patientId } },
      { new: true }
    );

    if (!result) {
      return errorResponse("ASHA worker not found", 404);
    }

    return successResponse({
      message: "Patient removed successfully"
    });

  } catch (error) {
    console.error("Error removing patient:", error);
    return errorResponse("Internal server error", 500);
  }
}
