import { useNavigate } from "react-router-dom";

// directory of all available analytical report types
const REPORTS = [
  { 
    key: "BOOKINGS", 
    title: "Bookings Report", 
    desc: "Generate report of all bookings with date range filters", 
    icon: "calendar",
    path: "/admin/reports/bookings"
  },
  { 
    key: "PAYMENTS", 
    title: "Financial Report", 
    desc: "Financial summary with payment status breakdown", 
    icon: "dollar",
    path: "/admin/reports/payments"
  },
  { 
    key: "ATTENDANCE", 
    title: "Attendance Report", 
    desc: "Class-wise attendance tracking and statistics", 
    icon: "users",
    path: "/admin/reports/attendance"
  },
  { 
    key: "ENROLLMENTS", 
    title: "Enrollments Report", 
    desc: "Student enrollment data by class and date", 
    icon: "graduation",
    path: "/admin/reports/enrollments"
  },
];

// matching visual icons with report categories
const getReportIcon = (name) => {
  if (name === "calendar") return "📅";
  if (name === "dollar") return "💰";
  if (name === "users") return "👥";
  if (name === "graduation") return "🎓";
  return "📄";
};

// central hub for administrators to access various types of business reports
export default function Reports() {
  const navigate = useNavigate();

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Select a category to view detailed business intelligence</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-2)" }}>
        {/* dynamically renders a card for every report defined in the list */}
        {REPORTS.map((r) => (
          <div key={r.key} className="arena-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", marginBottom: 'var(--space-2)' }}>
              <div style={{ padding: "12px", background: "var(--primary-light)", borderRadius: "12px", color: "var(--primary)" }}>{getReportIcon(r.icon)}</div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{r.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{r.desc}</p>
              </div>
            </div>
            <button 
              className="btn mt-auto" 
              style={{ 
                width: "100%", 
                background: "var(--primary-gradient)", 
                color: "white", 
                border: "none",
                fontWeight: 600,
                boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.2)"
              }} 
              onClick={() => navigate(r.path)}
            >
              Open Analytics Dashboard
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}