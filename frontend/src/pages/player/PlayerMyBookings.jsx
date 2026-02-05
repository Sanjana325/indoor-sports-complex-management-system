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
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [activeTab, setActiveTab] = useState("UPCOMING");

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
      <div className="pt-container">
        <header className="pt-header">
          <div className="pt-header-content">
            <h1 className="pt-title">My Bookings</h1>
            <p className="pt-subtitle">View and track your court bookings</p>
          </div>

          <div className="pt-sort-wrapper">
            <svg className="pt-sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10m-7 6h4"/>
            </svg>
            <select className="pt-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </header>

        <div className="pt-tabs">
          <button
            type="button"
            className={`pt-tab ${activeTab === "UPCOMING" ? "active" : ""}`}
            onClick={() => setActiveTab("UPCOMING")}
          >
            <svg className="pt-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
            </svg>
            Upcoming 
            <span className="pt-tab-count">{computed.counts.upcoming}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "PAST" ? "active" : ""}`}
            onClick={() => setActiveTab("PAST")}
          >
            <svg className="pt-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
            Past 
            <span className="pt-tab-count">{computed.counts.past}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "CANCELLED" ? "active" : ""}`}
            onClick={() => setActiveTab("CANCELLED")}
          >
            <svg className="pt-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Cancelled 
            <span className="pt-tab-count">{computed.counts.cancelled}</span>
          </button>
        </div>

        {list.length === 0 ? (
          <div className="pt-empty-state">
            <svg className="pt-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2v4m6-4v4M4 11h16M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <path d="M8 16h.01M12 16h.01M16 16h.01"/>
            </svg>
            <h3 className="pt-empty-title">No bookings found</h3>
            <p className="pt-empty-text">You don't have any {activeTab.toLowerCase()} bookings at the moment.</p>
          </div>
        ) : (
          <div className="pt-cards">
            {list.map((r) => (
              <div key={r.bookingId} className="pt-booking-card">
                <div className="pt-booking-header">
                  <div className="pt-booking-main">
                    <h3 className="pt-booking-court">{r.courtName}</h3>
                    <div className="pt-booking-meta">
                      <svg className="pt-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span className="pt-meta-item">{r.date}</span>
                      <span className="pt-meta-dot">•</span>
                      <svg className="pt-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
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
    </div>
  );
}