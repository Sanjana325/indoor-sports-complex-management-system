import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

function getInitials(firstName = "", lastName = "") {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
}

const COACH_NAV_ITEMS = [
  { path: "/coach", label: "Dashboard Home", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  )},
  { path: "/coach/my-classes", label: "Assigned Classes", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
  )},
  { path: "/coach/cancelled-sessions", label: "Cancellation History", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
  )},
];

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => ({
    firstName: localStorage.getItem("firstName") || "Coach",
    lastName: localStorage.getItem("lastName") || "",
    role: localStorage.getItem("role") || "COACH",
    email: localStorage.getItem("email") || "coach@sports.com",
  }), []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const logout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">Arena<span>Pro</span></h2>
        <nav className="sidebar-nav">
          {COACH_NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} end={item.path === "/coach"}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>Coach Portal</div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div ref={profileRef} style={{ position: "relative" }}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary-glow)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{initials}</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{displayName}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Faculty Coach</div>
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
