// app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import OTP from "@/models/Otp";
import User from "@/models/User";
import { errorResponse, successResponse } from "@/lib/apiUtils";

export async function POST(request) {
    try {
        const { identifier, otp } = await request.json();

        if (!identifier || !otp) {
            return errorResponse("Identifier and OTP required", 400);
        }

        await connectDb();

        // Find and validate OTP
        const record = await OTP.findOne({ identifier, otp, verified: false });

        if (
            !record ||
            new Date(record.expiresAt) < new Date()
        ) {
            return errorResponse("Invalid or expired OTP", 401);
        }

        // Mark OTP as used
        record.verified = true;
        await record.save();

        // Find user info for creating session
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        // Success: return user data to frontend for NextAuth callback
        return successResponse({
            message: "OTP valid",
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                role: user.role,
            }
        });
    } catch (error) {
        console.error(error);
        return errorResponse("Error verifying OTP", 500);
    }
}
