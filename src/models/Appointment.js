import mongoose, { model, models, Schema } from "mongoose";

const appointmentSchema = new Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ashaWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            default: "Regular checkup",
        },
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
            default: 'scheduled',
        },
        notes: {
            type: String,           
        },
        location: {
            type: String,           
            default: "PHC/Home visit",
        },
        syncStatus: {
            type: String,
            enum: ['pending', 'synced'],
            default: 'pending',     
        },
        reminderSent: {
            type: Boolean,
            default: false,         
        },
    },
    { timestamps: true }
);

const Appointment = models?.Appointment || model("Appointment", appointmentSchema);

export default Appointment