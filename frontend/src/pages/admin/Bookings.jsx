import { useMemo, useState } from "react";
import "../../styles/Bookings.css";

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
  const [bookings, setBookings] = useState([
    {
      id: "B-500001",
      playerName: "Kavindi Silva",
      court: "Badminton - A",
      date: "2026-01-22",
      time: "10:00 - 11:00",
      createdAt: "2026-01-21T14:25:00",
      status: "PENDING_PAYMENT",
    },
    {
      id: "B-500002",
      playerName: "Nuwan Perera",
      court: "Cricket - A",
      date: "2026-01-23",
      time: "16:00 - 18:00",
      createdAt: "2026-01-22T09:10:00",
      status: "CONFIRMED",
    },
    {
      id: "B-500003",
      playerName: "Sahan Fernando",
      court: "Futsal - A",
      date: "2026-01-23",
      time: "18:00 - 19:00",
      createdAt: "2026-01-22T18:40:00",
      status: "CANCELLED",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    if (s === "CONFIRMED") return "Confirmed";
    if (s === "CANCELLED") return "Cancelled";
    return s;
  }

  function handleDelete(id) {
    const ok = window.confirm("Delete this booking? This action cannot be undone.");
    if (!ok) return;
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

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
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
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
              <th className="bk-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="bk-empty">
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
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
    </div>
  );
}
