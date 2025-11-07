// app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import OTP from "@/models/Otp";
import { sendOTPEmail } from "@/lib/nodemailer";
import { generateOTP, errorResponse, successResponse } from "@/lib/apiUtils";

export async function POST(request) {
    try {
        const { identifier } = await request.json(); // email or phone

        if (!identifier) {
            return errorResponse("Email or phone is required", 400);
        }

        await connectDb()

        // Check if user exists
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if (!user) {
            return errorResponse("No user found with this email/phone", 404);
        }

        // Generate 6-digit OTP
        const otp = generateOTP();

        // Delete any existing OTPs for this identifier
        await OTP.deleteMany({ identifier });

        // Save new OTP
        await OTP.create({
            identifier,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send OTP via email (for now)
        const emailResult = await sendOTPEmail(identifier, otp);

        if (!emailResult.success) {
            return errorResponse("Failed to send OTP", 500);
        }

        return successResponse({ message: "OTP sent successfully" });

    } catch (error) {
        console.error('Send OTP error:', error);
        return errorResponse("Error occurred while sending OTP", 500);
    }
}
