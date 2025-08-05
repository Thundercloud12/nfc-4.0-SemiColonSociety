import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
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

    // Find all appointments for this ASHA worker
    const appointments = await Appointment.find({ 
      ashaWorker: session.user.id,
      appointmentDate: { $gte: new Date() } // Only future appointments
    })
    .populate('patient', 'name phone email role')
    .sort({ appointmentDate: 1 }); // Sort by date ascending

    return NextResponse.json({ 
      appointments: appointments || [] 
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { patientId, appointmentDate, reason, location, notes } = await request.json();

    // Validate required fields
    if (!patientId || !appointmentDate) {
      return NextResponse.json(
        { error: "Patient and appointment date are required" },
        { status: 400 }
      );
    }

    // Validate appointment date is in the future
    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return NextResponse.json(
        { error: "Appointment date must be in the future" },
        { status: 400 }
      );
    }

    await connectDb();

    // Verify the patient exists and is assigned to this ASHA worker
    const ashaWorker = await User.findById(session.user.id);
    if (!ashaWorker.assignedPatients.includes(patientId)) {
      return NextResponse.json(
        { error: "Patient is not assigned to you" },
        { status: 403 }
      );
    }

    // Check if there's already an appointment at the same time
    const existingAppointment = await Appointment.findOne({
      ashaWorker: session.user.id,
      appointmentDate: appointmentDateTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "You already have an appointment scheduled at this time" },
        { status: 400 }
      );
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

    return NextResponse.json({
      message: "Appointment scheduled successfully",
      appointment: appointment
    });

  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
