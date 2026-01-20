import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: "220px",
          background: "#1e1e1e",
          color: "#fff",
          padding: "16px",
        }}
      >
        <h3>Sports Complex</h3>

        <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link to="/admin" style={linkStyle}>Admin Dashboard</Link>
          <Link to="/staff" style={linkStyle}>Staff Dashboard</Link>
          <Link to="/coach" style={linkStyle}>Coach Dashboard</Link>
          <Link to="/player" style={linkStyle}>Player Dashboard</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1 }}>
  {/* TOP BAR */}
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

  {/* PAGE CONTENT */}
  <div style={{ padding: "20px" }}>
    <Outlet />
  </div>
</main>

    </div>
  );
}

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "8px",
  borderRadius: "6px",
  background: "#333",
};
