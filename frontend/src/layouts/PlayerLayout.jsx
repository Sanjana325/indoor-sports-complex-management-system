import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { getInitials } from "../utils/formatters";
import "../styles/PlayerPortal.css";

// specialized layout for the player dashboard with restricted access handling
export default function PlayerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout } = useAuth();
  
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLockToast, setShowLockToast] = useState(false);
  const profileRef = useRef(null);

  // closes profile dropdown when clicking anywhere else on the screen
  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // auto-closes menu on navigation to prevent overlay sticking
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  // blocks navigation if the user hasn't changed their default password
  const handleRestrictedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLockToast(true);
  };

  function handleLogout() {
    authLogout();
    navigate("/");
  }

  return (
    <div className="player-portal-layout">
      {/* horizontal navigation bar for top-level player actions */}
      <nav className="player-nav">
        <div className="player-nav-brand-container">
          <Link to="/player" className="player-nav-brand">
            Arena<span className="brand-pro">Pro</span>
          </Link>
        </div>

        {/* nav links with conditional restriction overlay for unverified accounts */}
        <div className={`player-nav-links ${user.mustChangePassword ? 'is-restricted' : ''}`}
             onClickCapture={user.mustChangePassword ? handleRestrictedClick : undefined}>
          <NavLink to="/player" className="player-nav-link" end>Home</NavLink>
          <NavLink to="/player/my-bookings" className="player-nav-link">My Bookings</NavLink>
          <NavLink to="/player/my-classes" className="player-nav-link">My Classes</NavLink>
          <NavLink to="/player/my-payments" className="player-nav-link">Payments</NavLink>
        </div>

        {/* interactive user profile chip with dropdown menu */}
        <div className="player-nav-user" ref={profileRef} onClick={() => setIsProfileOpen(!isProfileOpen)}>
          <div className="user-chip-trigger">
            <div className="user-chip-avatar">{initials}</div>
            <div className="user-chip-info">
              <span className="user-chip-name">{user.firstName} {user.lastName}</span>
              <span className="user-chip-status">Player</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '4px' }}>▾</span>
          </div>

          {isProfileOpen && (
            /* floating dropdown for account settings and session termination */
            <div className="player-profile-dropdown">
               <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{user.firstName} {user.lastName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
               </div>
              <Link to="/player/profile" className="player-dropdown-item">Profile Settings</Link>

              <button onClick={handleLogout} className="player-dropdown-item logout">Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      {/* primary container for rendering nested dashboard views */}
      <main className="player-content-wrapper">
        <Outlet />
      </main>

      {/* temporary alert prompting users to finalize their account security */}
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
          Access Restricted: Please update your temporary password to unlock all portal features.
        </Alert>
      </Snackbar>
    </div>
  );
}
