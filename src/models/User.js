import mongoose, { model, models, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
    {
        role: {
            type: String,
            enum: ['pregnant', 'family', 'asha'],
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: false,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        pregnancyInfo: {
            month: { type: Number, min: 1, max: 9 },
            medications: [String],
            expectedDeliveryDate: { type: Date },
            highRisk: { type: Boolean, default: false },
        },
        familyOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedPatients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        languagePreference: {
            type: String,
            default: 'en', 
        },
        symptomLogs: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "SymptomLog" 
        }],
        appointments: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Appointment" 
        }],
        uniqueCode: {
            type:String,
            required:true
        },
        location: {
            coordinates: {
                latitude: {
                    type: Number,
                    required: false
                },
                longitude: {
                    type: Number,
                    required: false
                }
            },
            address: {
                type: String,
                required: false
            },
            city: {
                type: String,
                required: false
            },
            state: {
                type: String,
                required: false
            },
            country: {
                type: String,
                required: false
            },
            postalCode: {
                type: String,
                required: false
            }
        },
        pushSubscriptions: [{
            endpoint: String,
            keys: {
                p256dh: String,
                auth: String
            },
            deviceInfo: {
                userAgent: String,
                timestamp: { type: Date, default: Date.now }
            }
        }]
    },
    { timestamps: true }
);

userSchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

export const User = models?.User || model("User", userSchema);

export default User
