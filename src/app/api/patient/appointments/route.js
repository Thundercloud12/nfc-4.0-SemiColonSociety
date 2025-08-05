import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a patient (pregnant woman)
    if (session.user.role !== "pregnant") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDb();

    const currentDate = new Date();

    // Find upcoming appointments (future appointments)
    const upcomingAppointments = await Appointment.find({
      patient: session.user.id,
      appointmentDate: { $gte: currentDate },
      status: { $ne: 'cancelled' }
    })
    .populate('ashaWorker', 'name phone email')
    .sort({ appointmentDate: 1 }); // Sort by date ascending
    
    
    // Find missed appointments (past appointments that were scheduled but not completed)
    const missedAppointments = await Appointment.find({
      patient: session.user.id,
      appointmentDate: { $lt: currentDate },
      status: 'scheduled' // Only scheduled appointments that are now past due
    })
    .populate('ashaWorker', 'name phone email')
    .sort({ appointmentDate: -1 }); // Sort by date descending (most recent first)

    return NextResponse.json({
      upcomingAppointments: upcomingAppointments || [],
      missedAppointments: missedAppointments || []
    });

  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
