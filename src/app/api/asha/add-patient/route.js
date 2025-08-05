import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ASHA worker
    if (session.user.role !== "asha") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { patientCode } = await request.json();

    if (!patientCode) {
      return NextResponse.json(
        { error: "Patient code is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the patient by unique code
    const patient = await User.findOne({ 
      uniqueCode: patientCode,
      role: { $in: ['pregnant', 'family'] } // Only pregnant women or family members can be patients
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found with this code" },
        { status: 404 }
      );
    }

    // Check if patient is already assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (ashaWorker.assignedPatients.includes(patient._id)) {
      return NextResponse.json(
        { error: "Patient is already assigned to you" },
        { status: 400 }
      );
    }

    // Add patient to ASHA worker's assigned patients
    await User.findByIdAndUpdate(
      session.user.id,
      { $push: { assignedPatients: patient._id } }
    );

    return NextResponse.json({
      message: "Patient added successfully",
      patient: {
        _id: patient._id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        role: patient.role,
        uniqueCode: patient.uniqueCode
      }
    });

  } catch (error) {
    console.error("Error adding patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
