import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import Appointment from "@/models/Appointment";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";
import { getFamilyMemberWithPatient } from "@/lib/familyUtils";

export async function GET() {
    try {
        const { session, error } = await initApiRoute(['family']);
        if (error) return error;

        // Get the family member's details
        const { familyMember, error: familyError } = await getFamilyMemberWithPatient(session.user.id);
        if (familyError) return familyError;

        // Get appointments for the linked patient
        const appointments = await Appointment.find({ 
            patientId: familyMember.familyOf 
        })
        .sort({ date: -1 })
        .populate('patientId', 'name phone')
        .populate('ashaId', 'name phone')
        .lean();

        return successResponse({
            success: true,
            appointments: appointments
        });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return errorResponse("Internal server error", 500);
    }
}
