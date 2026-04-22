import React from "react";

// simple display card for highlighting key numbers and metrics in general dashboards
const StatCard = ({ label, value, icon, color = "var(--primary)" }) => {
  return (
    <div className="arena-card arena-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* descriptive text for the statistic being tracked */}
        <div className="arena-stat-label">{label}</div>
        {/* optional visual icon with color coding for quick category identification */}
        {icon && <div style={{ color: color, opacity: 0.8 }}>{icon}</div>}
      </div>
      {/* the primary metric value formatted for high visibility */}
      <div className="arena-stat-value" style={{ color: color }}>{value}</div>
    </div>
  );
};

export default StatCard;
