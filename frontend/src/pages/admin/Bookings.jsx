import { useEffect, useMemo, useState } from "react";
import "../../styles/Bookings.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatBookedDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
}

function formatBookedTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const basePath = role === "STAFF" ? "/api/staff" : "/api/admin";

      const res = await fetch(`${API_BASE}${basePath}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((b) => {
      const matchesText =
        q.length === 0 ||
        `${b.id} ${b.playerName} ${b.court} ${b.date} ${b.time} ${b.status} ${b.createdAt}`
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : b.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  function statusLabel(s) {
    if (s === "PENDING_PAYMENT") return "Pending Payment";
    if (s === "WAITING_VERIFICATION") return "Waiting Verification";
    if (s === "CONFIRMED") return "Confirmed";
    if (s === "CANCELLED") return "Cancelled";
    if (s === "EXPIRED") return "Expired";
    return s;
  }

  async function handleCancel(id, rawId) {
    const role = localStorage.getItem("role");
    if (role === "STAFF") return; // Safety check

    const ok = window.confirm("Cancel this booking? This will safely void the reservation without deleting records.");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/bookings/${rawId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.rawId === rawId ? { ...b, status: "CANCELLED" } : b));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to cancel booking");
      }
    } catch (err) {
      alert("Error contacting the server");
    }
  }

  const role = localStorage.getItem("role");
  const isStaff = role === "STAFF";

  return (
    <div className="bk-page">
      <div className="bk-header">
        <div>
          <h2 className="bk-title">Bookings</h2>
        </div>
      </div>

      <div className="bk-toolbar">
        <input
          className="bk-search"
          placeholder="Search booking id, player, court, date, duration, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="bk-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="WAITING_VERIFICATION">Waiting Verification</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Player Name</th>
              <th>Court</th>
              <th>Session Date</th>
              <th>Duration</th>
              <th>Booked Date</th>
              <th>Booked Time</th>
              <th>Status</th>
              {!isStaff && <th className="bk-center">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
               <tr>
                 <td colSpan="9" className="bk-empty" style={{color: '#888'}}>
                   Loading bookings...
                 </td>
               </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="bk-empty">
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const isCancellable = b.status !== 'CANCELLED' && b.status !== 'EXPIRED';
                
                return (
                  <tr key={b.id}>
                    <td className="bk-mono">{b.id}</td>
                    <td>{b.playerName}</td>
                    <td>{b.court}</td>
                    <td>{b.date}</td>
                    <td>{b.time}</td>
                    <td>{formatBookedDate(b.createdAt)}</td>
                    <td>{formatBookedTime(b.createdAt)}</td>
                    <td>
                      <span className={`bk-badge ${b.status.toLowerCase()}`}>
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    {!isStaff && (
                      <td className="bk-center">
                        {isCancellable ? (
                          <button
                            className="bk-delete-btn"
                            type="button"
                            style={{ backgroundColor: '#ff5252' }}
                            onClick={() => handleCancel(b.id, b.rawId)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: '#aaa' }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
