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

        // Get the family member's details
        const familyMember = await User.findById(session.user.id);
        
        if (!familyMember || !familyMember.familyOf) {
            return NextResponse.json(
                { error: "No linked patient found for this family member" },
                { status: 404 }
            );
        }

        // Get the linked pregnant woman's details
        const patient = await User.findById(familyMember.familyOf)
            .select('-password') // Exclude password
            .lean();



        if (!patient) {
            return NextResponse.json(
                { error: "Linked patient not found" },
                { status: 404 }
            );
        }
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
