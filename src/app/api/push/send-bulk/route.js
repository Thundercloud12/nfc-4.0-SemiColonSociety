import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import Appointment from "@/models/Appointment";
import { sendBulkPushNotifications } from "@/lib/pushNotifications";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function POST(request) {
  try {
    const { session, error } = await initApiRoute(['asha']);
    if (error) return error;

    const { notificationType, customMessage } = await request.json();
    
    // Get ASHA worker's assigned patients
    const ashaWorker = await User.findById(session.user.id)
      .populate({
        path: 'assignedPatients',
        select: 'name phone pushSubscriptions'
      });

    if (!ashaWorker || !ashaWorker.assignedPatients?.length) {
      return errorResponse("No patients assigned", 404);
    }

    // Collect all push subscriptions from patients
    const allSubscriptions = [];
    ashaWorker.assignedPatients.forEach(patient => {
      if (patient.pushSubscriptions && patient.pushSubscriptions.length > 0) {
        allSubscriptions.push(...patient.pushSubscriptions);
      }
    });

    if (allSubscriptions.length === 0) {
      return errorResponse("No patients have enabled push notifications", 404);
    }

    let payload;

    if (notificationType === 'appointment_reminder') {
      // Get upcoming appointments for these patients
      const patientIds = ashaWorker.assignedPatients.map(p => p._id);
      const upcomingAppointments = await Appointment.find({
        patient: { $in: patientIds },
        ashaWorker: session.user.id,
        appointmentDate: { 
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        },
        status: 'scheduled'
      }).populate('patient', 'name');

      payload = {
        title: '📅 Appointment Reminder',
        body: upcomingAppointments.length > 0 
          ? `You have ${upcomingAppointments.length} upcoming appointment(s) this week`
          : 'Please check your appointments and schedule if needed',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { 
          type: 'appointment',
          url: '/patient-dashboard',
          timestamp: Date.now()
        }
      };
    } else if (notificationType === 'health_checkup') {
      payload = {
        title: '🩺 Health Check-up Reminder',
        body: 'Time for your regular health check-up. Please log your symptoms and schedule an appointment if needed.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { 
          type: 'health_checkup',
          url: '/patient-dashboard/symptom-logger',
          timestamp: Date.now()
        }
      };
    } else if (notificationType === 'custom' && customMessage) {
      payload = {
        title: '📢 Message from your ASHA Worker',
        body: customMessage,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { 
          type: 'custom',
          url: '/patient-dashboard',
          timestamp: Date.now()
        }
      };
    } else {
      return errorResponse("Invalid notification type", 400);
    }

    // Send bulk notifications
    const results = await sendBulkPushNotifications(allSubscriptions, payload);

    console.log(`Bulk notifications sent by ASHA ${session.user.id}:`, results);

    return successResponse({ 
      success: true, 
      message: `Notifications sent successfully`,
      stats: {
        totalPatients: ashaWorker.assignedPatients.length,
        devicesNotified: results.successful,
        failedNotifications: results.failed,
        totalSubscriptions: results.total
      }
    });

  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return errorResponse(error.message, 500);
  }
}
