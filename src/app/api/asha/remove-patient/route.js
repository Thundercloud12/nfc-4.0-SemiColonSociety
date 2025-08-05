import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Remove patient from ASHA worker's assigned patients
    const result = await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { assignedPatients: patientId } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "ASHA worker not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Patient removed successfully"
    });

  } catch (error) {
    console.error("Error removing patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
