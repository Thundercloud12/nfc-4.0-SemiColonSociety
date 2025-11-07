import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function POST(request) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { patientCode } = await request.json();

    if (!patientCode) {
      return errorResponse("Patient code is required", 400);
    }

    // Find the patient by unique code
    const patient = await User.findOne({ 
      uniqueCode: patientCode,
      role: { $in: ['pregnant', 'family'] } // Only pregnant women or family members can be patients
    });

    if (!patient) {
      return errorResponse("Patient not found with this code", 404);
    }

    // Check if patient is already assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    
    if (ashaWorker.assignedPatients.includes(patient._id)) {
      return errorResponse("Patient is already assigned to you", 400);
    }

    // Add patient to ASHA worker's assigned patients
    await User.findByIdAndUpdate(
      session.user.id,
      { $push: { assignedPatients: patient._id } }
    );

    return successResponse({
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
    return errorResponse("Internal server error", 500);
  }
}
