import { useEffect, useMemo, useState } from "react";
import { 
  History, 
  CheckCircle, 
  PendingActions, 
  Cancel, 
  FilterAlt, 
  Schedule, 
  EventNote,
  CalendarMonth 
} from "@mui/icons-material";
import "../../styles/PlayerTables.css";

// returns the status pill css class based on the booking state
function pillClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "pt-pill confirmed";
  if (s === "cancelled") return "pt-pill cancelled";
  return "pt-pill pending";
}

// standardizes different backend status codes into a common display format
function normalizeStatus(s) {
  const v = (s || "").toLowerCase();
  if (v === "confirmed") return "confirmed";
  if (v === "cancelled" || v === "expired") return "cancelled";
  return "pending";
}

// converts 24-hour timestamps from strings into a readable AM/PM range
function formatTimeRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  
  const formatTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
  };
  
  return `${formatTime(s)} - ${formatTime(e)}`;
}

// abbreviated month names for the date display cards
const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

// detailed timestamp formatter for the booking audit trail
const formatFullTimestamp = (isoString) => {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// management page for players to view their full reservation history and status
export default function PlayerMyBookings() {
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [activeTab, setActiveTab] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // loads the player's primary booking record from the database
  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/player/bookings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.bookings)) {
          const formatted = data.bookings.map(b => {
            const dateObj = new Date(b.StartDateTime);
            const safeDate = dateObj.toISOString().split('T')[0];
            const rawStatus = b.Status || "PENDING";
            
            let displayStatus = "Pending";
            if (rawStatus === 'CONFIRMED') displayStatus = "Confirmed";
            else if (rawStatus === 'CANCELLED') displayStatus = "Cancelled";
            else if (rawStatus === 'EXPIRED') displayStatus = "Expired";
            else if (rawStatus === 'WAITING_VERIFICATION') displayStatus = "Waiting Verification";
            else if (rawStatus === 'PENDING_PAYMENT') displayStatus = "Pending Payment";

            return {
              bookingId: `B-${String(b.BookingID).padStart(6, '0')}`,
              courtName: b.CourtName || "Court",
              date: safeDate,
              day: dateObj.getDate(),
              month: MONTH_NAMES[dateObj.getMonth()],
              timeDuration: formatTimeRange(b.StartDateTime, b.EndDateTime),
              bookingStatus: displayStatus,
              rawStatus: rawStatus,
              rawStartTime: b.StartDateTime,
              createdAt: b.CreatedAt,
              confirmedAt: b.ConfirmedAt
            };
          });
          setRows(formatted);
        }
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  // handles real-time filtering and sorting of the booking list based on user selection
  const computed = useMemo(() => {
    // processes and enriches raw booking data with UI-friendly flags
    const withMeta = rows.map((r) => {
      const dateObj = new Date(r.date);
      const dateKey = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      const isConfirmed = r.rawStatus === 'CONFIRMED';
      // treats both manual verification and unpaid state as 'Pending' in the UI
      const isPending = r.rawStatus === 'WAITING_VERIFICATION' || r.rawStatus === 'PENDING_PAYMENT';
      const isCancelled = r.rawStatus === 'CANCELLED' || r.rawStatus === 'EXPIRED';

      return { 
        ...r, 
        _dateKey: dateKey,
        _createdAtKey: new Date(r.createdAt),
        _isConfirmed: isConfirmed, 
        _isPending: isPending, 
        _isCancelled: isCancelled 
      };
    });

    const confirmed = withMeta.filter((x) => x._isConfirmed);
    const pending = withMeta.filter((x) => x._isPending);
    const cancelled = withMeta.filter((x) => x._isCancelled);

    function sorter(a, b) {
      const t1 = a._createdAtKey.getTime();
      const t2 = b._createdAtKey.getTime();
      return sortOrder === "NEWEST" ? t2 - t1 : t1 - t2;
    }

    return {
      all: [...withMeta].sort(sorter),
      confirmed: confirmed.sort(sorter),
      pending: pending.sort(sorter),
      cancelled: cancelled.sort(sorter),
      counts: { 
        all: withMeta.length, 
        confirmed: confirmed.length, 
        pending: pending.length, 
        cancelled: cancelled.length 
      },
    };
  }, [rows, sortOrder]);

  const list =
    activeTab === "ALL"
      ? computed.all
      : activeTab === "CONFIRMED"
      ? computed.confirmed
      : activeTab === "PENDING"
      ? computed.pending
      : computed.cancelled;

  return (
    <div className="pt-page">
      <div className="pt-container">
        {/* header section containing the search sort controls */}
        <header className="pt-header">
          <div className="pt-header-content">
            <h1 className="pt-title">My Bookings</h1>
            <p className="pt-subtitle">
              Track and manage your sessions at ArenaPro. 
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '4px', opacity: 0.8, color: 'var(--pt-primary)' }}>
                <Schedule sx={{ fontSize: '0.85rem', verticalAlign: 'middle', mr: 0.5 }} />
                Unpaid bookings expire after 10 minutes.
              </span>
            </p>
          </div>

          <div className="pt-sort-wrapper">
            <FilterAlt className="pt-sort-icon" />
            <select className="pt-sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </header>

        {/* top navigation tabs for filtering by specific reservation states */}
        <div className="pt-tabs">
          <button
            type="button"
            className={`pt-tab ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            <History className="pt-tab-icon" />
            All 
            <span className="pt-tab-count">{computed.counts.all}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "CONFIRMED" ? "active" : ""}`}
            onClick={() => setActiveTab("CONFIRMED")}
          >
            <CheckCircle className="pt-tab-icon" />
            Confirmed 
            <span className="pt-tab-count">{computed.counts.confirmed}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
          >
            <PendingActions className="pt-tab-icon" />
            Pending 
            <span className="pt-tab-count">{computed.counts.pending}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "CANCELLED" ? "active" : ""}`}
            onClick={() => setActiveTab("CANCELLED")}
          >
            <Cancel className="pt-tab-icon" />
            Cancelled 
            <span className="pt-tab-count">{computed.counts.cancelled}</span>
          </button>
        </div>

        {/* main display area showing individual booking card details */}
        {loading ? (
          <div className="pt-loading-indicator">Loading your bookings...</div>
        ) : list.length === 0 ? (
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
                <div className="pt-date-block">
                  <div className="pt-date-month">{r.month}</div>
                  <div className="pt-date-day">{r.day}</div>
                </div>

                <div className="pt-booking-main">
                  <div className="pt-booking-header-row">
                    <h3 className="pt-booking-court">{r.courtName}</h3>
                    <span className={pillClass(r.bookingStatus)}>{r.bookingStatus}</span>
                  </div>

                  <div className="pt-booking-meta">
                    <div className="pt-meta-group">
                      <CalendarMonth sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <span>{r.date}</span>
                    </div>
                    <div className="pt-meta-group">
                      <Schedule sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <span>{r.timeDuration}</span>
                    </div>
                    <div className="pt-meta-group">
                      <EventNote sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <span className="pt-booking-id">#{r.bookingId}</span>
                    </div>
                  </div>

                  {/* detailed audit log section showing registration and confirmation dates */}
                  <div className="pt-booking-timestamps" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    <div className="pt-meta-group" style={{ opacity: 0.7 }}>
                      <Schedule sx={{ fontSize: '0.85rem' }} />
                      <span style={{ fontSize: '0.75rem' }}>Booked on {formatFullTimestamp(r.createdAt)}</span>
                    </div>
                    {r.confirmedAt && r.rawStatus === 'CONFIRMED' && (
                      <div className="pt-meta-group" style={{ opacity: 0.9, color: '#16a34a', marginTop: '4px' }}>
                        <CheckCircle sx={{ fontSize: '0.85rem' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Confirmed on {formatFullTimestamp(r.confirmedAt)}</span>
                      </div>
                    )}
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