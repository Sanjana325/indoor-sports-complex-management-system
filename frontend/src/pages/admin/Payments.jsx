import { useMemo, useState } from "react";
import "../../styles/Payments.css";

const STATUS_OPTIONS = ["ALL", "PENDING", "VERIFIED", "COMPLETED", "CANCELLED"];

function formatPaidAt(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "—";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function isDash(v) {
  return v === "—";
}

export default function Payments() {
  const [payments, setPayments] = useState([
    {
      id: "PAY001",
      name: "Nuwan Perera",
      type: "Court Booking",
      method: "Bank Slip",
      amount: 2500,
      slip: true,
      status: "PENDING",
      paidAt: "2026-01-22T10:18:00",
    },
    {
      id: "PAY002",
      name: "Saman Silva",
      type: "Class Fee",
      method: "Online",
      amount: 3000,
      slip: false,
      status: "PENDING",
      paidAt: "2026-01-22T11:05:00",
    },
    {
      id: "PAY003",
      name: "Kavindi Silva",
      type: "Court Booking",
      method: "Bank Slip",
      amount: 2000,
      slip: true,
      status: "VERIFIED",
      paidAt: "2026-01-21T16:40:00",
    },
    {
      id: "PAY004",
      name: "Ishan Fernando",
      type: "Class Fee",
      method: "Online",
      amount: 3500,
      slip: false,
      status: "COMPLETED",
      paidAt: "2026-01-20T09:55:00",
    },
    {
      id: "PAY005",
      name: "Kasun Silva",
      type: "Court Booking",
      method: "Bank Slip",
      amount: 2500,
      slip: true,
      status: "CANCELLED",
      paidAt: "2026-01-21T08:30:00",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  function verifyPayment(id) {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "VERIFIED" } : p)));
  }

  function rejectPayment(id) {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "CANCELLED" } : p)));
  }

  function statusLabel(status) {
    if (status === "PENDING") return "Pending";
    if (status === "VERIFIED") return "Verified";
    if (status === "COMPLETED") return "Completed";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  }

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return payments.filter((p) => {
      const matchesText =
        q.length === 0 ||
        `${p.id} ${p.name} ${p.type} ${p.method} ${p.amount} ${p.status} ${p.paidAt || ""}`
          .toLowerCase()
          .includes(q);

      const matchesStatus = statusFilter === "ALL" ? true : p.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const bookingPayments = useMemo(
    () => filteredPayments.filter((p) => p.type === "Court Booking"),
    [filteredPayments]
  );

  const classFeePayments = useMemo(
    () => filteredPayments.filter((p) => p.type === "Class Fee"),
    [filteredPayments]
  );

  function handleViewSlip(paymentId) {
    alert(`View slip for ${paymentId} (UI-only for now)`);
  }

  return (
    <div className="pay-page">
      <div className="pay-header">
        <h2 className="pay-title">Payments</h2>
        <p className="pay-subtitle">Verify or review payments by category.</p>
      </div>

      <div className="pay-toolbar">
        <input
          className="pay-search"
          placeholder="Search by payment ID, name, method, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="pay-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All" : statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <section className="pay-section">
        <h3 className="pay-section-title">Court Booking Payments</h3>
        <PaymentsTable
          rows={bookingPayments}
          onVerify={verifyPayment}
          onReject={rejectPayment}
          onViewSlip={handleViewSlip}
          statusLabel={statusLabel}
        />
      </section>

      <section className="pay-section">
        <h3 className="pay-section-title">Class Fee Payments</h3>
        <PaymentsTable
          rows={classFeePayments}
          onVerify={verifyPayment}
          onReject={rejectPayment}
          onViewSlip={handleViewSlip}
          statusLabel={statusLabel}
        />
      </section>

      <p className="pay-hint">
        Paid At represents when the user completed the payment (bank slip upload or online payment).
      </p>
    </div>
  );
}

function PaymentsTable({ rows, onVerify, onReject, onViewSlip, statusLabel }) {
  return (
    <div className="pay-table-wrap">
      <table className="pay-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Name</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Paid At</th>
            <th>Payment Slip</th>
            <th>Status</th>
            <th className="pay-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="8" className="pay-empty">
                No payments to show.
              </td>
            </tr>
          ) : (
            rows.map((p) => {
              const paidAtText = formatPaidAt(p.paidAt);
              const showSlipView = p.method === "Bank Slip" && Boolean(p.slip);

              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.method}</td>
                  <td className="pay-mono">LKR {Number(p.amount).toLocaleString("en-LK")}</td>

                  <td className={isDash(paidAtText) ? "pay-dash" : "pay-mono"}>{paidAtText}</td>

                  <td className={showSlipView ? "" : "pay-dash"}>
                    {showSlipView ? (
                      <button className="pay-link-btn" type="button" onClick={() => onViewSlip(p.id)}>
                        View
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <span className={`pay-badge ${p.status.toLowerCase()}`}>{statusLabel(p.status)}</span>
                  </td>

                  <td className="pay-center">
                    {p.status === "PENDING" ? (
                      <div className="pay-actions">
                        <button className="pay-verify-btn" type="button" onClick={() => onVerify(p.id)}>
                          Verify
                        </button>
                        <button className="pay-reject-btn" type="button" onClick={() => onReject(p.id)}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="pay-dash">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
