/**
 * Formats a number as Sri Lankan Rupee (LKR)
 * @param {number|string} n 
 * @returns {string}
 */
export const formatLKR = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formats an ISO string or Date object into a readable date string
 * @param {string|Date} isoString 
 * @returns {string}
 */
export const formatDate = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Generates initials from a user's first and last name
 * @param {string} firstName 
 * @param {string} lastName 
 * @returns {string}
 */
export const getInitials = (firstName = "", lastName = "") => {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
};

/**
 * Safely normalizes status strings for consistent comparison
 * @param {string} status 
 * @returns {string}
 */
export const normalizeStatusKey = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "verified" || s === "completed" || s === "paid") return "COMPLETED";
  if (s === "cancelled" || s === "rejected") return "CANCELLED";
  return "PENDING";
};
