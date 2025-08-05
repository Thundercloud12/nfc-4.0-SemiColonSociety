// models/OTP.js
import mongoose, { model, models, Schema } from "mongoose";

const otpSchema = new Schema({
    identifier: {
        type: String, // email or phone
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: Date.now,
        expires: 600, // 10 minutes
    },
    verified: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const OTP = models?.OTP || model("OTP", otpSchema);
export default OTP
