// app/api/auth/verify-otp/route.js
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import OTP from "@/models/Otp";
import User from "@/models/User";
export async function POST(request) {
    try {
        const { identifier, otp } = await request.json();

        if (!identifier || !otp) {
            return NextResponse.json({ error: "Identifier and OTP required" }, { status: 400 });
        }

        await connectDb();

        // Find and validate OTP
        const record = await OTP.findOne({ identifier, otp, verified: false });

        if (
            !record ||
            new Date(record.expiresAt) < new Date()
        ) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
        }

        // Mark OTP as used
        record.verified = true;
        await record.save();

        // Find user info for creating session
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Success: return user data to frontend for NextAuth callback
        return NextResponse.json({
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
        return NextResponse.json({ error: "Error verifying OTP" }, { status: 500 });
    }
}
