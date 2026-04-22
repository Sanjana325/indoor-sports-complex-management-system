import React from "react";

// stylized badge component for consistent status labeling across tables and profiles
const StatusPill = ({ status, label }) => {
  // helper function to map raw backend status strings to CSS semantic classes
  const getStatusClass = (s) => {
    const term = String(s || "").toUpperCase();
    
    const map = {
      // payment lifecycle states
      PAID: "success",
      VERIFIED: "success",
      COMPLETED: "success",
      PENDING: "warning",
      PENDING_PAYMENT: "warning",
      REJECTED: "danger",
      FAILED: "danger",
      
      // account and accessibility states
      ACTIVE: "success",
      DISABLED: "danger",
      INACTIVE: "danger",
      
      // logistical state trackers
      CONFIRMED: "success",
      CANCELLED: "danger",
      EXPIRED: "expired",
      WAITING_VERIFICATION: "info"
    };

    return map[term] || "";
  };

  return (
    /* dynamically assigned class determines the color theme of the badge */
    <span className={`status-pill ${getStatusClass(status)}`}>
      {label || status}
    </span>
  );
};

export default StatusPill;
