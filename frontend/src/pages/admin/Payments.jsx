import { useEffect, useMemo, useState } from "react";
import adminService from "../../services/adminService";
import ArenaTable from "../../components/shared/ArenaTable";
import StatusPill from "../../components/shared/StatusPill";
import { formatDate } from "../../utils/formatters";

// page for administrators to audit and verify all system transactions
export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAllClasses, setShowAllClasses] = useState(false);
  const [showAllCourts, setShowAllCourts] = useState(false);

  // downloads the full transaction history from the server
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPayments();
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  // handles verifying or rejecting a payment, updating the UI state immediately
  const handleAction = async (endpoint, id, rawId, newStatus) => {
    let reason = null;
    if (newStatus === "REJECTED") {
      reason = window.prompt("Reason for rejection (this will be emailed to the student):", "Invalid or blurry bank slip image.");
      if (reason === null) return; // user cancelled the prompt
    }

    try {
      if (endpoint === "verify") {
        await adminService.verifyPayment(rawId);
      } else {
        await adminService.rejectPayment(rawId, reason);
      }
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (e) {
      alert(e.response?.data?.message || "Action failed");
    }
  };

  // manages filtering by user search query and payment status
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter(p => {
      const matchesText = !q || `${p.id} ${p.name} ${p.type} ${p.method} ${p.amount} ${p.status}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  // splits the payments into two logical categories for better organization
  const bookingPayments = filtered.filter(p => p.type === "Court Booking");
  const classFeePayments = filtered.filter(p => p.type === "Class Fee");

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Payments</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Verify and review transactions</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchPayments}>Refresh Stream</button>
      </div>

      <div className="arena-card mb-3" style={{ padding: "var(--space-1)", display: "flex", gap: "var(--space-2)" }}>
        {/* search and filter controls for the transaction log */}
        <input className="form-input" style={{ maxWidth: "400px" }} placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ maxWidth: "200px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <PaymentSection title="Class Fee Payments" rows={showAllClasses ? classFeePayments : classFeePayments.slice(0, 5)} onToggle={() => setShowAllClasses(!showAllClasses)} showAll={showAllClasses} total={classFeePayments.length} onVerify={(id, rid) => handleAction("verify", id, rid, "VERIFIED")} onReject={(id, rid) => handleAction("reject", id, rid, "REJECTED")} loading={loading} showEnrollmentId={true} />
      <PaymentSection title="Court Reservation Payments" rows={showAllCourts ? bookingPayments : bookingPayments.slice(0, 5)} onToggle={() => setShowAllCourts(!showAllCourts)} showAll={showAllCourts} total={bookingPayments.length} onVerify={(id, rid) => handleAction("verify", id, rid, "VERIFIED")} onReject={(id, rid) => handleAction("reject", id, rid, "REJECTED")} loading={loading} showBookingId={true} />
    </div>
  );
}

// reusable UI section for displaying a list of payments in a table
function PaymentSection({ title, rows, onToggle, showAll, total, onVerify, onReject, loading, showBookingId, showEnrollmentId }) {
  return (
    <div className="mb-4">
      <div className="flex-between mb-1" style={{ alignItems: "flex-end" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>{title} ({total})</h3>
        {/* toggle button to show more or less rows in the table */}
        {total > 5 && (
          <button className="btn-link" onClick={onToggle} style={{ fontSize: "0.8rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            {showAll ? "Collapse" : "Show All"}
          </button>
        )}
      </div>
      <ArenaTable 
        loading={loading}
        data={rows}
        columns={[
          { header: "TxID" },
          ...(showBookingId ? [{ header: "Booking" }] : []),
          ...(showEnrollmentId ? [{ header: "Enrollment" }] : []),
          { header: "Payer" },
          { header: "Method" },
          { header: "Amount" },
          { header: "Timestamp" },
          { header: "Proof" },
          { header: "Status" },
          { header: "Actions", style: { textAlign: "right" } }
        ]}
        renderRow={(p) => (
          <tr key={p.id}>
            <td><span className="table-id">{p.id}</span></td>
            {showBookingId && <td><span className="table-id" style={{ opacity: 0.8, fontSize: '0.75rem' }}>{p.bookingId || "N/A"}</span></td>}
            {showEnrollmentId && <td><span className="table-id" style={{ opacity: 0.8, fontSize: '0.75rem' }}>{p.enrollmentId || "N/A"}</span></td>}
            <td><div style={{ fontWeight: 700 }}>{p.name}</div></td>
            <td>{p.method}</td>
            <td style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.85rem" }}>LKR {Number(p.amount).toLocaleString()}</td>
            <td style={{ fontSize: "0.8rem" }}>{formatDate(p.paidAt)}</td>
            <td>
              {/* allows safe viewing of uploaded bank slips or payment proofs */}
              {p.slip ? (
                <button className="btn-link" onClick={() => window.open(p.slip, "_blank")} style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>View Slip</button>
              ) : <span style={{ color: "var(--text-muted)" }}>-</span>}
            </td>
            <td>
              <StatusPill status={p.status} />
            </td>
            <td>
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                {/* verification workflow: only pending payments can be edited */}
                {p.status === "PENDING" ? (
                  <>
                    <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => onVerify(p.id, p.paymentIdStr)}>Verify</button>
                    <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={() => onReject(p.id, p.paymentIdStr)}>Reject</button>
                  </>
                ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Finalized</span>}
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
