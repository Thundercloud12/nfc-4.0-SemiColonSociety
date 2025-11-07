import { NextResponse } from "next/server";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import { initApiRoute, errorResponse, successResponse } from "@/lib/apiUtils";

export async function POST(request) {
  try {
    const { session, error } = await initApiRoute();
    if (error) return error;

    const { subscription, deviceInfo } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return errorResponse("Invalid subscription data", 400);
    }
    
    // Add subscription to user (avoid duplicates)
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { 
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          deviceInfo: {
            userAgent: deviceInfo?.userAgent || 'Unknown',
            timestamp: new Date()
          }
        }
      }
    });

    console.log(`Push subscription added for user: ${session.user.id}`);
    return successResponse({ success: true, message: "Push subscription saved" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(request) {
  try {
    const { session, error } = await initApiRoute();
    if (error) return error;

    const { endpoint } = await request.json();
    
    // Remove subscription from user
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { 
        pushSubscriptions: { endpoint }
      }
    });

    console.log(`Push subscription removed for user: ${session.user.id}`);
    return successResponse({ success: true, message: "Push subscription removed" });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return errorResponse(error.message, 500);
  }
}
