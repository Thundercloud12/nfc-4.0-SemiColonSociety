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

    const { message, conversationHistory, shouldEndSession, language = 'en' } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Prepare conversation context for Gemini
    const conversationContext = conversationHistory
      .map(msg => `${msg.type === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    let prompt;
    
    // Language-specific prompts and instructions
    const prompts = {
      en: {
        endSession: `You are a medical assistant. The patient has indicated they want to stop the conversation. Based on the following conversation, extract structured symptom data and provide ONLY a brief closing response and structured data. DO NOT ask any more questions.

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
STRUCTURED_DATA: [the JSON object]`,
        
        regular: `You are a caring medical assistant helping a pregnant woman log her symptoms. Your role is to:

1. Ask relevant follow-up questions about symptoms (severity, duration, triggers, etc.)
2. Be empathetic and supportive
3. Gather detailed information for accurate symptom logging
4. Use simple, non-medical language
5. Show concern for her wellbeing

Current conversation:
${conversationContext}
Patient: ${message}

Respond as a caring medical assistant. Ask relevant follow-up questions to better understand her symptoms. Keep responses concise but warm and supportive.`
      },
      
      hi: {
        endSession: `आप एक चिकित्सा सहायक हैं। रोगी ने बातचीत बंद करने का संकेत दिया है। निम्नलिखित बातचीत के आधार पर, संरचित लक्षण डेटा निकालें और केवल एक संक्षिप्त समापन प्रतिक्रिया और संरचित डेटा प्रदान करें। कोई और प्रश्न न पूछें।

बातचीत:
${conversationContext}
रोगी: ${message}

कृपया प्रदान करें:
1. रोगी के सत्र समाप्त करने के निर्णय को स्वीकार करते हुए एक संक्षिप्त सहानुभूतिपूर्ण प्रतिक्रिया
2. निम्नलिखित JSON प्रारूप में संरचित डेटा:

{
  "symptoms": [
    {
      "name": "लक्षण का नाम",
      "severity": "हल्का/मध्यम/गंभीर",
      "duration": "अवधि का विवरण",
      "description": "विस्तृत विवरण"
    }
  ],
  "generalCondition": "रोगी कैसा महसूस कर रहे हैं का समग्र विवरण",
  "additionalNotes": "कोई अन्य प्रासंगिक जानकारी",
  "recommendedActions": ["कोई सुझाव या सिफारिशें"]
}

केवल इसके साथ उत्तर दें:
RESPONSE: [संक्षिप्त सहानुभूतिपूर्ण समापन कथन - कोई प्रश्न नहीं]
STRUCTURED_DATA: [JSON ऑब्जेक्ट]`,
        
        regular: `आप एक देखभाल करने वाले चिकित्सा सहायक हैं जो एक गर्भवती महिला के लक्षणों को लॉग करने में मदद कर रहे हैं। आपकी भूमिका है:

1. लक्षणों के बारे में प्रासंगिक अनुवर्ती प्रश्न पूछना (गंभीरता, अवधि, ट्रिगर, आदि)
2. सहानुभूतिपूर्ण और सहायक होना
3. सटीक लक्षण लॉगिंग के लिए विस्तृत जानकारी एकत्र करना
4. सरल, गैर-चिकित्सा भाषा का उपयोग करना
5. उनकी भलाई के लिए चिंता दिखाना

वर्तमान बातचीत:
${conversationContext}
रोगी: ${message}

एक देखभाल करने वाले चिकित्सा सहायक के रूप में जवाब दें। उनके लक्षणों को बेहतर ढंग से समझने के लिए प्रासंगिक अनुवर्ती प्रश्न पूछें। प्रतिक्रियाएं संक्षिप्त लेकिन गर्म और सहायक रखें।`
      }
    };
    
    if (shouldEndSession) {
      prompt = prompts[language]?.endSession || prompts.en.endSession;
    } else {
      prompt = prompts[language]?.regular || prompts.en.regular;
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
