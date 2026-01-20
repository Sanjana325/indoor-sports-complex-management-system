import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: "220px", background: "#222", color: "#fff", padding: "16px" }}>
        <h3>Sports Complex</h3>
        <nav>
          <p>Dashboard</p>
          <p>Bookings</p>
          <p>Payments</p>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
}
