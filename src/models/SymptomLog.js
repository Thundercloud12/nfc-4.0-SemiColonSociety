import mongoose, { model, models, Schema } from "mongoose";

const symptomLogSchema = new Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        loggedAt: {
            type: Date,
            default: Date.now,
        },
        symptoms: [{
            name: String,
            severity: String,
            duration: String,
            description: String,
        }],
        generalCondition: String,
        additionalNotes: String,
        recommendedActions: [String],
        priority: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM',
        },
        // Legacy fields (keeping for backward compatibility)
        recordedAt: {
            type: Date,
            default: Date.now,
        },
        transcriptionText: String,
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low',
        },
        sentToAsha: {
            type: Boolean,
            default: false,
        },
        syncStatus: {
            type: String,
            enum: ['pending', 'synced'],
            default: 'pending',
        },
        ashaWorker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

const SymptomLog = models?.SymptomLog || model("SymptomLog", symptomLogSchema);

export default SymptomLog
