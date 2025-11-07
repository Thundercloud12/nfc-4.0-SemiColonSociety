import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function GET() {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    // Find all appointments for this ASHA worker
    const appointments = await Appointment.find({ 
      ashaWorker: session.user.id,
      appointmentDate: { $gte: new Date() } // Only future appointments
    })
    .populate('patient', 'name phone email role')
    .sort({ appointmentDate: 1 }); // Sort by date ascending

    return successResponse({ 
      appointments: appointments || [] 
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { patientId, appointmentDate, reason, location, notes } = await request.json();

    // Validate required fields
    if (!patientId || !appointmentDate) {
      return errorResponse("Patient and appointment date are required", 400);
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return errorResponse("Appointment date must be in the future", 400);
    }

    // Verify the patient exists and is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    if (!ashaWorker.assignedPatients.includes(patientId)) {
      return errorResponse("Patient is not assigned to you", 403);
    }

    // Check if there's already an appointment at the same time
    const existingAppointment = await Appointment.findOne({
      ashaWorker: session.user.id,
      appointmentDate: appointmentDateTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return errorResponse("You already have an appointment scheduled at this time", 400);
    }

    // Create new appointment
    const appointment = new Appointment({
      patient: patientId,
      ashaWorker: session.user.id,
      appointmentDate: appointmentDateTime,
      reason: reason || "Regular checkup",
      location: location || "PHC/Home visit",
      notes: notes || "",
      status: "scheduled"
    });

    await appointment.save();

    // Populate patient details for response
    await appointment.populate('patient', 'name phone email role');

    return successResponse({
      message: "Appointment scheduled successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return errorResponse("Internal server error", 500);
  }
}
