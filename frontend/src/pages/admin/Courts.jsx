import { useMemo, useState } from "react";
import "../../styles/Courts.css";

const SPORTS = ["CRICKET", "BADMINTON", "FUTSAL"];
const STATUSES = ["AVAILABLE", "BOOKED", "MAINTENANCE"];

function makeId(prefix = "C") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

function sportLabel(s) {
  if (s === "CRICKET") return "Cricket";
  if (s === "BADMINTON") return "Badminton";
  if (s === "FUTSAL") return "Futsal";
  return s;
}

function statusLabel(s) {
  if (s === "AVAILABLE") return "Available";
  if (s === "BOOKED") return "Booked";
  if (s === "MAINTENANCE") return "Maintenance";
  return s;
}

export default function Courts() {
  // UI-only mock courts (later: fetch from backend)
  const [courts, setCourts] = useState([
    {
      id: "C-200001",
      sport: "CRICKET",
      code: "CR-A",
      name: "Cricket - A",
      capacity: 22,
      status: "AVAILABLE",
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "C-200002",
      sport: "CRICKET",
      code: "CR-B",
      name: "Cricket - B",
      capacity: 22,
      status: "MAINTENANCE",
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "C-200003",
      sport: "BADMINTON",
      code: "BD-A",
      name: "Badminton - A",
      capacity: 4,
      status: "AVAILABLE",
      createdAt: "2026-01-19T08:00:00.000Z",
    },
    {
      id: "C-200004",
      sport: "FUTSAL",
      code: "FT-A",
      name: "Futsal - A",
      capacity: 12,
      status: "BOOKED",
      createdAt: "2026-01-19T09:30:00.000Z",
    },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [sport, setSport] = useState("CRICKET");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  // Filter (optional but useful)
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCourts = useMemo(() => {
    if (!normalizedSearch) return courts;
    return courts.filter((c) => {
      const hay = `${c.id} ${c.sport} ${c.code} ${c.name} ${c.capacity} ${c.status}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [courts, normalizedSearch]);

  const latestCricket = useMemo(
    () =>
      filteredCourts
        .filter((c) => c.sport === "CRICKET")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredCourts]
  );

  const latestBadminton = useMemo(
    () =>
      filteredCourts
        .filter((c) => c.sport === "BADMINTON")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredCourts]
  );

  const latestFutsal = useMemo(
    () =>
      filteredCourts
        .filter((c) => c.sport === "FUTSAL")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredCourts]
  );

  function resetForm() {
    setSport("CRICKET");
    setCode("");
    setName("");
    setCapacity("");
    setStatus("AVAILABLE");
    setEditingId(null);
  }

  function openAddModal() {
    setMode("ADD");
    resetForm();
    setIsModalOpen(true);
  }

  function openEditModal(court) {
    setMode("EDIT");
    setEditingId(court.id);
    setSport(court.sport);
    setCode(court.code);
    setName(court.name);
    setCapacity(String(court.capacity));
    setStatus(court.status);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this court?");
    if (!ok) return;
    setCourts((prev) => prev.filter((c) => c.id !== id));
  }

  function validateForm() {
    if (!SPORTS.includes(sport)) return "Select a valid sport";
    if (!code.trim()) return "Court code is required (e.g., CR-A)";
    if (!name.trim()) return "Court name is required (e.g., Cricket - A)";
    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) return "Capacity must be a positive number";
    if (!STATUSES.includes(status)) return "Select a valid status";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const capNum = Number(capacity);

    if (mode === "ADD") {
      const newCourt = {
        id: makeId("C"),
        sport,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        capacity: capNum,
        status,
        createdAt: nowIso(),
      };
      setCourts((prev) => [newCourt, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    if (mode === "EDIT") {
      setCourts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                sport,
                code: code.trim().toUpperCase(),
                name: name.trim(),
                capacity: capNum,
                status,
              }
            : c
        )
      );
      closeModal();
      resetForm();
    }
  }

  return (
    <div className="courts-page">
      <div className="courts-header">
        <div>
          <h2 className="courts-title">Courts</h2>
          <p className="courts-subtitle">Manage courts by sport (UI-only for now).</p>
        </div>

        <button className="courts-primary-btn" onClick={openAddModal}>
          + Add Court
        </button>
      </div>

      <div className="courts-toolbar">
        <input
          className="courts-search"
          placeholder="Search by code, name, sport, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 3 TABLES */}
      <section className="courts-section">
        <h3 className="courts-section-title">Cricket Courts (Last 5 Added)</h3>
        <CourtTable rows={latestCricket} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="courts-section">
        <h3 className="courts-section-title">Badminton Courts (Last 5 Added)</h3>
        <CourtTable rows={latestBadminton} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="courts-section">
        <h3 className="courts-section-title">Futsal Courts (Last 5 Added)</h3>
        <CourtTable rows={latestFutsal} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      {/* MODAL */}
      {isModalOpen && (
        <div className="courts-modal-backdrop" onMouseDown={closeModal}>
          <div className="courts-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="courts-modal-header">
              <h3>{mode === "ADD" ? "Add Court" : "Edit Court"}</h3>
              <button className="courts-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="courts-form" onSubmit={handleSubmit}>
              <div className="courts-grid">
                <div className="courts-field">
                  <label>Sport</label>
                  <select value={sport} onChange={(e) => setSport(e.target.value)}>
                    <option value="CRICKET">Cricket</option>
                    <option value="BADMINTON">Badminton</option>
                    <option value="FUTSAL">Futsal</option>
                  </select>
                </div>

                <div className="courts-field">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="AVAILABLE">Available</option>
                    <option value="BOOKED">Booked</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

                <div className="courts-field">
                  <label>Court Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CR-A"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>

                <div className="courts-field">
                  <label>Court Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cricket - A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="courts-field courts-full">
                  <label>Capacity</label>
                  <input
                    type="number"
                    placeholder="e.g. 22"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="courts-form-actions">
                <button className="courts-secondary-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="courts-primary-btn" type="submit">
                  {mode === "ADD" ? "Add Court" : "Save Changes"}
                </button>
              </div>

              <p className="courts-hint">
                Note: This is UI-only. Backend will enforce booking availability and status updates.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CourtTable({ rows, onEdit, onRemove }) {
  return (
    <div className="courts-table-wrap">
      <table className="courts-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Capacity</th>
            <th>Status</th>
            <th className="courts-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="5" className="courts-empty">
                No courts to show.
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.capacity}</td>
                <td>
                  <span className={`courts-badge ${c.status.toLowerCase()}`}>
                    {statusLabel(c.status)}
                  </span>
                </td>
                <td className="courts-center">
                  <button className="courts-link-btn" type="button" onClick={() => onEdit(c)}>
                    Edit
                  </button>
                  <span className="courts-sep">|</span>
                  <button className="courts-link-btn danger" type="button" onClick={() => onRemove(c.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
