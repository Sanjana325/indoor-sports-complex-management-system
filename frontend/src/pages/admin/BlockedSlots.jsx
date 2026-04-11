import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function BlockedSlots() {
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingId, setEditingId] = useState(null);
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchBlockedSlots(); fetchCourts(); }, []);

  async function fetchBlockedSlots() {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/blocked-slots`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setBlockedSlots(data.slots || []);
    } catch (err) { setError("Failed to connect to server"); }
    finally { setLoading(false); }
  }

  async function fetchCourts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/courts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setCourts(data.courts || []);
        if (data.courts?.length > 0) setCourtId(data.courts[0].CourtID);
      }
    } catch (err) { console.error(err); }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blockedSlots;
    return blockedSlots.filter(b => `${b.CourtName} ${b.Reason}`.toLowerCase().includes(q));
  }, [blockedSlots, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt)), [filtered]);

  function resetForm() {
    setCourtId(courts.length > 0 ? courts[0].CourtID : ""); setDate(""); setStartTime(""); setEndTime(""); setReason(""); setEditingId(null);
  }

  function openAddModal() { setMode("ADD"); resetForm(); setIsModalOpen(true); }
  function openEditModal(item) {
    setMode("EDIT"); setEditingId(item.BlockedSlotID); setCourtId(item.CourtID);
    const start = new Date(item.StartDateTime); const end = new Date(item.EndDateTime);
    setDate(start.toISOString().split('T')[0]); setStartTime(start.toTimeString().slice(0, 5)); setEndTime(end.toTimeString().slice(0, 5));
    setReason(item.Reason); setIsModalOpen(true);
  }

  async function handleRemove(id) {
    if (!window.confirm("Remove this blocked slot?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/blocked-slots/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchBlockedSlots();
    } catch (err) { alert("Action failed"); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (endTime <= startTime) { alert("End time must be after start time"); return; }
    const payload = { courtId: Number(courtId), startDateTime: `${date}T${startTime}:00`, endDateTime: `${date}T${endTime}:00`, reason: reason.trim() };
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const url = mode === "ADD" ? `${API_BASE}/api/admin/blocked-slots` : `${API_BASE}/api/admin/blocked-slots/${editingId}`;
      const method = mode === "ADD" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.ok) { setIsModalOpen(false); fetchBlockedSlots(); }
      else { const d = await res.json(); alert(d.message || "Failed to save"); }
    } catch (err) { alert("Connection error"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Blocked Slots</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Prevent bookings for maintenance or private events</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Block New Slot</button>
      </div>

      <div className="arena-card mb-3" style={{ padding: "var(--space-1)" }}>
        <input className="form-input" style={{ maxWidth: "400px" }} placeholder="Filter by court or reason..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="arena-table-container">
        <table className="arena-table">
          <thead>
            <tr>
              <th>Arena / Court</th>
              <th>Date</th>
              <th>Time Range</th>
              <th>Reason</th>
              <th>Created By</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>Loading slot data...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No active blockages.</td></tr>
            ) : (
              sorted.map((b) => (
                <tr key={b.BlockedSlotID}>
                  <td style={{ fontWeight: 700 }}>{b.CourtName}</td>
                  <td style={{ fontWeight: 600 }}>{new Date(b.StartDateTime).toISOString().split('T')[0]}</td>
                  <td>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary-dark)" }}>
                      {new Date(b.StartDateTime).toTimeString().slice(0, 5)} - {new Date(b.EndDateTime).toTimeString().slice(0, 5)}
                    </div>
                  </td>
                  <td><div style={{ fontStyle: "italic", fontSize: "0.875rem" }}>{b.Reason}</div></td>
                  <td>
                    <div style={{ fontSize: "0.8rem" }}>{b.CreatedByFirstName} {b.CreatedByLastName}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(b.CreatedAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => openEditModal(b)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleRemove(b.BlockedSlotID)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-2)" }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "500px" }}>
            <h3 className="mb-2">{mode === "ADD" ? "Block Court Time" : "Modify Blockage"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Target Court</label>
                <select className="form-input" value={courtId} onChange={(e) => setCourtId(e.target.value)} disabled={submitting}>
                  {courts.map((c) => <option key={c.CourtID} value={c.CourtID}>{c.CourtName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Effective Date</label>
                <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Blockage</label>
                <input className="form-input" placeholder="e.g. Weekly Maintenance" value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <div className="flex-between mt-3" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Processing..." : "Confirm Blockage"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}