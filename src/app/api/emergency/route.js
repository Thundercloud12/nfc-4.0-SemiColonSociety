import twilio from "twilio";
import mongoose from "mongoose";
import { connectDb } from "@/lib/dbConnect";
import User from "@/models/User";
import Emergency from "@/models/Emergency"; 

const accountSid = process.env.TWILIO_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

export async function POST(req) {
  try {
    const { userId, userLocation } = await req.json();

    if (!userId || !userLocation) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await connectDb();

    
    const user = await User.findById(userId).lean();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find ASHA worker by reverse lookup
    const ashaWorker = await User.findOne({
      role: 'asha',
      assignedPatients: userId
    }).lean();

    if (!ashaWorker || !ashaWorker.phone) {
      return new Response(
        JSON.stringify({ error: "ASHA worker not found or missing phone number" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
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
      let toPhoneNumber = ashaWorker.phone;

      // Ensure it starts with "+91" if it's a 10-digit Indian number
      if (/^\d{10}$/.test(toPhoneNumber)) {
        toPhoneNumber = `+91${toPhoneNumber}`;
      }
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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in emergency API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send emergency alert" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}