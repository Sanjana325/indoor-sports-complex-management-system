import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdminLayout.css"; // ✅ reuse same layout styles

function getInitials(firstName = "", lastName = "") {
  const a = (firstName || "").trim().charAt(0).toUpperCase();
  const b = (lastName || "").trim().charAt(0).toUpperCase();
  return (a + b) || "U";
}

export default function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ User from localStorage (same pattern)
  const user = useMemo(() => {
    const firstName = localStorage.getItem("firstName") || "Staff";
    const lastName = localStorage.getItem("lastName") || "";
    const role = localStorage.getItem("role") || "STAFF";
    const email = localStorage.getItem("email") || "staff@sports.com";
    const phone = localStorage.getItem("phone") || "07XXXXXXXX";

    const qualifications = localStorage.getItem("qualifications") || "";
    const specialization = localStorage.getItem("specialization") || "";

    return { firstName, lastName, role, email, phone, qualifications, specialization };
  }, []);

  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(user.firstName, user.lastName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    // Close dropdowns on route change
    setIsProfileOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [recentCancellations, setRecentCancellations] = useState([]);

  useEffect(() => {
    const fetchCountsAndFeeds = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch Payments
        fetch("http://localhost:5000/api/admin/payments/pending-count", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if(data) setPendingPaymentsCount(data.count); })
        .catch(e => console.error("Failed to fetch pending count", e));

        // Fetch Recent Cancellations
        fetch("http://localhost:5000/api/staff/classes/recent-cancellations", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if(data) setRecentCancellations(data.cancellations); })
        .catch(e => console.error("Failed to fetch cancellations", e));

      } catch (e) { console.error(e); }
    };
    fetchCountsAndFeeds();
    const interval = setInterval(fetchCountsAndFeeds, 30000); // 30 sec poll
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/staff/classes/cancel-alert/${sessionId}/acknowledge`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRecentCancellations(prev => prev.filter(c => c.id !== sessionId));
      }
    } catch (e) { console.error("Error acknowledging notification", e); }
  };

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
        <h2 className="sidebar-title">ArenaPro</h2>

        <nav className="sidebar-nav">
          <NavLink to="/staff" end className={({ isActive }) => (isActive ? "active" : "")}>
            Calendar
          </NavLink>

          <NavLink to="/staff/attendance" className={({ isActive }) => (isActive ? "active" : "")}>
            Attendance
          </NavLink>

          <NavLink to="/staff/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            Bookings
          </NavLink>

          <NavLink to="/staff/payments" className={({ isActive }) => (isActive ? "active" : "")}>
            <span>Payments</span>
            {pendingPaymentsCount > 0 && <span className="sidebar-badge">{pendingPaymentsCount}</span>}
          </NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        {/* TOP BAR */}
        <div className="admin-topbar">
          <strong>ArenaPro - Staff Dashboard</strong>

          <div style={{display: 'flex', alignItems: 'center'}}>
            <div className="notification-bell-container" ref={notifRef}>
              <button 
                className="bell-trigger" 
                onClick={() => setIsNotifOpen(p => !p)}
                title="Recent Cancellations"
              >
                🔔
                {recentCancellations.length > 0 && <span className="bell-badge">{recentCancellations.length}</span>}
              </button>

              {isNotifOpen && (
                <div className="notification-menu">
                  <div className="notification-menu-head">Recent Cancellations</div>
                  <div className="notification-list">
                    {recentCancellations.length === 0 ? (
                      <div className="notification-item empty">No recent cancellations.</div>
                    ) : (
                      recentCancellations.map(c => (
                        <div key={c.id} className="notification-item">
                          <button className="notification-dismiss-btn" onClick={() => handleAcknowledge(c.id)} title="Mark as Read">&times;</button>
                          <span className="notification-title">[CANCELLED] {c.className}</span>
                          <span className="notification-desc">Coach: {c.coachFirst} {c.coachLast} • {c.startTime}-{c.endTime}</span>
                          <span className="notification-date">{c.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: '8px 0', textAlign: 'center', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <Link to="/staff" onClick={() => setIsNotifOpen(false)} style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                      Go to Calendar &rarr;
                    </Link>
                  </div>
                </div>
              )}
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
                  <Link className="profile-menu-item" to="/staff/profile" role="menuitem">
                    My Profile
                  </Link>

                  <Link className="profile-menu-item" to="/staff/settings" role="menuitem">
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
        </div>

        {/* PAGE CONTENT */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
