import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import SymptomLog from "@/models/SymptomLog";
import Appointment from "@/models/Appointment";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";
import { getFamilyMemberWithPatient, getLinkedPatient } from "@/lib/familyUtils";

export async function GET() {
    try {
        const { session, error } = await initApiRoute(['family']);
        if (error) return error;

        // Get the family member's details
        const { familyMember, error: familyError } = await getFamilyMemberWithPatient(session.user.id);
        if (familyError) return familyError;

        // Get the linked pregnant woman's details
        const { patient, error: patientError } = await getLinkedPatient(familyMember.familyOf);
        if (patientError) return patientError;

        console.log(patient);
        
        // Get recent symptom logs for this patient
        const symptomLogs = await SymptomLog.find({ patient: patient._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

            console.log(symptomLogs);
            

        // Get recent appointments for this patient  
        const appointments = await Appointment.find({ patient: patient._id })
            .sort({ date: -1 })
            .limit(5)
            .lean();

            console.log(appointments);
            
        // Prepare patient info with additional data
        const patientInfo = {
            _id: patient._id,
            name: patient.name,
            phone: patient.phone,
            email: patient.email,
            pregnancyInfo: patient.pregnancyInfo,
            location: patient.location,
            memberSince: patient.createdAt,
            symptomLogs: symptomLogs,
            appointments: appointments,
            uniqueCode: patient.uniqueCode
        };

        return successResponse({
            success: true,
            patient: patientInfo
        });

    } catch (error) {
        console.error("Error fetching patient details:", error);
        return errorResponse("Internal server error", 500);
    }
}
