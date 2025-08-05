import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import { User } from "@/models/User";
import crypto from "crypto";

// Function to generate unique code
function generateUniqueCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-character code
}

export async function POST(request) {
    console.log("[Register API] POST request received");
    console.log("[Register API] Request headers:", {
        contentType: request.headers.get('content-type'),
        userAgent: request.headers.get('user-agent'),
        origin: request.headers.get('origin')
    });
    
    try {
        console.log("[Register API] Parsing request body...");
        const requestBody = await request.json();
        console.log("[Register API] Full request body received:", JSON.stringify(requestBody, null, 2));
        
        const { name, phone, email, password, role, pregnancyInfo, uniqueCode, languagePreference, location } = requestBody;
        
        console.log("[Register API] Extracted fields:", {
            name,
            phone,
            email: email ? `${email.substring(0, 3)}***` : 'not provided',
            password: password ? `[${password.length} chars]` : 'not provided',
            role,
            hasPregnancyInfo: !!pregnancyInfo,
            pregnancyInfo,
            uniqueCode,
            languagePreference,
            hasLocation: !!location,
            locationDetails: location ? {
                hasCoordinates: !!(location.coordinates && location.coordinates.latitude && location.coordinates.longitude),
                coordinates: location.coordinates,
                address: location.address,
                city: location.city,
                state: location.state,
                country: location.country,
                postalCode: location.postalCode
            } : null
        });
        
        // Basic validation
        console.log("[Register API] Performing basic validation...");
        if (!name || !phone || !password || !role) {
            console.error("[Register API] Validation failed - missing required fields:", {
                hasName: !!name,
                hasPhone: !!phone,
                hasPassword: !!password,
                hasRole: !!role
            });
            console.log("[Register API] Original request body for debugging:", requestBody);
            return NextResponse.json({
                error: "Name, phone, password and role are required"
            }, { status: 400 });
        }
        console.log("[Register API] Basic validation passed");

        // Validate role
        console.log("[Register API] Validating role:", role);
        if (!['pregnant', 'family', 'asha'].includes(role)) {
            console.error("[Register API] Invalid role provided:", role);
            return NextResponse.json({
                error: "Role must be pregnant, family, or asha"
            }, { status: 400 });
        }
        console.log("[Register API] Role validation passed");

        // Role-specific validation
        console.log("[Register API] Performing role-specific validation for role:", role);
        if (role === 'pregnant' && (!pregnancyInfo || !pregnancyInfo.month)) {
            console.error("[Register API] Pregnant user missing pregnancy info:", {
                hasPregnancyInfo: !!pregnancyInfo,
                pregnancyInfoMonth: pregnancyInfo?.month
            });
            return NextResponse.json({
                error: "Pregnancy information is required for pregnant users"
            }, { status: 400 });
        }

        if (role === 'family' && !uniqueCode) {
            console.error("[Register API] Family member missing unique code");
            return NextResponse.json({
                error: "Unique code is required for family members to link with pregnant woman"
            }, { status: 400 });
        }
        console.log("[Register API] Role-specific validation passed");

        console.log("[Register API] Connecting to database...");
        await connectDb();
        console.log("[Register API] Database connection established");
        
        console.log("[Register API] Checking for existing user with phone:", phone);
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            console.warn("[Register API] User already exists with phone:", phone, "UserID:", existingUser._id);
            return NextResponse.json({
                message: "User already registered with this phone number"
            }, { status: 400 });
        }
        console.log("[Register API] No existing user found, proceeding with registration");

        console.log("[Register API] Building user data object...");
        const userData = {
            name,
            phone,
            email,
            password,
            role,
            languagePreference: languagePreference || 'hi'
        };
        console.log("[Register API] Base user data:", {
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            password: '[HIDDEN]',
            role: userData.role,
            languagePreference: userData.languagePreference
        });

        // Add location data if provided
        console.log("[Register API] Processing location data...");
        if (location && location.coordinates && location.coordinates.latitude && location.coordinates.longitude) {
            console.log("[Register API] Valid location data found:", {
                latitude: location.coordinates.latitude,
                longitude: location.coordinates.longitude,
                address: location.address,
                city: location.city,
                state: location.state,
                country: location.country,
                postalCode: location.postalCode
            });
            
            userData.location = {
                coordinates: {
                    latitude: location.coordinates.latitude,
                    longitude: location.coordinates.longitude
                },
                address: location.address || '',
                city: location.city || '',
                state: location.state || '',
                country: location.country || '',
                postalCode: location.postalCode || ''
            };
            console.log("[Register API] Location data added to userData");
        } else {
            console.log("[Register API] No valid location data provided or coordinates missing");
        }

        // Handle role-specific logic
        console.log("[Register API] Processing role-specific logic for:", role);
        if (role === 'pregnant') {
            console.log("[Register API] Processing pregnant user registration...");
            // Generate unique code for pregnant woman
            let generatedCode;
            let codeExists = true;
            
            console.log("[Register API] Generating unique code for pregnant woman...");
            // Ensure unique code is truly unique
            while (codeExists) {
                generatedCode = generateUniqueCode();
                console.log("[Register API] Checking if code exists:", generatedCode);
                const existingCode = await User.findOne({ uniqueCode: generatedCode });
                if (!existingCode) {
                    codeExists = false;
                    console.log("[Register API] Unique code generated successfully:", generatedCode);
                } else {
                    console.log("[Register API] Code already exists, generating new one...");
                }
            }
            
            userData.uniqueCode = generatedCode;
            userData.pregnancyInfo = pregnancyInfo;
            console.log("[Register API] Added pregnancy data:", {
                uniqueCode: generatedCode,
                pregnancyMonth: pregnancyInfo?.month,
                expectedDeliveryDate: pregnancyInfo?.expectedDeliveryDate,
                highRisk: pregnancyInfo?.highRisk,
                medicationsCount: pregnancyInfo?.medications?.length || 0
            });
            
        } else if (role === 'family') {
            console.log("[Register API] Processing family member registration with code:", uniqueCode);
            // Find pregnant woman by unique code
            const pregnantWoman = await User.findOne({ 
                uniqueCode: uniqueCode,
                role: 'pregnant'
            });
            console.log("[Register API] Searching for pregnant woman with code:", uniqueCode);
            
            if (!pregnantWoman) {
                console.error("[Register API] No pregnant woman found with unique code:", uniqueCode);
                return NextResponse.json({
                    error: "Invalid unique code. Please check the code provided by the pregnant woman."
                }, { status: 400 });
            }
            
            console.log("[Register API] Found pregnant woman:", {
                id: pregnantWoman._id,
                name: pregnantWoman.name,
                phone: pregnantWoman.phone
            });
            
            userData.familyOf = pregnantWoman._id;
            userData.uniqueCode = uniqueCode; // Store the same code for reference
            console.log("[Register API] Family member linked to pregnant woman ID:", pregnantWoman._id);
            
        } else if (role === 'asha') {
            console.log("[Register API] Processing ASHA worker registration...");
            // ASHA workers get their own unique code for identification
            let generatedCode;
            let codeExists = true;
            
            console.log("[Register API] Generating unique code for ASHA worker...");
            while (codeExists) {
                generatedCode = generateUniqueCode();
                console.log("[Register API] Checking if ASHA code exists:", generatedCode);
                const existingCode = await User.findOne({ uniqueCode: generatedCode });
                if (!existingCode) {
                    codeExists = false;
                    console.log("[Register API] ASHA unique code generated successfully:", generatedCode);
                } else {
                    console.log("[Register API] ASHA code already exists, generating new one...");
                }
            }
            
            userData.uniqueCode = generatedCode;
            console.log("[Register API] ASHA worker assigned unique code:", generatedCode);
        }

        // Create user
        console.log("[Register API] Creating user in database...");
        console.log("[Register API] Final userData before creation:", {
            ...userData,
            password: '[HIDDEN]',
            locationIncluded: !!userData.location
        });
        
        const newUser = await User.create(userData);
        console.log("[Register API] User created successfully with ID:", newUser._id);
        console.log("[Register API] Created user details:", {
            id: newUser._id,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            uniqueCode: newUser.uniqueCode,
            hasLocation: !!newUser.location,
            locationCity: newUser.location?.city,
            createdAt: newUser.createdAt
        });

        // Return success response with unique code for pregnant women
        console.log("[Register API] Preparing response...");
        const response = {
            message: "User registered successfully"
        };

        if (role === 'pregnant' || role === 'asha') {
            response.uniqueCode = newUser.uniqueCode;
            response.note = role === 'pregnant' 
                ? "Share this unique code with your family members so they can register and receive updates."
                : "This is your ASHA worker identification code.";
            console.log("[Register API] Added unique code to response:", {
                uniqueCode: response.uniqueCode,
                role: role
            });
        }

        console.log("[Register API] Registration completed successfully for user:", newUser._id);
        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        console.error("[Register API] Error occurred during registration:");
        console.error("[Register API] Error message:", error.message);
        console.error("[Register API] Error stack:", error.stack);
        console.error("[Register API] Error name:", error.name);
        
        if (error.name === 'ValidationError') {
            console.error("[Register API] Mongoose validation error details:", error.errors);
        }
        
        if (error.code === 11000) {
            console.error("[Register API] Duplicate key error:", error.keyPattern);
        }
        
        return NextResponse.json({
            error: "Error occurred at register handler"
        }, { status: 500 });
    }
}
