import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import SymptomLog from "@/models/SymptomLog";
import User from "@/models/User";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: symptomLogId } = params;
    const { recommendedActions } = await request.json();

    if (!symptomLogId) {
      return NextResponse.json(
        { error: "Symptom log ID is required" },
        { status: 400 }
      );
    }

    if (!recommendedActions || !Array.isArray(recommendedActions)) {
      return NextResponse.json(
        { error: "Recommended actions must be an array" },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the symptom log and populate patient info
    const symptomLog = await SymptomLog.findById(symptomLogId).populate('patient');
    
    if (!symptomLog) {
      return NextResponse.json(
        { error: "Symptom log not found" },
        { status: 404 }
      );
    }

    // Verify the patient is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (!ashaWorker.assignedPatients.includes(symptomLog.patient._id.toString())) {
      return NextResponse.json(
        { error: "Patient is not assigned to you" },
        { status: 403 }
      );
    }

    // Update the symptom log with recommended actions
    symptomLog.recommendedActions = recommendedActions;
    await symptomLog.save();

    return NextResponse.json({
      success: true,
      message: "Recommended actions updated successfully",
      symptomLog: symptomLog
    });

  } catch (error) {
    console.error("Error updating recommended actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
