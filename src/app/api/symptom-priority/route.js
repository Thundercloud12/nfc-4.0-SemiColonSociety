import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    console.log("[Symptom Priority API] POST request received");
    
    try {
        console.log("[Symptom Priority API] Parsing request body...");
        const { symptomData } = await request.json();
        
        console.log("[Symptom Priority API] Symptom data received:", {
            hasSymptoms: !!symptomData?.symptoms,
            symptomsCount: symptomData?.symptoms?.length || 0,
            hasGeneralCondition: !!symptomData?.generalCondition,
            hasAdditionalNotes: !!symptomData?.additionalNotes
        });

        if (!symptomData || !symptomData.symptoms || symptomData.symptoms.length === 0) {
            console.error("[Symptom Priority API] No symptoms data provided");
            return NextResponse.json({
                error: "Symptom data is required"
            }, { status: 400 });
        }

        console.log("[Symptom Priority API] Initializing Gemini model...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create a detailed prompt for priority assessment
        const prompt = `
You are a medical AI assistant specialized in pregnancy health assessment. Analyze the following symptoms and assign a priority level (LOW, MEDIUM, or HIGH) based on potential health risks for pregnant women.

Symptom Information:
${symptomData.symptoms.map((symptom, index) => `
${index + 1}. Symptom: ${symptom.name}
   Severity: ${symptom.severity}
   Duration: ${symptom.duration || 'Not specified'}
   Description: ${symptom.description || 'Not specified'}
`).join('')}

General Condition: ${symptomData.generalCondition || 'Not specified'}
Additional Notes: ${symptomData.additionalNotes || 'Not specified'}

Priority Classification Guidelines:
- HIGH: Symptoms that could indicate serious complications requiring immediate medical attention (bleeding, severe pain, signs of preeclampsia, decreased fetal movement, etc.)
- MEDIUM: Concerning symptoms that should be monitored and may require medical consultation (persistent headaches, unusual swelling, changes in discharge, etc.)
- LOW: Common pregnancy symptoms that are generally normal but worth tracking (mild nausea, fatigue, minor aches, etc.)

Please respond with ONLY the priority level: LOW, MEDIUM, or HIGH
Do not include any explanation or additional text.
`;

        console.log("[Symptom Priority API] Sending request to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const priorityText = response.text().trim().toUpperCase();
        
        console.log("[Symptom Priority API] Gemini response:", priorityText);

        // Validate the response
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
        let priority = 'MEDIUM'; // Default fallback
        
        if (validPriorities.includes(priorityText)) {
            priority = priorityText;
            console.log("[Symptom Priority API] Valid priority assigned:", priority);
        } else {
            console.warn("[Symptom Priority API] Invalid response from Gemini, using default MEDIUM priority");
            console.warn("[Symptom Priority API] Gemini response was:", priorityText);
        }

        console.log("[Symptom Priority API] Priority assessment completed successfully");
        return NextResponse.json({
            priority: priority,
            message: "Priority assessed successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("[Symptom Priority API] Error occurred:");
        console.error("[Symptom Priority API] Error message:", error.message);
        console.error("[Symptom Priority API] Error stack:", error.stack);
        
        if (error.message.includes('API key')) {
            console.error("[Symptom Priority API] Gemini API key issue");
            return NextResponse.json({
                error: "AI service configuration error"
            }, { status: 500 });
        }
        
        return NextResponse.json({
            error: "Failed to assess symptom priority"
        }, { status: 500 });
    }
}
