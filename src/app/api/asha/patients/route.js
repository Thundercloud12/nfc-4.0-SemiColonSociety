import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDb();

    // Find the ASHA worker and populate their assigned patients
    const ashaWorker = await User.findById(session.user.id)
      .populate('assignedPatients', 'name phone email role uniqueCode pregnancyInfo')
      .select('assignedPatients');

    if (!ashaWorker) {
      return NextResponse.json({ error: "ASHA worker not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      patients: ashaWorker.assignedPatients || [] 
    });

  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
