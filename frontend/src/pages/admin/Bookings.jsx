import { useMemo, useState } from "react";
import "../../styles/Bookings.css";

function makeId(prefix = "B") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

export default function Bookings() {
  // UI-only mock bookings (later: fetch from backend)
  const [bookings, setBookings] = useState([
    {
      id: "B-500001",
      playerName: "Kavindi Silva",
      court: "Badminton - A",
      date: "2026-01-22",
      time: "10:00 - 11:00",
      status: "PENDING_PAYMENT",
    },
    {
      id: "B-500002",
      playerName: "Nuwan Perera",
      court: "Cricket - A",
      date: "2026-01-23",
      time: "04:00 PM - 06:00 PM",
      status: "CONFIRMED",
    },
    {
      id: "B-500003",
      playerName: "Sahan Fernando",
      court: "Futsal - A",
      date: "2026-01-23",
      time: "06:00 PM - 07:00 PM",
      status: "CANCELLED",
    },
  ]);

  // Search/filter (optional but useful)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return bookings.filter((b) => {
      const matchesText =
        q.length === 0 ||
        `${b.playerName} ${b.court} ${b.date} ${b.time} ${b.status} ${b.id}`
          .toLowerCase()
          .includes(q);

      const matchesStatus = statusFilter === "ALL" ? true : b.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  function statusLabel(s) {
    if (s === "PENDING_PAYMENT") return "Pending Payment";
    if (s === "CONFIRMED") return "Confirmed";
    if (s === "CANCELLED") return "Cancelled";
    return s;
  }

  function handleDelete(id) {
    const ok = window.confirm("Delete this booking? This action cannot be undone.");
    if (!ok) return;
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  // Optional: quick add fake booking (helps demo)
  function addDemoBooking() {
    const newBooking = {
      id: makeId("B"),
      playerName: "Demo Player",
      court: "Cricket - B",
      date: "2026-01-24",
      time: "02:00 PM - 03:00 PM",
      status: "PENDING_PAYMENT",
    };
    setBookings((prev) => [newBooking, ...prev]);
  }

  return (
    <div className="bk-page">
      <div className="bk-header">
        <div>
          <h2 className="bk-title">Bookings</h2>
          <p className="bk-subtitle">View and manage bookings (delete only in admin UI).</p>
        </div>

        <button className="bk-secondary-btn" type="button" onClick={addDemoBooking}>
          + Add Demo Booking
        </button>
      </div>

      <div className="bk-toolbar">
        <input
          className="bk-search"
          placeholder="Search player, court, date, time, status..."
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
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bk-table-wrap">
        <table className="bk-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Court</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th className="bk-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="bk-empty">
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id}>
                  <td>{b.playerName}</td>
                  <td>{b.court}</td>
                  <td>{b.date}</td>
                  <td>{b.time}</td>
                  <td>
                    <span className={`bk-badge ${b.status.toLowerCase()}`}>
                      {statusLabel(b.status)}
                    </span>
                  </td>
                  <td className="bk-center">
                    <button
                      className="bk-delete-btn"
                      type="button"
                      onClick={() => handleDelete(b.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="bk-hint">
        Note: UI-only. In the real system, booking status updates come from payments and availability rules.
      </p>
    </div>
  );
}
