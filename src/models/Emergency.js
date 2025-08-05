import mongoose, { model, models, Schema } from "mongoose";

const emergencySchema = new Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patientName: {
            type: String,
            required: true,
        },
        ashaWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ashaWorkerName: {
            type: String,
            required: true,
        },
        location: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
        },
        address: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ['sent', 'acknowledged', 'resolved'],
            default: 'sent',
        },
    },
    {
        timestamps: true,
    }
);

const Emergency = models.Emergency || model("Emergency", emergencySchema);

export default Emergency;
