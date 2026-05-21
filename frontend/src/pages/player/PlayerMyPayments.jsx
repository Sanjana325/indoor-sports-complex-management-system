import { useEffect, useMemo, useState } from "react";
import { 
  History, 
  Payments, 
  Search, 
  FilterAlt, 
  CreditCard, 
  ReceiptLong, 
  CloudUpload, 
  Visibility,
  School,
  SportsTennis,
  AccessTime
} from "@mui/icons-material";
import playerService from "../../services/playerService";
import { formatLKR, normalizeStatusKey } from "../../utils/formatters";
import "../../styles/PlayerTables.css";

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// utility for date-based sorting of the payment cards
function sortByDate(rows, sortOrder) {
  return [...rows].sort((a, b) => {
    const d1 = new Date(a.date).getTime();
    const d2 = new Date(b.date).getTime();
    return sortOrder === "NEWEST" ? d2 - d1 : d1 - d2;
  });
}

// client-side filtering logic for the transaction search bar
function matchesQuery(row, q, type) {
  if (!q) return true;
  const base =
    type === "COURT"
      ? `${row.paymentId} ${row.date} ${row.method} ${row.status} ${row.amount}`
      : `${row.paymentId} ${row.date} ${row.method} ${row.status} ${row.amount} ${row.className || ""}`;

  return base.toLowerCase().includes(q);
}

// transactional history page for players to track court and class payments
export default function PlayerMyPayments() {
  const [activeTab, setActiveTab] = useState("COURT");
  const [courtSort, setCourtSort] = useState("NEWEST");
  const [classSort, setClassSort] = useState("NEWEST");
  const [courtQuery, setCourtQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");
  const [courtStatus, setCourtStatus] = useState("ALL");
  const [classStatus, setClassStatus] = useState("ALL");
  const [courtPayments, setCourtPayments] = useState([]);
  const [classPayments, setClassPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // retrieves all historical transactions for the logged-in player
  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        const data = await playerService.getMyPayments();
        
        if (Array.isArray(data.payments)) {
          const formatted = data.payments.map((p) => {
            const rawStatus = p?.Status || "";
            const safeKey = normalizeStatusKey(rawStatus);
            const safeStatus = safeKey.charAt(0) + safeKey.slice(1).toLowerCase();
            
            const rawDate = p?.PaidAt || p?.VerifiedAt || p?.CreatedAt || null;
            let dateObj = rawDate ? new Date(rawDate) : null;
            if (!dateObj || isNaN(dateObj.getTime())) {
              dateObj = new Date(); 
            }

            return {
              paymentId: `PAY-${p?.PaymentID || 'Unknown'}`,
              date: dateObj.toISOString().split('T')[0],
              day: dateObj.getDate().toString().padStart(2, '0'),
              month: MONTH_NAMES[dateObj.getMonth()],
              amount: Number(p?.Amount || 0),
              method: p?.Method === "BANK_SLIP" ? "Bank Slip" : "Online",
              status: safeStatus,
              statusKey: safeKey,
              slipUploaded: p?.Method === "BANK_SLIP" && !!p?.SlipPath,
              slipPath: p?.SlipPath || null,
              rawBookingId: p?.BookingID || null,
              className: p?.ClassTitle || null,
              type: p?.ClassTitle ? "CLASS" : "COURT",
              paidAtFull: p?.PaidAt ? new Date(p.PaidAt).toLocaleString() : "Pending"
            };
          });
          setCourtPayments(formatted.filter(p => p.type === "COURT"));
          setClassPayments(formatted.filter(p => p.type === "CLASS"));
        }
      } catch (err) {
        console.error("Failed to load payments", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const courtCounts = useMemo(() => {
    const counts = { ALL: courtPayments.length, PENDING: 0, COMPLETED: 0, CANCELLED: 0 };
    courtPayments.forEach((p) => {
      const k = p.statusKey;
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [courtPayments]);

  const classCounts = useMemo(() => {
    const counts = { ALL: classPayments.length, PENDING: 0, COMPLETED: 0, CANCELLED: 0 };
    classPayments.forEach((p) => {
      const k = p.statusKey;
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [classPayments]);

  const visibleCourt = useMemo(() => {
    const q = courtQuery.trim().toLowerCase();
    let rows = sortByDate(courtPayments, courtSort);
    if (courtStatus !== "ALL") rows = rows.filter((r) => r.statusKey === courtStatus);
    rows = rows.filter((r) => matchesQuery(r, q, "COURT"));
    return rows;
  }, [courtPayments, courtSort, courtQuery, courtStatus]);

  const visibleClass = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    let rows = sortByDate(classPayments, classSort);
    if (classStatus !== "ALL") rows = rows.filter((r) => r.statusKey === classStatus);
    rows = rows.filter((r) => matchesQuery(r, q, "CLASS"));
    return rows;
  }, [classPayments, classSort, classQuery, classStatus]);

  function handleUploadSlip(paymentId, type) {
    alert(`Upload bank slip for ${paymentId} (Action is pending integration)`);
  }

  function handleViewSlip(slipPath) {
    if (slipPath) window.open(slipPath, '_blank');
    else alert("Slip not available.");
  }

  const isCourt = activeTab === "COURT";
  const currentList = isCourt ? visibleCourt : visibleClass;
  const currentQuery = isCourt ? courtQuery : classQuery;
  const setQuery = isCourt ? setCourtQuery : setClassQuery;
  const currentSort = isCourt ? courtSort : classSort;
  const setSort = isCourt ? setCourtSort : setClassSort;
  const currentStatus = isCourt ? courtStatus : classStatus;
  const handleStatusChange = (val) => isCourt ? setCourtStatus(val) : setClassStatus(val);
  const currentCounts = isCourt ? courtCounts : classCounts;

  return (
    <div className="pt-page">
      <div className="pt-container">
        {/* page title header for the ledger view */}
        <header className="pt-header">
          <div className="pt-header-content">
            <h1 className="pt-title">My Payments</h1>
            <p className="pt-subtitle">Manage your transactions and track payment status</p>
          </div>
        </header>

        {/* category tabs separating court rentals from training classes */}
        <div className="pt-tabs">
          <button
            type="button"
            className={`pt-tab ${activeTab === "COURT" ? "active" : ""}`}
            onClick={() => setActiveTab("COURT")}
          >
            <SportsTennis className="pt-tab-icon" />
            Court Bookings 
            <span className="pt-tab-count">{courtCounts.ALL}</span>
          </button>

          <button
            type="button"
            className={`pt-tab ${activeTab === "CLASS" ? "active" : ""}`}
            onClick={() => setActiveTab("CLASS")}
          >
            <School className="pt-tab-icon" />
            Classes 
            <span className="pt-tab-count">{classCounts.ALL}</span>
          </button>
        </div>

        {/* dashboard controls for searching, filtering by status, and date sorting */}
        <div className="pt-controls-row">
          <div className="pt-search-wrapper">
            <Search className="pt-search-icon" />
            <input
              className="pt-search"
              placeholder={`Search ${isCourt ? 'court' : 'class'} payments...`}
              value={currentQuery}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="pt-chips">
            {["ALL", "PENDING", "COMPLETED", "CANCELLED"].map((k) => (
              <button
                key={k}
                type="button"
                className={`pt-chip ${currentStatus === k ? "active" : ""}`}
                onClick={() => handleStatusChange(k)}
              >
                {k.charAt(0) + k.slice(1).toLowerCase()}
                <span className="pt-chip-count">{currentCounts[k] || 0}</span>
              </button>
            ))}
          </div>

          <div className="pt-sort-wrapper">
            <FilterAlt className="pt-sort-icon" />
            <select className="pt-sort" value={currentSort} onChange={(e) => setSort(e.target.value)}>
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* renders formatted payment cards with status indicators and details */}
        {loading ? (
          <div className="pt-loading-indicator">Retrieving transactions...</div>
        ) : currentList.length === 0 ? (
          <div className="pt-empty-state">
            <ReceiptLong className="pt-empty-icon" style={{ fontSize: '4rem' }} />
            <h3 className="pt-empty-title">No transactions found</h3>
            <p className="pt-empty-text">Your payment history for this category is currently empty.</p>
          </div>
        ) : (
          /* grid of detailed transaction history cards */
          <div className="pt-cards">
            {currentList.map((p) => {
              const sk = p.statusKey;
              const canSlip = p.method === "Bank Slip";
              const showUpload = canSlip && sk === "PENDING" && !p.slipUploaded;
              const showView = canSlip && p.slipUploaded;

              return (
                <div key={p.paymentId} className="pt-booking-card">
                  <div className="pt-date-block">
                    <div className="pt-date-month">{p.month}</div>
                    <div className="pt-date-day">{p.day}</div>
                  </div>

                  <div className="pt-booking-main">
                    <div className="pt-booking-header-row" style={{ alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="pt-booking-id" style={{ fontWeight: 800 }}>#{p.paymentId}</span>
                        <h3 className="pt-booking-court" style={{ fontSize: '1.75rem', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {formatLKR(p.amount)}
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className={`pt-pill ${sk.toLowerCase() === "completed" ? "confirmed" : sk.toLowerCase() === "cancelled" ? "cancelled" : "pending"}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-booking-meta" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                      gap: '1.25rem', 
                      marginTop: '1.25rem',
                      background: 'rgba(0,0,0,0.015)',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1px solid rgba(0,0,0,0.025)'
                    }}>
                      <div className="pt-meta-group" style={{ gap: '12px' }}>
                        <CreditCard sx={{ fontSize: '1.1rem', color: 'var(--pt-primary)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Method</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--pt-navy)', fontWeight: 700 }}>{p.method}</span>
                        </div>
                      </div>

                      <div className="pt-meta-group" style={{ gap: '12px' }}>
                        <AccessTime sx={{ fontSize: '1.1rem', color: 'var(--pt-primary)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Paid At</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--pt-navy)', fontWeight: 700 }}>{p.paidAtFull}</span>
                        </div>
                      </div>

                      <div className="pt-meta-group" style={{ gap: '12px' }}>
                        {isCourt ? <SportsTennis sx={{ fontSize: '1.1rem', color: 'var(--pt-primary)' }} /> : <School sx={{ fontSize: '1.1rem', color: 'var(--pt-primary)' }} />}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{isCourt ? 'Booking Info' : 'Class Title'}</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--pt-navy)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                             {isCourt ? `Ref: BD-${p.rawBookingId || 'N/A'}` : p.className}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* allows viewing uploaded receipts for manual bank-transfer payments */}
                    <div style={{ 
                      marginTop: '1rem', 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {showUpload && (
                        <button
                          className="pt-tab active"
                          style={{ padding: '8px 18px', fontSize: '0.8rem', background: 'var(--pt-primary)', color: 'white' }}
                          onClick={() => handleUploadSlip(p.paymentId, isCourt ? "COURT" : "CLASS")}
                        >
                          <CloudUpload sx={{ fontSize: '1rem', mr: 1 }} />
                          Upload Slip
                        </button>
                      )}
                      {showView && (
                        <button 
                         className="pt-tab active"
                         style={{ 
                            padding: '8px 18px', 
                            fontSize: '0.8rem', 
                            background: '#f1f5f9', 
                            color: 'var(--pt-navy)', 
                            boxShadow: 'none',
                            border: '1px solid #e2e8f0'
                         }}
                         onClick={() => handleViewSlip(p.slipPath)}
                        >
                          <Visibility sx={{ fontSize: '1rem', mr: 1 }} />
                          View Slip
                        </button>
                      )}
                      {!canSlip && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--pt-success)', fontSize: '0.75rem', fontWeight: 800 }}>
                           <Visibility sx={{ fontSize: '0.9rem' }} />
                           Electronic Verification Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}