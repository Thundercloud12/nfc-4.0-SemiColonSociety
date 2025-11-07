import { User } from "@/models/User";
import { errorResponse } from "./apiUtils";

/**
 * Get family member and validate they have a linked patient
 * @param {string} familyMemberId - ID of the family member
 * @returns {Promise<{familyMember: Object|null, error: NextResponse|null}>}
 */
export async function getFamilyMemberWithPatient(familyMemberId) {
  const familyMember = await User.findById(familyMemberId);
  
  if (!familyMember || !familyMember.familyOf) {
    return {
      familyMember: null,
      error: errorResponse("No linked patient found for this family member", 404)
    };
  }

  return { familyMember, error: null };
}

/**
 * Get the linked patient for a family member
 * @param {string} patientId - ID of the patient
 * @returns {Promise<{patient: Object|null, error: NextResponse|null}>}
 */
export async function getLinkedPatient(patientId) {
  const patient = await User.findById(patientId)
    .select('-password')
    .lean();

  if (!patient) {
    return {
      patient: null,
      error: errorResponse("Linked patient not found", 404)
    };
  }

  return { patient, error: null };
}
