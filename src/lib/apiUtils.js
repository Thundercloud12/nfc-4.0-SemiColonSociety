import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDb } from "@/lib/dbConnect";
import crypto from "crypto";

/**
 * Validates session and checks if user has required role
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {Promise<{session: Object|null, error: NextResponse|null}>}
 */
export async function validateSession(allowedRoles = []) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { 
      session: null, 
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    return { 
      session: null, 
      error: NextResponse.json({ error: "Access denied" }, { status: 403 })
    };
  }

  return { session, error: null };
}

/**
 * Connects to database and validates session in one call
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {Promise<{session: Object|null, error: NextResponse|null}>}
 */
export async function initApiRoute(allowedRoles = []) {
  await connectDb();
  return validateSession(allowedRoles);
}

/**
 * Standard error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function successResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Generate unique 8-character code
 * @returns {string} Uppercase 8-character hex code
 */
export function generateUniqueCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Generate 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Format phone number for Twilio (adds +91 prefix for 10-digit Indian numbers)
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (/^\d{10}$/.test(phone)) {
    return `+91${phone}`;
  }
  return phone;
}

/**
 * Ensures a unique code doesn't already exist in the database
 * @param {Function} findFn - Async function to check if code exists
 * @returns {Promise<string>} Unique code
 */
export async function ensureUniqueCode(findFn) {
  let code;
  let exists = true;
  
  while (exists) {
    code = generateUniqueCode();
    const result = await findFn(code);
    if (!result) {
      exists = false;
    }
  }
  
  return code;
}
