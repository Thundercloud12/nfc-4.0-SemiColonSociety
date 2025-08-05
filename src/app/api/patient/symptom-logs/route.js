import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import SymptomLog from "@/models/SymptomLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a patient
    if (session.user.role !== "pregnant") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDb();

    // Find all symptom logs for this patient
    const symptomLogs = await SymptomLog.find({ patient: session.user.id })
      .sort({ loggedAt: -1 }) // Sort by most recent first
      .populate('ashaWorker', 'name phone')
      .lean();

    return NextResponse.json({
      success: true,
      symptomLogs: symptomLogs
    });

  } catch (error) {
    console.error("Error fetching patient symptom logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
