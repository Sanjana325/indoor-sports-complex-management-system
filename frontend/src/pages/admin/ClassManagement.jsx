import { useMemo, useState } from "react";
import "../../styles/ClassManagement.css";

const SPORTS = ["CRICKET", "KARATE", "FUTSAL", "CHESS", "BADMINTON"];

function makeId(prefix = "CL") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

function nowIso() {
  return new Date().toISOString();
}

function sportLabel(s) {
  if (s === "CRICKET") return "Cricket";
  if (s === "KARATE") return "Karate";
  if (s === "FUTSAL") return "Futsal";
  if (s === "CHESS") return "Chess";
  if (s === "BADMINTON") return "Badminton";
  return s;
}

export default function ClassManagement() {
  // UI-only mock classes (later: fetch from backend)
  const [classes, setClasses] = useState([
    {
      id: "CL-300001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      schedule: "Mon/Wed 6:00 PM - 7:30 PM",
      capacity: 20,
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "CL-300002",
      sport: "KARATE",
      className: "Karate Basics",
      coachName: "Nimal Perera",
      schedule: "Tue/Thu 5:30 PM - 7:00 PM",
      capacity: 25,
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "CL-300003",
      sport: "FUTSAL",
      className: "Futsal Training",
      coachName: "Kasun Silva",
      schedule: "Sat 4:00 PM - 6:00 PM",
      capacity: 18,
      createdAt: "2026-01-19T08:00:00.000Z",
    },
    {
      id: "CL-300004",
      sport: "CHESS",
      className: "Chess for Beginners",
      coachName: "Ishan Fernando",
      schedule: "Sun 9:00 AM - 11:00 AM",
      capacity: 30,
      createdAt: "2026-01-19T09:30:00.000Z",
    },
    {
      id: "CL-300005",
      sport: "BADMINTON",
      className: "Badminton Intermediate",
      coachName: "Dilani Jayasinghe",
      schedule: "Fri 6:00 PM - 7:30 PM",
      capacity: 16,
      createdAt: "2026-01-19T10:15:00.000Z",
    },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD"); // ADD | EDIT
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [sport, setSport] = useState("CRICKET");
  const [className, setClassName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [capacity, setCapacity] = useState("");

  // Search
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClasses = useMemo(() => {
    if (!normalizedSearch) return classes;
    return classes.filter((c) => {
      const hay = `${c.id} ${c.sport} ${c.className} ${c.coachName} ${c.schedule} ${c.capacity}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [classes, normalizedSearch]);

  function lastFiveBySport(sportKey) {
    return filteredClasses
      .filter((c) => c.sport === sportKey)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }

  const latestCricket = useMemo(() => lastFiveBySport("CRICKET"), [filteredClasses]);
  const latestKarate = useMemo(() => lastFiveBySport("KARATE"), [filteredClasses]);
  const latestFutsal = useMemo(() => lastFiveBySport("FUTSAL"), [filteredClasses]);
  const latestChess = useMemo(() => lastFiveBySport("CHESS"), [filteredClasses]);
  const latestBadminton = useMemo(() => lastFiveBySport("BADMINTON"), [filteredClasses]);

  function resetForm() {
    setSport("CRICKET");
    setClassName("");
    setCoachName("");
    setSchedule("");
    setCapacity("");
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
    setSport(item.sport);
    setClassName(item.className);
    setCoachName(item.coachName);
    setSchedule(item.schedule);
    setCapacity(String(item.capacity));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this class?");
    if (!ok) return;
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }

  function validateForm() {
    if (!SPORTS.includes(sport)) return "Select a valid sport";
    if (!className.trim()) return "Class name is required";
    if (!coachName.trim()) return "Coach name is required";
    if (!schedule.trim()) return "Schedule is required";
    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) return "Capacity must be a positive number";
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
      const newClass = {
        id: makeId("CL"),
        sport,
        className: className.trim(),
        coachName: coachName.trim(),
        schedule: schedule.trim(),
        capacity: capNum,
        createdAt: nowIso(),
      };
      setClasses((prev) => [newClass, ...prev]);
      closeModal();
      resetForm();
      return;
    }

    if (mode === "EDIT") {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                sport,
                className: className.trim(),
                coachName: coachName.trim(),
                schedule: schedule.trim(),
                capacity: capNum,
              }
            : c
        )
      );
      closeModal();
      resetForm();
    }
  }

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h2 className="cm-title">Class Management</h2>
          <p className="cm-subtitle">Manage classes by sport (UI-only for now).</p>
        </div>

        <button className="cm-primary-btn" onClick={openAddModal}>
          + Add Class
        </button>
      </div>

      <div className="cm-toolbar">
        <input
          className="cm-search"
          placeholder="Search by class name, coach, sport, schedule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 5 TABLES */}
      <section className="cm-section">
        <h3 className="cm-section-title">Cricket Classes (Last 5 Added)</h3>
        <ClassTable rows={latestCricket} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Karate Classes (Last 5 Added)</h3>
        <ClassTable rows={latestKarate} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Futsal Classes (Last 5 Added)</h3>
        <ClassTable rows={latestFutsal} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Chess Classes (Last 5 Added)</h3>
        <ClassTable rows={latestChess} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      <section className="cm-section">
        <h3 className="cm-section-title">Badminton Classes (Last 5 Added)</h3>
        <ClassTable rows={latestBadminton} onEdit={openEditModal} onRemove={handleRemove} />
      </section>

      {/* MODAL */}
      {isModalOpen && (
        <div className="cm-modal-backdrop" onMouseDown={closeModal}>
          <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>{mode === "ADD" ? "Add Class" : "Edit Class"}</h3>
              <button className="cm-icon-btn" type="button" onClick={closeModal} aria-label="Close">
                ✕
              </button>
            </div>

            <form className="cm-form" onSubmit={handleSubmit}>
              <div className="cm-grid">
                <div className="cm-field">
                  <label>Sport</label>
                  <select value={sport} onChange={(e) => setSport(e.target.value)}>
                    <option value="CRICKET">Cricket</option>
                    <option value="KARATE">Karate</option>
                    <option value="FUTSAL">Futsal</option>
                    <option value="CHESS">Chess</option>
                    <option value="BADMINTON">Badminton</option>
                  </select>
                </div>

                <div className="cm-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Beginner Cricket"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Coach Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sahan Fernando"
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                  />
                </div>

                <div className="cm-field cm-full">
                  <label>Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon/Wed 6:00 PM - 7:30 PM"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </div>
              </div>

              <div className="cm-form-actions">
                <button className="cm-secondary-btn" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button className="cm-primary-btn" type="submit">
                  {mode === "ADD" ? "Add Class" : "Save Changes"}
                </button>
              </div>

              <p className="cm-hint">
                Note: UI-only. Backend will connect classes, coaches, and schedules properly later.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassTable({ rows, onEdit, onRemove }) {
  return (
    <div className="cm-table-wrap">
      <table className="cm-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Coach Name</th>
            <th>Schedule</th>
            <th>Capacity</th>
            <th className="cm-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="5" className="cm-empty">
                No classes to show.
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr key={c.id}>
                <td>{c.className}</td>
                <td>{c.coachName}</td>
                <td>{c.schedule}</td>
                <td>{c.capacity}</td>
                <td className="cm-center">
                  <button className="cm-link-btn" type="button" onClick={() => onEdit(c)}>
                    Edit
                  </button>
                  <span className="cm-sep">|</span>
                  <button className="cm-link-btn danger" type="button" onClick={() => onRemove(c.id)}>
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
