import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: patientId } = params;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Verify the patient is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (!ashaWorker.assignedPatients.includes(patientId)) {
      return NextResponse.json(
        { error: "Patient is not assigned to you" },
        { status: 403 }
      );
    }

    // Find the patient and populate symptom logs
    const patient = await User.findById(patientId)
      .populate({
        path: 'symptomLogs',
        options: { sort: { loggedAt: -1 } } // Sort by most recent first
      })
      .select('-password'); // Exclude password field

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      patient: patient
    });

  } catch (error) {
    console.error("Error fetching patient details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
