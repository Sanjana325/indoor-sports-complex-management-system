/**
 * Centralized validation rules for the ArenaPro frontend.
 * Keeping these here ensures that security policies (like password strength)
 * are consistent across Login, Registration, and Profile management.
 */

// clean up email text to remove spaces and make it lowercase
export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

// verify that the email address is correctly formatted using standard regex
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (e.length < 6 || e.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(e);
}

// enforce password security requirements (Min 8 chars, Upper, Lower, Number)
export function isStrongPassword(pw) {
  if (typeof pw !== "string") return false;
  if (pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

// user-friendly description of the password policy
export function passwordPolicyMessage() {
  return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
}

// remove spaces and formatting characters from phone strings
export function normalizePhone(phone) {
  if (typeof phone !== "string") return "";
  return phone.replace(/[^\d+]/g, "").trim();
}

// validate phone numbers (supports local 07... and international 94... formats)
export function isValidPhoneNumber(phone) {
  const p = normalizePhone(phone);
  if (!p) return false;
  if (/^\+94\d{9}$/.test(p)) return true;
  if (/^94\d{9}$/.test(p)) return true;
  if (/^0\d{9}$/.test(p)) return true;
  if (/^\d{9,12}$/.test(p)) return true;
  return false;
}
