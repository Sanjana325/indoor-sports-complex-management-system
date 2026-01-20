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

function statusLabel(s) {
  if (s === "AVAILABLE") return "Available";
  if (s === "BOOKED") return "Booked";
  if (s === "MAINTENANCE") return "Maintenance";
  return s;
}

export default function Courts() {
  const [courts, setCourts] = useState([
    {
      id: "C-200001",
      sport: "CRICKET",
      name: "Cricket - A",
      capacity: 22,
      status: "AVAILABLE",
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "C-200002",
      sport: "CRICKET",
      name: "Cricket - B",
      capacity: 22,
      status: "MAINTENANCE",
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "C-200003",
      sport: "BADMINTON",
      name: "Badminton - A",
      capacity: 4,
      status: "AVAILABLE",
      createdAt: "2026-01-19T08:00:00.000Z",
    },
    {
      id: "C-200004",
      sport: "FUTSAL",
      name: "Futsal - A",
      capacity: 12,
      status: "BOOKED",
      createdAt: "2026-01-19T09:30:00.000Z",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  const [sport, setSport] = useState("CRICKET");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const filteredCourts = useMemo(() => {
    if (!normalizedSearch) return courts;

    return courts.filter((c) => {
      const hay = `${c.id} ${c.sport} ${c.name} ${c.capacity} ${c.status}`.toLowerCase();
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
        </div>

        <button className="courts-primary-btn" type="button" onClick={openAddModal}>
          + Add Court
        </button>
      </div>

      <div className="courts-toolbar">
        <input
          className="courts-search"
          placeholder="Search by id, name, sport, status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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

                <div className="courts-field courts-full">
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

                <button className="courts-primary-btn courts-modal-primary" type="submit">
                  {mode === "ADD" ? "Add Court" : "Save Changes"}
                </button>
              </div>
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
            <th className="courts-col-id">Court ID</th>
            <th className="courts-col-name">Name</th>
            <th className="courts-col-capacity">Capacity</th>
            <th className="courts-col-status">Status</th>
            <th className="courts-col-actions courts-center">Actions</th>
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
                <td className="courts-col-id">{c.id}</td>
                <td className="courts-col-name">{c.name}</td>
                <td className="courts-col-capacity">{c.capacity}</td>
                <td className="courts-col-status">
                  <span className={`courts-badge ${c.status.toLowerCase()}`}>
                    {statusLabel(c.status)}
                  </span>
                </td>

                <td className="courts-col-actions courts-center">
                  <div className="courts-actions">
                    <button className="courts-action-btn" type="button" onClick={() => onEdit(c)}>
                      Edit
                    </button>
                    <button className="courts-action-btn danger" type="button" onClick={() => onRemove(c.id)}>
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
  );
}
