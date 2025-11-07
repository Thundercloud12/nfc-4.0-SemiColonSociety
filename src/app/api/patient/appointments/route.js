import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function GET() {
  try {
    const { session, error } = await initApiRoute(['pregnant']);
    if (error) return error;

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

    return successResponse({
      upcomingAppointments: upcomingAppointments || [],
      missedAppointments: missedAppointments || []
    });

  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return errorResponse("Internal server error", 500);
  }
}
