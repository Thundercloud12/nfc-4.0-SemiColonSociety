import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription, deviceInfo } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    await connectDb();
    
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
    return NextResponse.json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();
    
    await connectDb();
    
    // Remove subscription from user
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { 
        pushSubscriptions: { endpoint }
      }
    });

    console.log(`Push subscription removed for user: ${session.user.id}`);
    return NextResponse.json({ success: true, message: "Push subscription removed" });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
