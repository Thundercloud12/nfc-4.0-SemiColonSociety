import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import SymptomLog from "@/models/SymptomLog";
import Appointment from "@/models/Appointment";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user.role !== "family") {
            return NextResponse.json(
                { error: "Unauthorized - Family access required" },
                { status: 401 }
            );
        }

        await connectDb();

        // Get the family member's details to find linked patient
        const familyMember = await User.findById(session.user.id);
        
        if (!familyMember) {
            return NextResponse.json(
                { error: "No linked patient found" },
                { status: 404 }
            );
        }

        // Get the patient details with populated data
        const patient = await User.findById(familyMember.linkedPatientId)
            .populate({
                path: 'symptomLogs',
                options: { sort: { createdAt: -1 }, limit: 10 } // Get latest 10 symptom logs
            })
            .populate({
                path: 'appointments',
                options: { sort: { date: -1 }, limit: 5 } // Get latest 5 appointments
            })
            .lean();

        if (!patient) {
            return NextResponse.json(
                { error: "Patient not found" },
                { status: 404 }
            );
        }

        // Remove sensitive information
        const patientInfo = {
            _id: patient._id,
            name: patient.name,
            phone: patient.phone,
            pregnancyInfo: patient.pregnancyInfo,
            location: patient.location,
            createdAt: patient.createdAt,
            symptomLogs: patient.symptomLogs || [],
            appointments: patient.appointments || []
        };

        return NextResponse.json({
            success: true,
            patient: patientInfo
        });

    } catch (error) {
        console.error("Error fetching patient details:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
