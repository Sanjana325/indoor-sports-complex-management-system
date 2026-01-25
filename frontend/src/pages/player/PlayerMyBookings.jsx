import { useMemo, useState } from "react";
import "../../styles/PlayerTables.css";

function pillClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "pt-pill confirmed";
  if (s === "cancelled") return "pt-pill cancelled";
  return "pt-pill pending";
}

function normalizeStatus(s) {
  const v = (s || "").toLowerCase();
  if (v === "confirmed") return "confirmed";
  if (v === "cancelled") return "cancelled";
  return "pending";
}

function isSameOrAfter(a, b) {
  return a.getTime() >= b.getTime();
}

export default function PlayerMyBookings() {
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST | OLDEST
  const [activeTab, setActiveTab] = useState("UPCOMING"); // UPCOMING | PAST | CANCELLED

  const rows = useMemo(
    () => [
      {
        bookingId: "B-700021",
        courtName: "Court A",
        date: "2026-01-28",
        timeDuration: "4:00 PM - 6:00 PM",
        bookingStatus: "Confirmed",
      },
      {
        bookingId: "B-700022",
        courtName: "Court B",
        date: "2026-01-30",
        timeDuration: "10:00 AM - 12:00 PM",
        bookingStatus: "Pending",
      },
      {
        bookingId: "B-700019",
        courtName: "Court C",
        date: "2026-01-10",
        timeDuration: "6:00 PM - 7:30 PM",
        bookingStatus: "Confirmed",
      },
      {
        bookingId: "B-700018",
        courtName: "Badminton - A",
        date: "2025-12-22",
        timeDuration: "9:00 AM - 10:00 AM",
        bookingStatus: "Cancelled",
      },
    ],
    []
  );

  const computed = useMemo(() => {
    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const withMeta = rows.map((r) => {
      const dateObj = new Date(r.date);
      const dateKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const statusKey = normalizeStatus(r.bookingStatus);

      const isCancelled = statusKey === "cancelled";
      const isUpcoming = !isCancelled && isSameOrAfter(dateKey, todayKey);
      const isPast = !isCancelled && dateKey.getTime() < todayKey.getTime();

      return { ...r, _dateKey: dateKey, _statusKey: statusKey, _isUpcoming: isUpcoming, _isPast: isPast, _isCancelled: isCancelled };
    });

    const upcoming = withMeta.filter((x) => x._isUpcoming);
    const past = withMeta.filter((x) => x._isPast);
    const cancelled = withMeta.filter((x) => x._isCancelled);

    function sorter(a, b) {
      const d1 = a._dateKey.getTime();
      const d2 = b._dateKey.getTime();
      return sortOrder === "NEWEST" ? d2 - d1 : d1 - d2;
    }

    return {
      upcoming: upcoming.sort(sorter),
      past: past.sort(sorter),
      cancelled: cancelled.sort(sorter),
      counts: { upcoming: upcoming.length, past: past.length, cancelled: cancelled.length },
    };
  }, [rows, sortOrder]);

  const list =
    activeTab === "UPCOMING"
      ? computed.upcoming
      : activeTab === "PAST"
      ? computed.past
      : computed.cancelled;

  return (
    <div className="pt-page">
      <div className="pt-header">
        <div className="pt-title-wrap">
          <h2 className="pt-title">My Bookings</h2>
          <div className="pt-subtitle">View and track your court bookings</div>
        </div>

        <select className="pt-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="NEWEST">Newest First</option>
          <option value="OLDEST">Oldest First</option>
        </select>
      </div>

      <div className="pt-tabs">
        <button
          type="button"
          className={`pt-tab ${activeTab === "UPCOMING" ? "active" : ""}`}
          onClick={() => setActiveTab("UPCOMING")}
        >
          Upcoming <span className="pt-tab-count">{computed.counts.upcoming}</span>
        </button>

        <button
          type="button"
          className={`pt-tab ${activeTab === "PAST" ? "active" : ""}`}
          onClick={() => setActiveTab("PAST")}
        >
          Past <span className="pt-tab-count">{computed.counts.past}</span>
        </button>

        <button
          type="button"
          className={`pt-tab ${activeTab === "CANCELLED" ? "active" : ""}`}
          onClick={() => setActiveTab("CANCELLED")}
        >
          Cancelled <span className="pt-tab-count">{computed.counts.cancelled}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="pt-empty-card">No bookings to show.</div>
      ) : (
        <div className="pt-cards">
          {list.map((r) => (
            <div key={r.bookingId} className="pt-booking-card">
              <div className="pt-booking-top">
                <div className="pt-booking-main">
                  <div className="pt-booking-court">{r.courtName}</div>
                  <div className="pt-booking-meta">
                    <span className="pt-meta-item">{r.date}</span>
                    <span className="pt-meta-dot">•</span>
                    <span className="pt-meta-item">{r.timeDuration}</span>
                  </div>
                </div>

                <div className="pt-booking-side">
                  <div className="pt-booking-id">#{r.bookingId}</div>
                  <span className={pillClass(r.bookingStatus)}>{r.bookingStatus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
