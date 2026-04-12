import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import staffService from "../services/staffService";
import adminService from "../services/adminService";
import { getInitials } from "../utils/formatters";


const STAFF_NAV_ITEMS = [
  { path: "/staff", label: "Calendar", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
  )},
  { path: "/staff/attendance", label: "Attendance", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
  )},
  { path: "/staff/bookings", label: "Bookings", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z"></path><path d="M3 19V5"></path></svg>
  )},
  { path: "/staff/payments", label: "Payments", badge: true, icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
  )},
  { path: "/staff/classes", label: "Classes", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
  )},
  { path: "/staff/enrollments", label: "Enrollments", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
  )},
];

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout: authLogout } = useAuth();

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentCancellations, setRecentCancellations] = useState([]);
  const [showLockToast, setShowLockToast] = useState(false);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const countData = await adminService.getPendingPaymentsCount();
        setPendingPaymentsCount(countData.count);

        const cancelData = await staffService.getRecentCancellations();
        setRecentCancellations(cancelData.cancellations || []);
      } catch (e) {
        console.error("Staff fetch error:", e);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (sessionId) => {
    try {
      await staffService.acknowledgeCancellation(sessionId);
      setRecentCancellations(prev => prev.filter(c => c.id !== sessionId));
    } catch (e) {
      console.error("Acknowledge error:", e);
    }
  };

  const handleRestrictedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLockToast(true);
  };

  const logout = () => {
    authLogout();
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-main">
          <h2 className="sidebar-title">Arena<span>Pro</span></h2>
          <nav 
            className={`sidebar-nav ${user.mustChangePassword ? "is-restricted" : ""}`}
            onClickCapture={user.mustChangePassword ? handleRestrictedClick : undefined}
          >
            {STAFF_NAV_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === "/staff"}>
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && pendingPaymentsCount > 0 && (
                  <span style={{ background: "var(--primary)", color: "white", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>{pendingPaymentsCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <footer className="sidebar-footer" ref={profileRef}>
          {isProfileOpen && (
            <div className="sidebar-popup-menu">
              <Link to="/staff/profile" className="sidebar-popup-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                My Profile
              </Link>
              <Link to="/staff/settings" className="sidebar-popup-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </Link>
              <button 
                type="button" 
                className="sidebar-popup-item logout" 
                onClick={logout}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            </div>
          )}

          <div 
            className={`sidebar-user ${isProfileOpen ? 'is-active' : ''}`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <span className="sidebar-user-caret">▾</span>
          </div>
        </footer>
      </aside>

      <main className="admin-main">
        <div className="floating-notif-container" ref={notifRef}>
          <button 
            className="floating-notif-bell" 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            🔔
            {recentCancellations.length > 0 && (
              <span className="floating-notif-badge">{recentCancellations.length}</span>
            )}
          </button>
          
          {isNotifOpen && (
            <div className="floating-notif-dropdown">
              <div style={{ fontWeight: 800, marginBottom: "12px", fontSize: "0.95rem", color: "var(--text-main)" }}>Recent Alerts</div>
              {recentCancellations.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>No new alerts</p>
              ) : (
                recentCancellations.map(c => (
                  <div key={c.id} style={{ fontSize: "0.8rem", padding: "10px", background: "#fef2f2", borderRadius: "10px", marginBottom: "8px", position: "relative", border: "1px solid #fee2e2" }}>
                    <button 
                      onClick={() => handleAcknowledge(c.id)} 
                      style={{ position: "absolute", right: 6, top: 6, border: "none", background: "none", cursor: "pointer", fontSize: "1.2rem", color: "#991b1b", opacity: 0.5 }}
                    >×</button>
                    <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: "2px" }}>CANCELLED: {c.className}</div>
                    <div style={{ color: "#7f1d1d", opacity: 0.8 }}>{c.date} • {c.startTime}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <section className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </section>
      </main>

      <Snackbar 
        open={showLockToast} 
        autoHideDuration={6000} 
        onClose={() => setShowLockToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowLockToast(false)} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          Access Restricted: Please update your temporary password to unlock all dashboard features.
        </Alert>
      </Snackbar>
    </div>
  );
}
