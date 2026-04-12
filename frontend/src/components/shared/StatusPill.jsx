import React from "react";

const StatusPill = ({ status, label }) => {
  const getStatusClass = (s) => {
    const term = String(s || "").toUpperCase();
    
    const map = {
      // Payment Statuses
      PAID: "success",
      VERIFIED: "success",
      COMPLETED: "success",
      PENDING: "warning",
      PENDING_PAYMENT: "warning",
      REJECTED: "danger",
      FAILED: "danger",
      
      // User/Account Statuses
      ACTIVE: "success",
      DISABLED: "danger",
      INACTIVE: "danger",
      
      // Booking/Class Statuses
      CONFIRMED: "success",
      CANCELLED: "danger",
      EXPIRED: "expired",
      WAITING_VERIFICATION: "info"
    };

    return map[term] || "";
  };

  return (
    <span className={`status-pill ${getStatusClass(status)}`}>
      {label || status}
    </span>
  );
};

export default StatusPill;
