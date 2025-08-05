import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "pregnant") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { message, conversationHistory, shouldEndSession } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Prepare conversation context for Gemini
    const conversationContext = conversationHistory
      .map(msg => `${msg.type === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    let prompt;
    
    if (shouldEndSession) {
      // Prompt for extracting structured data - NO MORE QUESTIONS
      prompt = `You are a medical assistant. The patient has indicated they want to stop the conversation. Based on the following conversation, extract structured symptom data and provide ONLY a brief closing response and structured data. DO NOT ask any more questions.

Conversation:
${conversationContext}
Patient: ${message}

Please provide:
1. A brief empathetic response acknowledging the patient's decision to end the session
2. Structured data in the following JSON format:

{
  "symptoms": [
    {
      "name": "symptom name",
      "severity": "mild/moderate/severe",
      "duration": "duration description",
      "description": "detailed description"
    }
  ],
  "generalCondition": "overall description of how patient is feeling",
  "additionalNotes": "any other relevant information",
  "recommendedActions": ["any suggestions or recommendations"]
}

Respond with ONLY:
RESPONSE: [brief empathetic closing statement - no questions]
STRUCTURED_DATA: [the JSON object]`;
    } else {
      // Regular conversation prompt
      prompt = `You are a caring medical assistant helping a pregnant woman log her symptoms. Your role is to:

1. Ask relevant follow-up questions about symptoms (severity, duration, triggers, etc.)
2. Be empathetic and supportive
3. Gather detailed information for accurate symptom logging
4. Use simple, non-medical language
5. Show concern for her wellbeing

Current conversation:
${conversationContext}
Patient: ${message}

Respond as a caring medical assistant. Ask relevant follow-up questions to better understand her symptoms. Keep responses concise but warm and supportive.`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (shouldEndSession) {
      // Parse the structured response
      const responseMatch = text.match(/RESPONSE:\s*(.*?)(?=STRUCTURED_DATA:|$)/s);
      const structuredMatch = text.match(/STRUCTURED_DATA:\s*(\{.*\})/s);
      
      let botResponse = "Thank you for sharing your symptoms. They have been logged successfully.";
      let structuredData = null;

      if (responseMatch) {
        botResponse = responseMatch[1].trim();
      }

      if (structuredMatch) {
        try {
          structuredData = JSON.parse(structuredMatch[1].trim());
        } catch (error) {
          console.error("Error parsing structured data:", error);
          // Fallback structured data
          structuredData = {
            symptoms: [{
              name: "General symptoms",
              severity: "moderate",
              duration: "Recent",
              description: message
            }],
            generalCondition: "Patient reported symptoms during conversation",
            additionalNotes: "Extracted from conversation context",
            recommendedActions: ["Consult with ASHA worker"]
          };
        }
      }

      return NextResponse.json({
        response: botResponse,
        structuredData: structuredData
      });
    } else {
      return NextResponse.json({
        response: text.trim()
      });
    }

  } catch (error) {
    console.error("Error in symptom chat:", error);
    return NextResponse.json(
      { error: "Sorry, I'm having trouble processing your message. Please try again." },
      { status: 500 }
    );
  }
}
