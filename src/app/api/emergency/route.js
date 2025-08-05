import twilio from "twilio";
import mongoose from "mongoose";
import { connectDb } from "@/lib/dbConnect";
<<<<<<< HEAD
import User from "@/models/User";
=======
import User from "@/models/User"; 
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6

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

<<<<<<< HEAD
    const user = await User.findById(userId).lean();

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
=======
    
    const user = await User.findById(userId).lean();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
    }

    // Find ASHA worker by reverse lookup
    const ashaWorker = await User.findOne({
<<<<<<< HEAD
      role: "asha",
      assignedPatients: userId,
=======
      role: 'asha',
      assignedPatients: userId
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
    }).lean();

    if (!ashaWorker || !ashaWorker.phone) {
      return new Response(
<<<<<<< HEAD
        JSON.stringify({
          error: "ASHA worker not found or missing phone number",
        }),
=======
        JSON.stringify({ error: "ASHA worker not found or missing phone number" }),
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

<<<<<<< HEAD
=======


>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
    const loc = user.location || {};
    let fullAddress = loc.address || "";
    if (loc.city) fullAddress += `, ${loc.city}`;
    if (loc.state) fullAddress += `, ${loc.state}`;
    if (loc.country) fullAddress += `, ${loc.country}`;
    if (loc.postalCode) fullAddress += ` - ${loc.postalCode}`;

    const { lat, lng } = userLocation;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    const messageBody = `EMERGENCY ALERT!\nHelp needed at:\n${fullAddress}\nLocation: ${mapsLink}`;
<<<<<<< HEAD
    let toPhoneNumber = ashaWorker.phone;

    // Ensure it starts with "+91" if it's a 10-digit Indian number
    if (/^\d{10}$/.test(toPhoneNumber)) {
      toPhoneNumber = `+91${toPhoneNumber}`;
    }
=======
      let toPhoneNumber = ashaWorker.phone;

      // Ensure it starts with "+91" if it's a 10-digit Indian number
      if (/^\d{10}$/.test(toPhoneNumber)) {
        toPhoneNumber = `+91${toPhoneNumber}`;
      }
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
    await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: toPhoneNumber,
    });

<<<<<<< HEAD
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
=======
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
>>>>>>> eaa69cba25f349e726e25548c158ee76b8cd00f6
  } catch (error) {
    console.error("Error in emergency API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send emergency alert" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
