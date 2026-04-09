import { useEffect, useMemo, useState } from "react";
import "../../styles/BlockedSlots.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function displayId(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return String(id || "-");
  return `BS-${String(n).padStart(6, "0")}`;
}

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

  useEffect(() => {
    fetchBlockedSlots();
    fetchCourts();
  }, []);

  async function fetchBlockedSlots() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/blocked-slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load blocked slots");
      setBlockedSlots(data.slots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCourts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/courts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourts(data.courts || []);
        if (data.courts?.length > 0) {
          setCourtId(data.courts[0].CourtID);
        }
      }
    } catch (err) {
      console.error("Failed to fetch courts", err);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return blockedSlots;
    return blockedSlots.filter((b) => {
      const hay = `${b.CourtName} ${b.StartDateTime} ${b.EndDateTime} ${b.Reason} ${displayId(b.BlockedSlotID)}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [blockedSlots, normalizedSearch]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt)),
    [filtered]
  );

  function resetForm() {
    if (courts.length > 0) {
      setCourtId(courts[0].CourtID);
    } else {
      setCourtId("");
    }
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    setEditingId(null);
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setMode("EDIT");
    setEditingId(item.BlockedSlotID);
    setCourtId(item.CourtID);
    
    // Split ISO strings into date and time
    const start = new Date(item.StartDateTime);
    const end = new Date(item.EndDateTime);
    
    setDate(start.toISOString().split('T')[0]);
    setStartTime(start.toTimeString().slice(0, 5));
    setEndTime(end.toTimeString().slice(0, 5));
    setReason(item.Reason);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setIsModalOpen(false);
  }

  async function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this blocked slot?");
    if (!ok) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/blocked-slots/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove blocked slot");
      }
      fetchBlockedSlots();
    } catch (err) {
      alert(err.message);
    }
  }

  function validateForm() {
    if (!courtId) return "Court is required";
    if (!date) return "Date is required";
    if (!startTime) return "Start time is required";
    if (!endTime) return "End time is required";
    if (!reason.trim()) return "Reason is required";
    if (endTime <= startTime) return "End time must be after start time";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    const payload = {
      courtId: Number(courtId),
      startDateTime,
      endDateTime,
      reason: reason.trim()
    };

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let res;
      if (mode === "ADD") {
        res = await fetch(`${API_BASE}/api/admin/blocked-slots`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/blocked-slots/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save blocked slot");

      closeModal();
      fetchBlockedSlots();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Helper for displaying time
  function formatTime(dt) {
    return new Date(dt).toTimeString().slice(0, 5);
  }

  // Helper for displaying date
  function formatDate(dt) {
    return new Date(dt).toISOString().split('T')[0];
  }

  return (
    <div className="bs-page">
      <div className="bs-header">
        <div>
          <h2 className="bs-title">Blocked Slots</h2>
          <p className="bs-subtitle">Manage blocked time slots for courts</p>
        </div>

        <button className="bs-primary-btn" type="button" onClick={openAddModal}>
          + Block Slot
        </button>
      </div>

      {error && <div className="bs-alert bs-alert--error">{error}</div>}

      <div className="bs-toolbar">
        <input
          className="bs-search"
          placeholder="Search by court, date, time, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bs-table-wrap">
        <table className="bs-table">
          <thead>
            <tr>
              <th className="bs-col-court">Court</th>
              <th className="bs-col-date">Date</th>
              <th className="bs-col-start">Start Time</th>
              <th className="bs-col-end">End Time</th>
              <th className="bs-col-reason">Reason</th>
              <th className="bs-col-created-by">Created By</th>
              <th className="bs-col-created-at">Created At</th>
              <th className="bs-col-actions bs-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="bs-empty">
                  Loading...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan="8" className="bs-empty">
                  No blocked slots to show.
                </td>
              </tr>
            ) : (
              sorted.map((b) => (
                <tr key={b.BlockedSlotID}>
                  <td className="bs-col-court">{b.CourtName}</td>
                  <td className="bs-col-date">{formatDate(b.StartDateTime)}</td>
                  <td className="bs-col-start">{formatTime(b.StartDateTime)}</td>
                  <td className="bs-col-end">{formatTime(b.EndDateTime)}</td>
                  <td className="bs-col-reason">{b.Reason}</td>
                  <td className="bs-col-created-by">{`${b.CreatedByFirstName} ${b.CreatedByLastName}`}</td>
                  <td className="bs-col-created-at">{new Date(b.CreatedAt).toLocaleString()}</td>

                  <td className="bs-col-actions bs-center">
                    <div className="bs-actions">
                      <button className="bs-action-btn" type="button" onClick={() => openEditModal(b)}>
                        Edit
                      </button>
                      <button
                        className="bs-action-btn danger"
                        type="button"
                        onClick={() => handleRemove(b.BlockedSlotID)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="bs-modal-backdrop" onMouseDown={closeModal}>
          <div className="bs-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="bs-modal-header">
              <h3>{mode === "ADD" ? "Block Slot" : "Edit Blocked Slot"}</h3>
              <button className="bs-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="bs-form" onSubmit={handleSubmit}>
              <div className="bs-grid">
                <div className="bs-field bs-full">
                  <label>Court</label>
                  <select value={courtId} onChange={(e) => setCourtId(e.target.value)} disabled={submitting}>
                    {courts.map((c) => (
                      <option key={c.CourtID} value={c.CourtID}>
                        {c.CourtName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-field">
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={submitting} />
                </div>

                <div className="bs-field">
                  <label>Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={submitting} />
                </div>

                <div className="bs-field">
                  <label>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={submitting} />
                </div>

                <div className="bs-field bs-full">
                  <label>Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Maintenance / Event"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="bs-form-actions">
                <button className="bs-modal-btn secondary" type="button" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button className="bs-modal-btn primary" type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : mode === "ADD" ? "Block Slot" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}