import { useMemo, useState } from "react";
import "../../styles/PlayerPaymentsTabs.css";

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

function statusKey(status) {
  const s = (status || "").toLowerCase().trim();
  if (s === "verified") return "VERIFIED";
  if (s === "completed") return "COMPLETED";
  if (s === "cancelled") return "CANCELLED";
  return "PENDING";
}

function statusLabel(key) {
  if (key === "PENDING") return "Pending";
  if (key === "VERIFIED") return "Verified";
  if (key === "COMPLETED") return "Completed";
  if (key === "CANCELLED") return "Cancelled";
  return key;
}

function statusPillClass(key) {
  const k = (key || "").toLowerCase();
  if (k === "verified" || k === "completed") return "pp-pill verified";
  if (k === "cancelled") return "pp-pill cancelled";
  return "pp-pill pending";
}

function sortByDate(rows, sortOrder) {
  return [...rows].sort((a, b) => {
    const d1 = new Date(a.date).getTime();
    const d2 = new Date(b.date).getTime();
    return sortOrder === "NEWEST" ? d2 - d1 : d1 - d2;
  });
}

function matchesQuery(row, q, type) {
  if (!q) return true;
  const base =
    type === "COURT"
      ? `${row.paymentId} ${row.date} ${row.method} ${row.status} ${row.amount}`
      : `${row.paymentId} ${row.date} ${row.method} ${row.status} ${row.amount} ${row.className || ""}`;

  return base.toLowerCase().includes(q);
}

export default function PlayerMyPayments() {
  const [activeTab, setActiveTab] = useState("COURT");

  const [courtSort, setCourtSort] = useState("NEWEST");
  const [classSort, setClassSort] = useState("NEWEST");

  const [courtQuery, setCourtQuery] = useState("");
  const [classQuery, setClassQuery] = useState("");

  const [courtStatus, setCourtStatus] = useState("ALL");
  const [classStatus, setClassStatus] = useState("ALL");

  const [courtPayments, setCourtPayments] = useState([
    {
      paymentId: "CP-900002",
      date: "2025-10-21",
      amount: 4500,
      method: "Bank Slip",
      status: "Pending",
      slipUploaded: false,
    },
    {
      paymentId: "CP-900001",
      date: "2025-10-19",
      amount: 5000,
      method: "Online",
      status: "Verified",
      slipUploaded: true,
    },
  ]);

  const [classPayments, setClassPayments] = useState([
    {
      paymentId: "CLP-800004",
      date: "2025-10-22",
      amount: 2000,
      method: "Bank Slip",
      status: "Pending",
      className: "Badminton Drills",
      slipUploaded: false,
    },
    {
      paymentId: "CLP-800003",
      date: "2025-10-20",
      amount: 2500,
      method: "Online",
      status: "Verified",
      className: "Beginner Cricket",
      slipUploaded: true,
    },
  ]);

  const courtCounts = useMemo(() => {
    const counts = { ALL: courtPayments.length, PENDING: 0, VERIFIED: 0, COMPLETED: 0, CANCELLED: 0 };
    courtPayments.forEach((p) => {
      const k = statusKey(p.status);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [courtPayments]);

  const classCounts = useMemo(() => {
    const counts = { ALL: classPayments.length, PENDING: 0, VERIFIED: 0, COMPLETED: 0, CANCELLED: 0 };
    classPayments.forEach((p) => {
      const k = statusKey(p.status);
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [classPayments]);

  const visibleCourt = useMemo(() => {
    const q = courtQuery.trim().toLowerCase();
    let rows = sortByDate(courtPayments, courtSort);

    if (courtStatus !== "ALL") {
      rows = rows.filter((r) => statusKey(r.status) === courtStatus);
    }

    rows = rows.filter((r) => matchesQuery(r, q, "COURT"));
    return rows;
  }, [courtPayments, courtSort, courtQuery, courtStatus]);

  const visibleClass = useMemo(() => {
    const q = classQuery.trim().toLowerCase();
    let rows = sortByDate(classPayments, classSort);

    if (classStatus !== "ALL") {
      rows = rows.filter((r) => statusKey(r.status) === classStatus);
    }

    rows = rows.filter((r) => matchesQuery(r, q, "CLASS"));
    return rows;
  }, [classPayments, classSort, classQuery, classStatus]);

  function handleUploadSlip(paymentId, type) {
    alert(`Upload bank slip for ${paymentId} (UI-only for now)`);

    if (type === "COURT") {
      setCourtPayments((prev) =>
        prev.map((p) => (p.paymentId === paymentId ? { ...p, slipUploaded: true } : p))
      );
      return;
    }

    setClassPayments((prev) =>
      prev.map((p) => (p.paymentId === paymentId ? { ...p, slipUploaded: true } : p))
    );
  }

  function handleViewSlip(paymentId) {
    alert(`View slip for ${paymentId} (UI-only for now)`);
  }

  function StatusChips({ value, onChange, counts }) {
    const items = ["ALL", "PENDING", "VERIFIED", "COMPLETED", "CANCELLED"];
    return (
      <div className="pp-chips">
        {items.map((k) => (
          <button
            key={k}
            type="button"
            className={`pp-chip ${value === k ? "is-active" : ""}`}
            onClick={() => onChange(k)}
          >
            {k === "ALL" ? "All" : statusLabel(k)}
            <span className="pp-chip-count">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="pp-page">
      <div className="pp-header">
        <h2 className="pp-title">My Payments</h2>
      </div>

      <div className="pp-tabs">
        <button
          type="button"
          className={`pp-tab ${activeTab === "COURT" ? "is-active" : ""}`}
          onClick={() => setActiveTab("COURT")}
        >
          Court Booking <span className="pp-count">{courtCounts.ALL}</span>
        </button>

        <button
          type="button"
          className={`pp-tab ${activeTab === "CLASS" ? "is-active" : ""}`}
          onClick={() => setActiveTab("CLASS")}
        >
          Classes <span className="pp-count">{classCounts.ALL}</span>
        </button>
      </div>

      <div className="pp-panel">
        {activeTab === "COURT" ? (
          <>
            <div className="pp-panel-head">
              <div className="pp-panel-title">
                <h3>Court Booking Payments</h3>
                <div className="pp-sub">Search, filter and upload slips for bank transfers</div>
              </div>

              <div className="pp-controls">
                <div className="pp-search-wrap">
                  <input
                    className="pp-search"
                    placeholder="Search by ID, date, method, amount..."
                    value={courtQuery}
                    onChange={(e) => setCourtQuery(e.target.value)}
                  />
                </div>

                <select className="pp-sort" value={courtSort} onChange={(e) => setCourtSort(e.target.value)}>
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>

            <StatusChips value={courtStatus} onChange={setCourtStatus} counts={courtCounts} />

            {visibleCourt.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-title">No payments found</div>
                <div className="pp-empty-sub">Try changing filters or searching a different keyword.</div>
              </div>
            ) : (
              <div className="pp-list">
                {visibleCourt.map((p) => {
                  const sk = statusKey(p.status);
                  const canSlip = p.method === "Bank Slip";
                  const showUpload = canSlip && sk === "PENDING";
                  const showView = canSlip && p.slipUploaded;

                  return (
                    <div key={p.paymentId} className="pp-item">
                      <div className="pp-item-left">
                        <div className="pp-id">{p.paymentId}</div>
                        <div className="pp-date">{p.date}</div>
                        <div className="pp-method">{p.method}</div>
                      </div>

                      <div className="pp-item-mid">
                        <div className="pp-amount">{formatLKR(p.amount)}</div>
                        <div className="pp-mini">
                          <span className={statusPillClass(sk)}>{statusLabel(sk)}</span>
                        </div>
                      </div>

                      <div className="pp-item-right">
                        {showUpload ? (
                          <button
                            className="pp-slip-btn"
                            type="button"
                            onClick={() => handleUploadSlip(p.paymentId, "COURT")}
                          >
                            Upload Slip
                          </button>
                        ) : showView ? (
                          <button className="pp-link" type="button" onClick={() => handleViewSlip(p.paymentId)}>
                            View Slip
                          </button>
                        ) : (
                          <span className="pp-muted">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="pp-panel-head">
              <div className="pp-panel-title">
                <h3>Class Payments</h3>
                <div className="pp-sub">Track payments made for classes and upload slips if needed</div>
              </div>

              <div className="pp-controls">
                <div className="pp-search-wrap">
                  <input
                    className="pp-search"
                    placeholder="Search by ID, class, date, method..."
                    value={classQuery}
                    onChange={(e) => setClassQuery(e.target.value)}
                  />
                </div>

                <select className="pp-sort" value={classSort} onChange={(e) => setClassSort(e.target.value)}>
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>
            </div>

            <StatusChips value={classStatus} onChange={setClassStatus} counts={classCounts} />

            {visibleClass.length === 0 ? (
              <div className="pp-empty">
                <div className="pp-empty-title">No payments found</div>
                <div className="pp-empty-sub">Try changing filters or searching a different keyword.</div>
              </div>
            ) : (
              <div className="pp-list">
                {visibleClass.map((p) => {
                  const sk = statusKey(p.status);
                  const canSlip = p.method === "Bank Slip";
                  const showUpload = canSlip && sk === "PENDING";
                  const showView = canSlip && p.slipUploaded;

                  return (
                    <div key={p.paymentId} className="pp-item">
                      <div className="pp-item-left">
                        <div className="pp-id">{p.paymentId}</div>
                        <div className="pp-date">{p.date}</div>
                        <div className="pp-method">{p.method}</div>
                      </div>

                      <div className="pp-item-mid">
                        <div className="pp-amount">{formatLKR(p.amount)}</div>
                        <div className="pp-meta">
                          <span className="pp-label">Class:</span> {p.className || "-"}
                        </div>
                        <div className="pp-mini">
                          <span className={statusPillClass(sk)}>{statusLabel(sk)}</span>
                        </div>
                      </div>

                      <div className="pp-item-right">
                        {showUpload ? (
                          <button
                            className="pp-slip-btn"
                            type="button"
                            onClick={() => handleUploadSlip(p.paymentId, "CLASS")}
                          >
                            Upload Slip
                          </button>
                        ) : showView ? (
                          <button className="pp-link" type="button" onClick={() => handleViewSlip(p.paymentId)}>
                            View Slip
                          </button>
                        ) : (
                          <span className="pp-muted">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
