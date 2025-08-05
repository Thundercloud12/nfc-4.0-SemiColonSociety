import { NextAuthOptions } from "next-auth";
import  CredentialsProvider  from "next-auth/providers/credentials";
import { connectDb } from "./dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions= {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                identifier: { label: "Email or Phone", type: "text" },
                password: { label: "Password", type: "password" },
                type: { label: "Type", type: "text" }
            },
            async authorize(credentials) {
                const { identifier, password, type } = credentials;

                await connectDb();

                if (type === 'family_login') {
                    // Family login with unique code and password
                    if (!identifier || !password) {
                        throw new Error("Missing unique code or password");
                    }

                    // Find the pregnant patient with this unique code
                    const patient = await User.findOne({ 
                        uniqueCode: identifier,
                        role: "pregnant"
                    });

                    if (!patient) {
                        throw new Error("Invalid unique code. Patient not found.");
                    }

                    // Find or create family member account
                    let familyMember = await User.findOne({
                        linkedPatientId: patient._id,
                        role: "family"
                    });

                    if (familyMember) {
                        // Verify password for existing family member
                        const isPasswordValid = await bcrypt.compare(password, familyMember.password);
                        
                        if (!isPasswordValid) {
                            throw new Error("Invalid password");
                        }
                    } else {
                        // Create new family member account
                        const hashedPassword = await bcrypt.hash(password, 12);
                        
                        familyMember = new User({
                            name: `Family of ${patient.name}`,
                            phone: `family_${patient.phone}`,
                            email: `family_${patient.email || patient.phone}@family.local`,
                            password: hashedPassword,
                            role: "family",
                            linkedPatientId: patient._id,
                            uniqueCode: identifier,
                            isVerified: true
                        });

                        await familyMember.save();
                    }

                    return {
                        id: familyMember._id.toString(),
                        name: familyMember.name,
                        email: familyMember.email,
                        role: "family",
                        linkedPatientId: patient._id.toString(),
                        patientName: patient.name,
                    };
                } else {
                    // Regular OTP login (existing logic)
                    if (!identifier) {
                        throw new Error("Missing identifier");
                    }

                    const user = await User.findOne({
                        $or: [{ email: identifier }, { phone: identifier }]
                    });

                    if (!user) {
                        throw new Error("User not found");
                    }

                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                }
            }
        }),
    ],
    callbacks: {
        async jwt({token, user}) {
            if(user) {
                token.id = user.id;
                token.name = user.name;
                token.role = user.role;
                token.linkedPatientId = user.linkedPatientId;
                token.patientName = user.patientName;
            }

            return token
        },
        async session({session, token}){
            
            if(session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.role = token.role;
                session.user.linkedPatientId = token.linkedPatientId;
                session.user.patientName = token.patientName;
            }
            
            
            return session
        },
        async redirect({ url, baseUrl, token }) {
            // Handle redirects based on user role
            if (token?.role === "family") {
                return `${baseUrl}/family-dashboard`;
            } else if (token?.role === "pregnant") {
                return `${baseUrl}/patient-dashboard`;
            } else if (token?.role === "asha") {
                return `${baseUrl}/asha-dashboard`;
            }
            
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 *60 *60
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login"
    }
}