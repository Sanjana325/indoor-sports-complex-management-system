import { useMemo, useState } from "react";
import "../../styles/Payments.css";

const STATUS_OPTIONS = ["ALL", "VERIFIED", "COMPLETED", "CANCELLED"];

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
    },
    {
      id: "PAY002",
      name: "Saman Silva",
      type: "Class Fee",
      method: "Online",
      amount: 3000,
      slip: true,
      status: "PENDING",
    },
    {
      id: "PAY003",
      name: "Kavindi Silva",
      type: "Court Booking",
      method: "Bank Slip",
      amount: 2000,
      slip: true,
      status: "VERIFIED",
    },
    {
      id: "PAY004",
      name: "Ishan Fernando",
      type: "Class Fee",
      method: "Online",
      amount: 3500,
      slip: true,
      status: "COMPLETED",
    },
    {
      id: "PAY005",
      name: "Kasun Silva",
      type: "Court Booking",
      method: "Bank Slip",
      amount: 2500,
      slip: true,
      status: "CANCELLED",
    },
  ]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  function verifyPayment(id) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "VERIFIED" } : p))
    );
  }

  function rejectPayment(id) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "CANCELLED" } : p))
    );
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
        `${p.id} ${p.name} ${p.method} ${p.amount} ${p.status}`
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "ALL" ? true : p.status === statusFilter;

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

  return (
    <div className="pay-page">
      <div className="pay-header">
        <h2 className="pay-title">Payments</h2>
        <p className="pay-subtitle">
          Verify or review payments by category.
        </p>
      </div>

      {/* Filters */}
      <div className="pay-toolbar">
        <input
          className="pay-search"
          placeholder="Search by payment ID, name, method, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="pay-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All" : statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE 1 */}
      <section className="pay-section">
        <h3 className="pay-section-title">Court Booking Payments</h3>
        <PaymentsTable
          rows={bookingPayments}
          onVerify={verifyPayment}
          onReject={rejectPayment}
          statusLabel={statusLabel}
        />
      </section>

      {/* TABLE 2 */}
      <section className="pay-section">
        <h3 className="pay-section-title">Class Fee Payments</h3>
        <PaymentsTable
          rows={classFeePayments}
          onVerify={verifyPayment}
          onReject={rejectPayment}
          statusLabel={statusLabel}
        />
      </section>

      <p className="pay-hint">
        Note: Payment type is inferred from the table category (UI-only).
      </p>
    </div>
  );
}

function PaymentsTable({ rows, onVerify, onReject, statusLabel }) {
  return (
    <div className="pay-table-wrap">
      <table className="pay-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Name</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Payment Slip</th>
            <th>Status</th>
            <th className="pay-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="7" className="pay-empty">
                No payments to show.
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.method}</td>
                <td>LKR {p.amount.toLocaleString()}</td>
                <td>
                  {p.slip ? (
                    <button className="pay-link-btn" type="button">
                      View
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className={`pay-badge ${p.status.toLowerCase()}`}>
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td className="pay-center">
                  {p.status === "PENDING" ? (
                    <>
                      <button
                        className="pay-verify-btn"
                        type="button"
                        onClick={() => onVerify(p.id)}
                      >
                        Verify
                      </button>
                      <button
                        className="pay-reject-btn"
                        type="button"
                        onClick={() => onReject(p.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
