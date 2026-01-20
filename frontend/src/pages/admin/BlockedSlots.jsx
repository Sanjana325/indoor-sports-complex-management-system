import { useMemo, useState } from "react";
import "../../styles/BlockedSlots.css";

function makeId(prefix = "BS") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

export default function BlockedSlots() {
  // UI-only mock data (later: fetch from backend)
  const [blockedSlots, setBlockedSlots] = useState([
    {
      id: "BS-400001",
      court: "Cricket - A",
      date: "2026-01-21",
      startTime: "10:00",
      endTime: "12:00",
      reason: "Maintenance",
      createdAt: "2026-01-19T10:00:00.000Z",
    },
    {
      id: "BS-400002",
      court: "Badminton - A",
      date: "2026-01-22",
      startTime: "15:00",
      endTime: "17:00",
      reason: "Private event",
      createdAt: "2026-01-19T11:00:00.000Z",
    },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [court, setCourt] = useState("Cricket - A");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  // Search (optional)
  const [search, setSearch] = useState("");

  // UI-only list of courts (later comes from DB)
  const COURT_OPTIONS = useMemo(
    () => ["Cricket - A", "Cricket - B", "Badminton - A", "Futsal - A"],
    []
  );

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return blockedSlots;
    return blockedSlots.filter((b) => {
      const hay = `${b.court} ${b.date} ${b.startTime} ${b.endTime} ${b.reason}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [blockedSlots, normalizedSearch]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [filtered]
  );

  function resetForm() {
    setCourt("Cricket - A");
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
    setEditingId(item.id);
    setCourt(item.court);
    setDate(item.date);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setReason(item.reason);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this blocked slot?");
    if (!ok) return;
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
  }

  function validateForm() {
    if (!court.trim()) return "Court is required";
    if (!date) return "Date is required";
    if (!startTime) return "Start time is required";
    if (!endTime) return "End time is required";
    if (!reason.trim()) return "Reason is required";

    if (endTime <= startTime) return "End time must be after start time";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    if (mode === "ADD") {
      const newItem = {
        id: makeId("BS"),
        court: court.trim(),
        date,
        startTime,
        endTime,
        reason: reason.trim(),
        createdAt: nowIso(),
      };
      setBlockedSlots((prev) => [newItem, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    if (mode === "EDIT") {
      setBlockedSlots((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                court: court.trim(),
                date,
                startTime,
                endTime,
                reason: reason.trim(),
              }
            : b
        )
      );
      closeModal();
      resetForm();
    }
  }

  return (
    <div className="bs-page">
      <div className="bs-header">
        <div>
          <h2 className="bs-title">Blocked Slots</h2>
          <p className="bs-subtitle">Block courts for maintenance/events (UI-only for now).</p>
        </div>

        <button className="bs-primary-btn" onClick={openAddModal}>
          + Block Slot
        </button>
      </div>

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
              <th>Court</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Reason</th>
              <th className="bs-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan="6" className="bs-empty">
                  No blocked slots to show.
                </td>
              </tr>
            ) : (
              sorted.map((b) => (
                <tr key={b.id}>
                  <td>{b.court}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime}</td>
                  <td>{b.endTime}</td>
                  <td>{b.reason}</td>
                  <td className="bs-center">
                    <button className="bs-link-btn" type="button" onClick={() => openEditModal(b)}>
                      Edit
                    </button>
                    <span className="bs-sep">|</span>
                    <button className="bs-link-btn danger" type="button" onClick={() => handleRemove(b.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
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
                  <select value={court} onChange={(e) => setCourt(e.target.value)}>
                    {COURT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bs-field">
                  <label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="bs-field">
                  <label>End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>

                <div className="bs-field bs-full">
                  <label>Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Maintenance / Event"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="bs-form-actions">
                <button className="bs-secondary-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="bs-primary-btn" type="submit">
                  {mode === "ADD" ? "Block Slot" : "Save Changes"}
                </button>
              </div>

              <p className="bs-hint">
                Note: UI-only. Backend will prevent bookings in blocked time ranges.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
