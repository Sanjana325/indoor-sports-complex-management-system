import { Link, Outlet } from "react-router-dom";

// basic application wrapper providing navigation and top-level structure
export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* sidebar navigation providing quick access to different user modules */}
      <aside
        style={{
          width: "220px",
          background: "#1e1e1e",
          color: "#fff",
          padding: "16px",
        }}
      >
        <h3>ArenaPro</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link to="/admin" style={linkStyle}>Admin Dashboard</Link>
          <Link to="/staff" style={linkStyle}>Staff Dashboard</Link>
          <Link to="/coach" style={linkStyle}>Coach Dashboard</Link>
          <Link to="/player" style={linkStyle}>Player Dashboard</Link>
        </nav>
      </aside>

      {/* main view area where children routes are rendered */}
      <main style={{ flex: 1 }}>
        {/* universal top bar with breadcrumbs and logout action */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong>Dashboard</strong>
          <Link to="/" style={{ textDecoration: "none" }}>Logout</Link>
        </div>

        {/* content area where specific page components appear */}
        <div style={{ padding: "20px" }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}

// reusable CSS properties for sidebar navigation items
const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "8px",
  borderRadius: "6px",
  background: "#333",
};
