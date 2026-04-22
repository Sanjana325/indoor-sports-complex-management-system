// converts a number into a formatted Sri Lankan Rupee string
export const formatLKR = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// turns date strings or objects into readable text with time
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

// gets the first letter of first and last name for profile icons
export const getInitials = (firstName = "", lastName = "") => {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
};

// groups various status names into three main categories
export const normalizeStatusKey = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "verified" || s === "completed" || s === "paid") return "COMPLETED";
  if (s === "cancelled" || s === "rejected") return "CANCELLED";
  return "PENDING";
};
