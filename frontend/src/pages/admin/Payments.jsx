import { useEffect, useMemo, useState } from "react";
import "../../styles/Payments.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUS_OPTIONS = ["ALL", "PENDING", "VERIFIED", "COMPLETED", "REJECTED"];

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
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const basePath = role === "STAFF" ? "/api/staff" : "/api/admin";

      const res = await fetch(`${API_BASE}${basePath}/payments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPayments(data.payments || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  async function verifyPayment(id, rawPaymentId) {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const basePath = role === "STAFF" ? "/api/staff" : "/api/admin";

      const res = await fetch(`${API_BASE}${basePath}/payments/${rawPaymentId}/verify`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "VERIFIED" } : p)));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to verify payment");
      }
    } catch (err) {
      alert("Error verifying payment");
    }
  }

  async function rejectPayment(id, rawPaymentId) {
    if (!window.confirm("Are you sure you want to REJECT this payment? This will cancel the associated booking/cycle.")) return;
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const basePath = role === "STAFF" ? "/api/staff" : "/api/admin";

      const res = await fetch(`${API_BASE}${basePath}/payments/${rawPaymentId}/reject`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" } : p)));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to reject payment");
      }
    } catch (err) {
      alert("Error rejecting payment");
    }
  }

  function statusLabel(status) {
    if (status === "PENDING") return "Pending";
    if (status === "VERIFIED") return "Verified";
    if (status === "COMPLETED") return "Completed";
    if (status === "REJECTED") return "Rejected";
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

  function handleViewSlip(slipPath) {
    if (slipPath) {
      window.open(slipPath, '_blank');
    } else {
      alert("Slip not available.");
    }
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
        {loading ? (
           <p style={{color: '#888', padding: '20px 0'}}>Loading payments...</p>
        ) : (
          <PaymentsTable
            rows={bookingPayments}
            onVerify={verifyPayment}
            onReject={rejectPayment}
            onViewSlip={handleViewSlip}
            statusLabel={statusLabel}
            showBookingId={true}
          />
        )}
      </section>

      <section className="pay-section">
        <h3 className="pay-section-title">Class Fee Payments</h3>
        {loading ? (
             <p style={{color: '#888', padding: '20px 0'}}>Loading payments...</p>
        ) : (
            <PaymentsTable
              rows={classFeePayments}
              onVerify={verifyPayment}
              onReject={rejectPayment}
              onViewSlip={handleViewSlip}
              statusLabel={statusLabel}
            />
        )}
      </section>

      <p className="pay-hint">
        Paid At represents when the user completed the payment (bank slip upload or online payment).
      </p>
    </div>
  );
}

function PaymentsTable({ rows, onVerify, onReject, onViewSlip, statusLabel, showBookingId }) {
  return (
    <div className="pay-table-wrap">
      <table className="pay-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            {showBookingId && <th>Booking ID</th>}
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
                  {showBookingId && <td>#{p.bookingId || "N/A"}</td>}
                  <td>{p.name}</td>
                  <td>{p.method}</td>
                  <td className="pay-mono">LKR {Number(p.amount).toLocaleString("en-LK")}</td>

                  <td className={isDash(paidAtText) ? "pay-dash" : "pay-mono"}>{paidAtText}</td>

                  <td className={showSlipView ? "" : "pay-dash"}>
                    {showSlipView ? (
                      <button className="pay-link-btn" type="button" onClick={() => onViewSlip(p.slip)}>
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
                        <button className="pay-verify-btn" type="button" onClick={() => onVerify(p.id, p.paymentIdStr)}>
                          Verify
                        </button>
                        <button className="pay-reject-btn" type="button" onClick={() => onReject(p.id, p.paymentIdStr)}>
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
