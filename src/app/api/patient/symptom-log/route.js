import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import SymptomLog from "@/models/SymptomLog";
import User from "@/models/User";

export async function POST(request) {
  console.log("[Symptom Log API] POST request received");
  
  try {
    console.log("[Symptom Log API] Getting session...");
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.error("[Symptom Log API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "pregnant") {
      console.error("[Symptom Log API] User is not pregnant, role:", session.user.role);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("[Symptom Log API] Parsing symptom data...");
    const symptomData = await request.json();
    console.log("[Symptom Log API] Received symptom data:", {
      hasSymptoms: !!symptomData?.symptoms,
      symptomsCount: symptomData?.symptoms?.length || 0,
      hasGeneralCondition: !!symptomData?.generalCondition,
      hasAdditionalNotes: !!symptomData?.additionalNotes,
      hasRecommendedActions: !!symptomData?.recommendedActions
    });

    if (!symptomData || !symptomData.symptoms) {
      console.error("[Symptom Log API] No symptom data provided");
      return NextResponse.json(
        { error: "Symptom data is required" },
        { status: 400 }
      );
    }

    console.log("[Symptom Log API] Connecting to database...");
    await connectDb();

    // Get priority assessment from AI
    console.log("[Symptom Log API] Calling priority assessment API...");
    let priority = 'MEDIUM'; // Default fallback
    
    try {
      const priorityResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/symptom-priority`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptomData }),
      });

      if (priorityResponse.ok) {
        const priorityResult = await priorityResponse.json();
        priority = priorityResult.priority;
        console.log("[Symptom Log API] Priority assessed:", priority);
      } else {
        console.warn("[Symptom Log API] Priority assessment failed, using default MEDIUM");
      }
    } catch (priorityError) {
      console.error("[Symptom Log API] Error calling priority API:", priorityError.message);
      console.log("[Symptom Log API] Using default MEDIUM priority");
    }

    // Create symptom log
    console.log("[Symptom Log API] Creating symptom log...");
    const symptomLog = new SymptomLog({
      patient: session.user.id,
      symptoms: symptomData.symptoms || [],
      generalCondition: symptomData.generalCondition || "",
      additionalNotes: symptomData.additionalNotes || "",
      recommendedActions: symptomData.recommendedActions || [],
      priority: priority,
      loggedAt: new Date()
    });

    console.log("[Symptom Log API] Saving symptom log to database...");
    await symptomLog.save();
    console.log("[Symptom Log API] Symptom log saved with ID:", symptomLog._id);

    // Add symptom log reference to user
    console.log("[Symptom Log API] Adding symptom log reference to user...");
    await User.findByIdAndUpdate(
      session.user.id,
      { $push: { symptomLogs: symptomLog._id } }
    );
    console.log("[Symptom Log API] User updated with symptom log reference");

    console.log("[Symptom Log API] Symptom log creation completed successfully");
    return NextResponse.json({
      message: "Symptom log saved successfully",
      symptomLogId: symptomLog._id,
      priority: priority,
      priorityMessage: priority === 'HIGH' 
        ? "This symptom combination requires immediate medical attention" 
        : priority === 'MEDIUM' 
        ? "These symptoms should be monitored and may require medical consultation"
        : "These are common symptoms that should be tracked"
    });

  } catch (error) {
    console.error("[Symptom Log API] Error saving symptom log:");
    console.error("[Symptom Log API] Error message:", error.message);
    console.error("[Symptom Log API] Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
