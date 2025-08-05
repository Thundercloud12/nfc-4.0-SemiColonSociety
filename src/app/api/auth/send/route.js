// app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import OTP from "@/models/Otp";
import { sendOTPEmail } from "@/lib/nodemailer";
import crypto from "crypto";

export async function POST(request) {
    try {
        const { identifier } = await request.json(); // email or phone

        if (!identifier) {
            return NextResponse.json({
                error: "Email or phone is required"
            }, { status: 400 });
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
            return NextResponse.json({
                error: "No user found with this email/phone"
            }, { status: 404 });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

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
            return NextResponse.json({
                error: "Failed to send OTP"
            }, { status: 500 });
        }

        return NextResponse.json({
            message: "OTP sent successfully"
        }, { status: 200 });

    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json({
            error: "Error occurred while sending OTP"
        }, { status: 500 });
    }
}
