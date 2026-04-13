import { useNavigate } from "react-router-dom";

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
    title: "Payments Report", 
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

const getReportIcon = (name) => {
  if (name === "calendar") return "📅";
  if (name === "dollar") return "💰";
  if (name === "users") return "👥";
  if (name === "graduation") return "🎓";
  return "📄";
};

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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-2)" }}>
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
              className="btn btn-secondary mt-auto" 
              style={{ width: "100%" }} 
              onClick={() => navigate(r.path)}
            >
              Open Analytics Dashboard
            </button>
          </div>
        ))}
      </div>
      
      <div className="arena-card mt-4" style={{ background: 'var(--bg-main)', border: '1px dashed var(--primary-light)' }}>
         <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '10px' }}>💡 Pro Tip</h3>
         <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Each report dashboard now supports real-time filtering, interactive trend charts, and PDF/CSV exports for professional record keeping.</p>
      </div>
    </div>
  );
}