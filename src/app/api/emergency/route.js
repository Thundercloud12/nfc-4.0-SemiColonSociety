import twilio from "twilio";
import mongoose from "mongoose";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import Emergency from "@/models/Emergency"; 
import { formatPhoneNumber, errorResponse, successResponse } from "@/lib/apiUtils"; 


const accountSid = process.env.TWILIO_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

export async function POST(req) {
  try {
    const { userId, userLocation } = await req.json();

    if (!userId || !userLocation) {
      return errorResponse("Missing required fields", 400);
    }

    await connectDb();

    
    const user = await User.findById(userId).lean();

    if (!user) {
      return errorResponse("User not found", 404);
    }

    // Find ASHA worker by reverse lookup
    const ashaWorker = await User.findOne({
      role: 'asha',
      assignedPatients: userId
    }).lean();

    if (!ashaWorker || !ashaWorker.phone) {
      return errorResponse("ASHA worker not found or missing phone number", 404);
    }



    const loc = user.location || {};
    let fullAddress = loc.address || "";
    if (loc.city) fullAddress += `, ${loc.city}`;
    if (loc.state) fullAddress += `, ${loc.state}`;
    if (loc.country) fullAddress += `, ${loc.country}`;
    if (loc.postalCode) fullAddress += ` - ${loc.postalCode}`;

    const { lat, lng } = userLocation;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    const messageBody = `EMERGENCY ALERT!\nHelp needed at:\n${fullAddress}\nLocation: ${mapsLink}`;
    
    // Format phone number for Twilio
    const toPhoneNumber = formatPhoneNumber(ashaWorker.phone);
    
    await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: toPhoneNumber,
    });


    // Save emergency record to database
    const emergencyRecord = new Emergency({
      patient: userId,
      patientName: user.name,
      ashaWorker: ashaWorker._id,
      ashaWorkerName: ashaWorker.name,
      location: {
        latitude: lat,
        longitude: lng,
      },
      address: fullAddress,
      status: 'sent',
    });

    await emergencyRecord.save();

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error in emergency API:", error);
    return errorResponse("Failed to send emergency alert", 500);
  }

}

