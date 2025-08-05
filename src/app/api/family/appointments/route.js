import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
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

        // Get appointments for the linked patient
        const appointments = await Appointment.find({ 
            patientId: familyMember.familyOf 
        })
        .sort({ date: -1 })
        .populate('patientId', 'name phone')
        .populate('ashaId', 'name phone')
        .lean();

        return NextResponse.json({
            success: true,
            appointments: appointments
        });

    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
