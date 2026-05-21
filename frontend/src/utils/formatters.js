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

// abbreviated month names for the date display cards
export const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

// detailed timestamp formatter for the booking audit trail
export const formatFullTimestamp = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// converts 24-hour timestamps from strings into a readable AM/PM range
export const formatTimeRange = (startIso, endIso) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  
  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  };
  
  return `${formatTime(s)} - ${formatTime(e)}`;
};

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatTimeShort = (t) => {
  if (!t) return "";
  const timeStr = String(t);
  return timeStr.includes(':') ? timeStr.slice(0, 5) : timeStr;
};

// helper to transform raw schedule data into a readable format for players
export const formatScheduleDetailed = (c) => {
  const start = formatTimeShort(c.StartTime);
  const end = formatTimeShort(c.EndTime);
  const timeRange = start && end ? `${start} - ${end}` : (start || end || "");

  if (c.ScheduleType === "ONETIME") {
    return `One-Time | ${timeRange || "No time set"}`;
  }

  if (c.Weekdays) {
    try {
      const days = String(c.Weekdays).split(',')
        .map(d => {
          const idx = parseInt(d.trim());
          return !isNaN(idx) ? DAY_MAP[idx] : d;
        })
        .filter(d => d)
        .join(", ");
      return days ? `${days} | ${timeRange}` : timeRange;
    } catch (e) {
      console.error("[Format] Weekdays error:", e);
    }
  }
  
  return timeRange || "Schedule TBA";
};
