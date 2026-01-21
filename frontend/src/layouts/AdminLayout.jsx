import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();

  // ✅ Get user details from localStorage (fallbacks if empty)
  const user = useMemo(() => {
    const firstName = localStorage.getItem("firstName") || "Admin";
    const lastName = localStorage.getItem("lastName") || "";
    const role = localStorage.getItem("role") || "ADMIN";
    const email = localStorage.getItem("email") || "admin@sports.com";
    const phone = localStorage.getItem("phone") || "07XXXXXXXX";
    return { firstName, lastName, role, email, phone };
  }, []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();

  // Profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleLogout() {
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("phone");

    navigate("/");
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="sidebar-title">Admin Panel</h2>

        <nav className="sidebar-nav">
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>
            User Management
          </NavLink>

          <NavLink to="/admin/courts" className={({ isActive }) => (isActive ? "active" : "")}>
            Courts
          </NavLink>

          <NavLink to="/admin/classes" className={({ isActive }) => (isActive ? "active" : "")}>
            Class Management
          </NavLink>

          <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            Bookings
          </NavLink>

          <NavLink to="/admin/payments" className={({ isActive }) => (isActive ? "active" : "")}>
            Payments
          </NavLink>

          <NavLink to="/admin/blocked-slots" className={({ isActive }) => (isActive ? "active" : "")}>
            Blocked Slots
          </NavLink>

          <NavLink to="/admin/enrollments" className={({ isActive }) => (isActive ? "active" : "")}>
            Enrollments
          </NavLink>

          <NavLink to="/admin/attendance" className={({ isActive }) => (isActive ? "active" : "")}>
            Attendance
          </NavLink>

          <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? "active" : "")}>
            Reports
          </NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* TOP BAR */}
        <div className="admin-topbar">
          <strong>Admin Dashboard</strong>

          <div className="topbar-right" ref={profileRef}>
            <button
              type="button"
              className="profile-btn"
              onClick={() => setIsProfileOpen((p) => !p)}
            >
              Profile ▾
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-row">
                  <div className="profile-name">{displayName}</div>
                  <div className="profile-role">{user.role}</div>
                </div>

                <div className="profile-info">
                  <div>
                    <span>Email:</span> {user.email}
                  </div>
                  <div>
                    <span>Phone:</span> {user.phone}
                  </div>
                </div>

                <div className="profile-actions">
                  <button type="button" className="profile-logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
