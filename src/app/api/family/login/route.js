import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        const { uniqueCode, password } = await request.json();

        if (!uniqueCode || !password) {
            return NextResponse.json(
                { error: "Unique code and password are required" },
                { status: 400 }
            );
        }

        await connectDb();

        // First, find the pregnant woman by unique code
        const pregnantWoman = await User.findOne({ 
            uniqueCode: uniqueCode.toUpperCase(),
            role: 'pregnant' 
        });

        if (!pregnantWoman) {
            return NextResponse.json(
                { error: "Invalid unique code. No pregnant woman found with this code." },
                { status: 404 }
            );
        }

        // Check if family member already exists for this pregnant woman
        let familyMember = await User.findOne({ 
            familyOf: pregnantWoman._id,
            role: 'family' 
        });

        if (!familyMember) {
            // Create new family member account
            const hashedPassword = await bcrypt.hash(password, 10);
            
            familyMember = new User({
                role: 'family',
                name: `Family of ${pregnantWoman.name}`,
                phone: `family_${pregnantWoman.phone}`,
                password: hashedPassword,
                familyOf: pregnantWoman._id,
                uniqueCode: uniqueCode.toUpperCase()
            });

            await familyMember.save();
        } else {
            // Verify password for existing family member
            const isPasswordValid = await bcrypt.compare(password, familyMember.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: "Invalid password" },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "Family member authenticated successfully",
            familyMember: {
                id: familyMember._id,
                name: familyMember.name,
                role: familyMember.role,
                linkedPatient: pregnantWoman.name
            }
        });

    } catch (error) {
        console.error("Family login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}