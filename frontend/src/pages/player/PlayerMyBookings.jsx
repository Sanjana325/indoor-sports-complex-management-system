import { useMemo, useState } from "react";
import "../../styles/PlayerTables.css";

function statusPillClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "pt-pill confirmed";
  return "pt-pill pending";
}

export default function PlayerMyBookings() {
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST | OLDEST

  const rows = useMemo(
    () => [
      {
        courtName: "Court A",
        date: "2025-10-19",
        timeDuration: "4:00 PM - 6:00 PM",
        bookingStatus: "Confirmed",
      },
      {
        courtName: "Court B",
        date: "2025-10-21",
        timeDuration: "10:00 AM - 12:00 PM",
        bookingStatus: "Pending",
      },
      {
        courtName: "Court C",
        date: "2025-09-15",
        timeDuration: "6:00 PM - 7:30 PM",
        bookingStatus: "Confirmed",
      },
    ],
    []
  );

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const d1 = new Date(a.date).getTime();
      const d2 = new Date(b.date).getTime();
      return sortOrder === "NEWEST" ? d2 - d1 : d1 - d2;
    });
  }, [rows, sortOrder]);

  return (
    <div className="pt-page">
      <div className="pt-header">
        <h2 className="pt-title">My Bookings</h2>

        {/* Sort control */}
        <select
          className="pt-sort"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>

      <div className="pt-table-wrap">
        <table className="pt-table">
          <thead>
            <tr>
              <th>Court Name</th>
              <th>Date</th>
              <th>Time Duration</th>
              <th>Booking Status</th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan="4" className="pt-empty">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              sortedRows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.courtName}</td>
                  <td>{r.date}</td>
                  <td>{r.timeDuration}</td>
                  <td>
                    <span className={statusPillClass(r.bookingStatus)}>
                      {r.bookingStatus}
                    </span>
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
