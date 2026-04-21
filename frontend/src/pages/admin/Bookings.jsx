import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatBookedDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return Number.isNaN(d.getTime()) ? "-" : d.toISOString().slice(0, 10);
}

function formatBookedTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const res = await fetch(`${API_BASE}${role === "STAFF" ? "/api/staff" : "/api/admin"}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(true); setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visibleStatuses = ["WAITING_VERIFICATION", "CONFIRMED", "CANCELLED"];
    
    return bookings.filter(b => {
      // Base filtration: exclude EXPIRED and PENDING_PAYMENT unless specifically selected (which they won't be from the filtered list)
      if (!visibleStatuses.includes(b.status) && statusFilter === "ALL") return false;
      
      const matchesText = !q || `${b.id} ${b.playerName} ${b.court} ${b.date} ${b.time} ${b.status}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const handleCancel = async (rawId) => {
    if (!window.confirm("Safe void this reservation? (Records remain preserved)")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/bookings/${rawId}/cancel`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchBookings();
      else alert("Failed to cancel booking");
    } catch (e) { alert("Server error"); }
  };

  const isStaff = localStorage.getItem("role") === "STAFF";

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Bookings</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>View and manage court reservations</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchBookings}>Sync Data</button>
      </div>

      <div className="arena-card mb-3" style={{ padding: "var(--space-1)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
        <input className="form-input" style={{ maxWidth: "400px" }} placeholder="Filter by ID, player, court..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ maxWidth: "200px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Active Statuses</option>
          <option value="WAITING_VERIFICATION">Waiting Verification</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="arena-table-container">
        <table className="arena-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Player & Details</th>
              <th>Arena & Sport</th>
              <th>Session</th>
              <th>Created</th>
              <th>Payment ID</th>
              <th>Method</th>
              <th>Status</th>
              {!isStaff && <th style={{ textAlign: "right" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: "2rem" }}>Synchronizing Archive...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: "2rem" }}>No matching records found.</td></tr>
            ) : (
              filtered.map(b => (
                <tr key={b.id}>
                  <td><span className="table-id">{b.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{b.playerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{b.playerEmail}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.court}</div>
                    <span className="status-pill info" style={{ padding: "2px 8px", fontSize: "0.65rem", textTransform: "uppercase", marginTop: "4px", display: "inline-block" }}>
                      {b.sportName || "BOOKING"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{b.date}</div>
                    <div style={{ fontSize: "0.75rem" }}>{b.time}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.8rem" }}>{formatBookedDate(b.createdAt)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatBookedTime(b.createdAt)}</div>
                  </td>
                  <td>
                     {b.paymentId !== "-" ? (
                        <span className="table-id" style={{ opacity: 0.8, fontSize: '0.75rem' }}>{b.paymentId}</span>
                     ) : "-"}
                   </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {b.paymentMethod !== "-" ? (
                      <span className="status-pill" style={{ background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.7rem" }}>
                        {b.paymentMethod}
                      </span>
                    ) : "-"}
                  </td>
                  <td>
                    <span className={`status-pill ${b.status.toLowerCase()}`}>
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  {!isStaff && (
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        {b.status !== "CANCELLED" && b.status !== "EXPIRED" ? (
                          <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleCancel(b.rawId)}>Cancel</button>
                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>-</span>}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
