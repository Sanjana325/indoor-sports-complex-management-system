import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { getInitials } from "../utils/formatters";


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

  const { user, logout: authLogout } = useAuth();

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLockToast, setShowLockToast] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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
            className={`sidebar-nav ${user.mustChangePassword ? 'is-restricted' : ''}`}
            onClickCapture={user.mustChangePassword ? handleRestrictedClick : undefined}
          >
            {COACH_NAV_ITEMS.map(item => (
              <NavLink key={item.path} to={item.path} end={item.path === "/coach"}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <footer className="sidebar-footer" ref={profileRef}>
          {isProfileOpen && (
            <div className="sidebar-popup-menu">
              <Link to="/coach/profile" className="sidebar-popup-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                My Profile
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
              <div className="sidebar-user-role">Coach</div>
            </div>
            <span className="sidebar-user-caret">▾</span>
          </div>
        </footer>
      </aside>

      <main className="admin-main">

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
