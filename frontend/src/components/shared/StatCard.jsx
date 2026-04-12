import React from "react";

const StatCard = ({ label, value, icon, color = "var(--primary)" }) => {
  return (
    <div className="arena-card arena-stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="arena-stat-label">{label}</div>
        {icon && <div style={{ color: color, opacity: 0.8 }}>{icon}</div>}
      </div>
      <div className="arena-stat-value" style={{ color: color }}>{value}</div>
    </div>
  );
};

export default StatCard;
