import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdminLayout.css";

function getInitials(firstName = "", lastName = "") {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
}

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ User from localStorage
  const user = useMemo(() => {
    const firstName = localStorage.getItem("firstName") || "Coach";
    const lastName = localStorage.getItem("lastName") || "";
    const role = localStorage.getItem("role") || "COACH";
    const email = localStorage.getItem("email") || "coach@sports.com";
    const phone = localStorage.getItem("phone") || "07XXXXXXXX";

    const qualifications = localStorage.getItem("qualifications") || "";
    const specialization = localStorage.getItem("specialization") || "";

    return { firstName, lastName, role, email, phone, qualifications, specialization };
  }, []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  // Dropdown
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
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">Coach Panel</h2>

        <nav className="sidebar-nav">
          <NavLink to="/coach" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          <NavLink to="/coach/my-classes" className={({ isActive }) => (isActive ? "active" : "")}>
            My Classes
          </NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        <div className="admin-topbar">
          <strong>Coach Dashboard</strong>

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
                  <Link className="profile-menu-item" to="/coach/profile" role="menuitem">
                    My Profile
                  </Link>

                  <Link className="profile-menu-item" to="/coach/settings" role="menuitem">
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

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
