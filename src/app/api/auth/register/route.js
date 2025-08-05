import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import crypto from "crypto";

// Function to generate unique code
function generateUniqueCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-character code
}

export async function POST(request) {
    try {
        const { name, phone,email, password, role, pregnancyInfo, uniqueCode, languagePreference } = await request.json();
        
        // Basic validation
        if (!name || !phone || !password || !role) {
            return NextResponse.json({
                error: "Name, phone, password and role are required"
            }, { status: 400 });
        }

        // Validate role
        if (!['pregnant', 'family', 'asha'].includes(role)) {
            return NextResponse.json({
                error: "Role must be pregnant, family, or asha"
            }, { status: 400 });
        }

      
        if (role === 'pregnant' && (!pregnancyInfo || !pregnancyInfo.month)) {
            return NextResponse.json({
                error: "Pregnancy information is required for pregnant users"
            }, { status: 400 });
        }

        
        if (role === 'family' && !uniqueCode) {
            return NextResponse.json({
                error: "Unique code is required for family members to link with pregnant woman"
            }, { status: 400 });
        }

        await connectDb();
        
        
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return NextResponse.json({
                message: "User already registered with this phone number"
            }, { status: 400 });
        }

       
        const userData = {
            name,
            phone,
            email,
            password,
            role,
            languagePreference: languagePreference || 'hi'
        };

        // Handle role-specific logic
        if (role === 'pregnant') {
            // Generate unique code for pregnant woman
            let generatedCode;
            let codeExists = true;
            
            // Ensure unique code is truly unique
            while (codeExists) {
                generatedCode = generateUniqueCode();
                const existingCode = await User.findOne({ uniqueCode: generatedCode });
                if (!existingCode) {
                    codeExists = false;
                }
            }
            
            userData.uniqueCode = generatedCode;
            userData.pregnancyInfo = pregnancyInfo;
            
        } else if (role === 'family') {
            // Find pregnant woman by unique code
            const pregnantWoman = await User.findOne({ 
                uniqueCode: uniqueCode,
                role: 'pregnant'
            });
            
            if (!pregnantWoman) {
                return NextResponse.json({
                    error: "Invalid unique code. Please check the code provided by the pregnant woman."
                }, { status: 400 });
            }
            
            userData.familyOf = pregnantWoman._id;
            userData.uniqueCode = uniqueCode; // Store the same code for reference
            
        } else if (role === 'asha') {
            // ASHA workers get their own unique code for identification
            let generatedCode;
            let codeExists = true;
            
            while (codeExists) {
                generatedCode = generateUniqueCode();
                const existingCode = await User.findOne({ uniqueCode: generatedCode });
                if (!existingCode) {
                    codeExists = false;
                }
            }
            
            userData.uniqueCode = generatedCode;
        }

        // Create user
        const newUser = await User.create(userData);

        // Return success response with unique code for pregnant women
        const response = {
            message: "User registered successfully"
        };

        if (role === 'pregnant' || role === 'asha') {
            response.uniqueCode = newUser.uniqueCode;
            response.note = role === 'pregnant' 
                ? "Share this unique code with your family members so they can register and receive updates."
                : "This is your ASHA worker identification code.";
        }

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "Error occurred at register handler"
        }, { status: 500 });
    }
}
