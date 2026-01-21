
import { useMemo, useState } from "react";
import "../../styles/PlayerTables.css";

function statusPillClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "verified") return "pt-pill confirmed";
  return "pt-pill pending";
}

function formatLKR(n) {
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

function sortByDate(rows, sortOrder) {
  return [...rows].sort((a, b) => {
    const d1 = new Date(a.date).getTime();
    const d2 = new Date(b.date).getTime();
    return sortOrder === "NEWEST" ? d2 - d1 : d1 - d2;
  });
}

export default function PlayerMyPayments() {
  const [courtSort, setCourtSort] = useState("NEWEST");
  const [classSort, setClassSort] = useState("NEWEST");

  const courtPayments = useMemo(
    () => [
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
      },
    ],
    []
  );

  const classPayments = useMemo(
    () => [
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
      },
    ],
    []
  );

  const sortedCourtPayments = useMemo(
    () => sortByDate(courtPayments, courtSort),
    [courtPayments, courtSort]
  );

  const sortedClassPayments = useMemo(
    () => sortByDate(classPayments, classSort),
    [classPayments, classSort]
  );

  function handleUploadSlip(paymentId) {
    alert(`Upload bank slip for ${paymentId} (UI-only for now)`);
  }

  return (
    <div className="pt-page">
      <div className="pt-header">
        <h2 className="pt-title">My Payments</h2>
      </div>

      {/* Court Booking Payments */}
      <div className="pt-card">
        <div className="pt-card-head">
          <h3 className="pt-card-title">Court Booking Payments</h3>

          <select className="pt-sort" value={courtSort} onChange={(e) => setCourtSort(e.target.value)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Slip</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {sortedCourtPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="pt-empty">
                    No court booking payments yet.
                  </td>
                </tr>
              ) : (
                sortedCourtPayments.map((p) => (
                  <tr key={p.paymentId}>
                    <td>{p.paymentId}</td>
                    <td>{p.date}</td>
                    <td>{formatLKR(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>
                      {p.method === "Bank Slip" ? (
                        <button
                          className="pt-upload-btn"
                          type="button"
                          onClick={() => handleUploadSlip(p.paymentId)}
                        >
                          Upload Slip
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={statusPillClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Class Payments */}
      <div className="pt-card">
        <div className="pt-card-head">
          <h3 className="pt-card-title">Class Payments</h3>

          <select className="pt-sort" value={classSort} onChange={(e) => setClassSort(e.target.value)}>
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>

        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Date</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Slip</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {sortedClassPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="pt-empty">
                    No class payments yet.
                  </td>
                </tr>
              ) : (
                sortedClassPayments.map((p) => (
                  <tr key={p.paymentId}>
                    <td>{p.paymentId}</td>
                    <td>{p.date}</td>
                    <td>{p.className}</td>
                    <td>{formatLKR(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>
                      {p.method === "Bank Slip" ? (
                        <button
                          className="pt-upload-btn"
                          type="button"
                          onClick={() => handleUploadSlip(p.paymentId)}
                        >
                          Upload Slip
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={statusPillClass(p.status)}>{p.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
