import { Link, Outlet } from "react-router-dom";
import "../styles/AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h3 className="sidebar-title">Admin Panel</h3>

        <nav className="sidebar-nav">
          <Link to="/admin">Home</Link>
          <Link to="/admin/users">User Management</Link>
          <Link to="/admin/courts">Courts</Link>
          <Link to="/admin/classes">Class Management</Link>
          <Link to="/admin/bookings">Bookings</Link>
          <Link to="/admin/payments">Payments</Link>
          <Link to="/admin/blocked-slots">Blocked Slots</Link>
          <Link to="/admin/enrollments">Enrollments</Link>
          <Link to="/admin/attendance">Attendance</Link>
          <Link to="/admin/reports">Reports</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="admin-main">
        <header className="admin-topbar">
          <strong>Admin Dashboard</strong>
          <Link to="/" className="logout-link">Logout</Link>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
