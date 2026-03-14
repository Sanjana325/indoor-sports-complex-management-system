import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/PlayerLayout.css";

function getInitials(firstName = "", lastName = "") {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
}

export default function PlayerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useMemo(() => {
    const firstName = localStorage.getItem("firstName") || "Player";
    const lastName = localStorage.getItem("lastName") || "";
    const role = localStorage.getItem("role") || "PLAYER";
    const email = localStorage.getItem("email") || "player@sports.com";
    const phone = localStorage.getItem("phone") || "07XXXXXXXX";

    return { firstName, lastName, role, email, phone };
  }, []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("phone");
    localStorage.removeItem("qualifications");
    localStorage.removeItem("specialization");
    navigate("/");
  }

  return (
    <div className="player-layout">
      {/* SIDEBAR */}
      <aside className="player-sidebar">
        <h2 className="sidebar-title">ArenaPro</h2>

        <nav className="sidebar-nav">
          <NavLink to="/player" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          <NavLink to="/player/my-bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            My Bookings
          </NavLink>

          <NavLink to="/player/my-classes" className={({ isActive }) => (isActive ? "active" : "")}>
            My Classes
          </NavLink>

          <NavLink to="/player/my-payments" className={({ isActive }) => (isActive ? "active" : "")}>
            My Payments
          </NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="player-main">
        <div className="player-topbar">
          <div className="topbar-left">
            {/* Logo or empty space */}
          </div>

          <div className="topbar-right" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setIsProfileOpen((p) => !p)}
              aria-haspopup="menu"
              aria-expanded={isProfileOpen}
            >
              <span className="profile-avatar">{initials}</span>
              <span className="profile-name-mini">{displayName || "User"}</span>
              <span className="profile-caret">▾</span>
            </button>

            {isProfileOpen && (
              <div className="profile-menu" role="menu">
                <div className="profile-menu-head">
                  <div className="profile-menu-left">
                    <div className="profile-menu-avatar">{initials}</div>
                    <div className="profile-menu-meta">
                      <div className="profile-menu-name">{displayName || "User"}</div>
                      <div className="profile-menu-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="profile-role-pill">{user.role}</div>
                </div>

                <div className="profile-menu-list">
                  <Link className="profile-menu-item" to="/player/profile" role="menuitem">
                    My Profile
                  </Link>

                  <Link className="profile-menu-item" to="/player/settings" role="menuitem">
                    Settings
                  </Link>
                </div>

                <div className="profile-menu-footer">
                  <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="player-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
