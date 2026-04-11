import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

function getInitials(firstName = "", lastName = "") {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
}

const NAV_ITEMS = [
  { path: "/admin", label: "Overview", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  )},
  { path: "/admin/calendar", label: "Calendar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  )},
  { path: "/admin/users", label: "Users", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  )},
  { path: "/admin/courts", label: "Courts", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M2 12h20"></path><path d="M12 2v20"></path></svg>
  )},
  { path: "/admin/sports", label: "Sports", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M6 12L18 12"></path><path d="M12 6L12 18"></path></svg>
  )},
  { path: "/admin/classes", label: "Classes", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
  )},
  { path: "/admin/bookings", label: "Bookings", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z"></path><path d="M3 19V5"></path></svg>
  )},
  { path: "/admin/payments", label: "Payments", badge: true, icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
  )},
  { path: "/admin/blocked-slots", label: "Blocked Slots", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
  )},
  { path: "/admin/enrollments", label: "Enrollments", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
  )},
  { path: "/admin/attendance", label: "Attendance", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
  )},
  { path: "/admin/reports", label: "Reports", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
  )},
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => {
    return {
      firstName: localStorage.getItem("firstName") || "Admin",
      lastName: localStorage.getItem("lastName") || "",
      role: localStorage.getItem("role") || "ADMIN",
      email: localStorage.getItem("email") || "admin@sports.com",
    };
  }, []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentCancellations, setRecentCancellations] = useState([]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const pRes = await fetch("http://localhost:5000/api/admin/payments/pending-count", { headers: { Authorization: `Bearer ${token}` } });
        if (pRes.ok) { const d = await pRes.json(); setPendingPaymentsCount(d.count); }
        const cRes = await fetch("http://localhost:5000/api/admin/classes/recent-cancellations", { headers: { Authorization: `Bearer ${token}` } });
        if (cRes.ok) { const d = await cRes.json(); setRecentCancellations(d.cancellations || []); }
      } catch (e) { console.error(e); }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/classes/cancel-alert/${sessionId}/acknowledge`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRecentCancellations(prev => prev.filter(c => c.id !== sessionId));
    } catch (e) { console.error(e); }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">Arena<span>Pro</span></h2>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === "/admin"}>
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && pendingPaymentsCount > 0 && (
                <span style={{ background: "var(--primary)", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>{pendingPaymentsCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ background: "var(--bg-body)", border: "none", padding: "8px", borderRadius: "10px", cursor: "pointer", position: "relative" }}>
                🔔 {recentCancellations.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", fontSize: "0.65rem", padding: "2px 5px", borderRadius: "50%" }}>{recentCancellations.length}</span>}
              </button>
              {isNotifOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, width: "300px", background: "white", boxShadow: "var(--shadow-lg)", borderRadius: "12px", marginTop: "10px", padding: "12px", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "0.9rem" }}>Recent Alerts</div>
                  {recentCancellations.length === 0 ? <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No new alerts</p> : (
                    recentCancellations.map(c => (
                      <div key={c.id} style={{ fontSize: "0.75rem", padding: "8px", background: "#fef2f2", borderRadius: "8px", marginBottom: "6px", position: "relative" }}>
                        <button onClick={() => handleAcknowledge(c.id)} style={{ position: "absolute", right: 4, top: 4, border: "none", background: "none", cursor: "pointer", fontSize: "1rem" }}>×</button>
                        <div style={{ fontWeight: 700, color: "#991b1b" }}>CANCELLED: {c.className}</div>
                        <div>{c.date} • {c.startTime}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary-glow)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{displayName}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>System Admin</div>
                </div>
              </button>
              {isProfileOpen && (
                <div style={{ position: "absolute", top: "100%", right: 0, width: "200px", background: "white", boxShadow: "var(--shadow-lg)", borderRadius: "12px", marginTop: "10px", padding: "8px", border: "1px solid var(--border-light)" }}>
                  <button onClick={logout} style={{ width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "#ef4444", fontWeight: 600 }}>Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
