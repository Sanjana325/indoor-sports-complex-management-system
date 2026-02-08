import { useMemo, useState, useEffect } from "react";
import "../../styles/Courts.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

function formatLKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString()}`;
}

function getSportIcon(sportName) {
  const s = sportName.toUpperCase();
  switch (s) {
    case "CRICKET":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "BADMINTON":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="3" />
          <line x1="12" y1="8" x2="12" y2="14" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
      );
    case "FUTSAL":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    default:
      // Generic ball icon for other sports
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20" />
          <path d="M2 12h20" />
        </svg>
      );
  }
}

export default function Courts() {
  const [courts, setCourts] = useState([
    // Keep initial mock data or clear it if you want purely backend. 
    // For now keeping it to prevent empty screen if backend is empty.
    {
      id: "C-200001",
      sport: "CRICKET",
      name: "Cricket - A",
      capacity: 22,
      pricePerHour: 2500,
      status: "AVAILABLE",
      createdAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "C-200002",
      sport: "CRICKET",
      name: "Cricket - B",
      capacity: 22,
      pricePerHour: 2500,
      status: "MAINTENANCE",
      createdAt: "2026-01-18T12:00:00.000Z",
    },
    {
      id: "C-200003",
      sport: "BADMINTON",
      name: "Badminton - A",
      capacity: 4,
      pricePerHour: 2000,
      status: "AVAILABLE",
      createdAt: "2026-01-19T08:00:00.000Z",
    },
    {
      id: "C-200004",
      sport: "FUTSAL",
      name: "Futsal - A",
      capacity: 12,
      pricePerHour: 3500,
      status: "BOOKED",
      createdAt: "2026-01-19T09:30:00.000Z",
    },
  ]);

  const [sports, setSports] = useState([]);
  const [loadingSports, setLoadingSports] = useState(false);

  // Court Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingId, setEditingId] = useState(null);

  // Add Sport Modal
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [sportLoading, setSportLoading] = useState(false);

  // Form Fields
  const [sport, setSport] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  // Fetch sports on mount
  useEffect(() => {
    fetchSports();
  }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // data.sports should be an array of objects { SportID, SportName }
        // We'll map them to a simple array of strings for the existing logic, or keep objects
        // The existing logic uses strings like "CRICKET".
        // Let's assume the backend returns objects.
        // We will store them as objects but also derive a list of names.
        // For compatibility with current 'courts' state which uses 'sport' string:
        const sportNames = data.sports.map(s => s.SportName.toUpperCase());

        // Merge with defaults if needed, or just use backend.
        // Let's use backend + defaults if empty to avoid breaking UI immediately?
        // Actually, let's trust the backend.
        // But we need to ensure the hardcoded courts sports are in the list or handled.

        // Also we want to ensure unique sports
        const uniqueSports = Array.from(new Set([...sportNames, "CRICKET", "BADMINTON", "FUTSAL"]));
        // (Adding defaults so the mock data courts still show up even if DB is empty)

        setSports(uniqueSports);

        // If we have sports and no current selection, select the first one
        if (uniqueSports.length > 0 && !sport) {
          setSport(uniqueSports[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sports", err);
    } finally {
      setLoadingSports(false);
    }
  }

  const filteredCourts = useMemo(() => {
    if (!normalizedSearch) return courts;

    return courts.filter((c) => {
      const hay = `${c.id} ${c.sport} ${c.name} ${c.capacity} ${c.pricePerHour ?? ""} ${c.status}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [courts, normalizedSearch]);

  // Group courts by sport
  const sections = useMemo(() => {
    // We want a section for each available sport that has courts, 
    // OR just each available sport from the 'sports' list?
    // Let's iterate over 'sports' state.

    return sports.map(sportName => {
      const rows = filteredCourts
        .filter(c => c.sport === sportName)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        sport: sportName,
        rows
      };
    }).filter(sec => sec.rows.length > 0 || (sports.includes(sec.sport)));
    // Show empty sections if strictly needed? 
    // Let's only show sections if they have rows to mimic previous behavior, 
    // UNLESS it's important to show empty states. 
    // The previous code showed 3 specific sections even if empty (via 'latestCricket').
    // So let's show all known sports.
  }, [sports, filteredCourts]);

  function resetForm() {
    setSport(sports[0] || "CRICKET");
    setName("");
    setCapacity("");
    setPricePerHour("");
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
    setPricePerHour(String(court.pricePerHour ?? ""));
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
    if (!sport) return "Select a valid sport";
    if (!name.trim()) return "Court name is required";

    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) return "Capacity must be a positive number";

    const priceNum = Number(pricePerHour);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return "Price per hour must be a positive number";

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
    const priceNum = Number(pricePerHour);

    if (mode === "ADD") {
      const newCourt = {
        id: makeId("C"),
        sport,
        name: name.trim(),
        capacity: capNum,
        pricePerHour: priceNum,
        status: "AVAILABLE",
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
              pricePerHour: priceNum,
              status,
            }
            : c
        )
      );
      closeModal();
      resetForm();
    }
  }

  // Add Sport Handlers
  function openSportModal() {
    setNewSportName("");
    setIsSportModalOpen(true);
  }

  function closeSportModal() {
    setIsSportModalOpen(false);
  }

  async function handleAddSport(e) {
    e.preventDefault();
    if (!newSportName.trim()) return;

    try {
      setSportLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ sportName: newSportName.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        // data.sport is the new sport object
        const sName = data.sport.SportName.toUpperCase();

        // Add to sports list if not exists
        setSports(prev => {
          if (prev.includes(sName)) return prev;
          return [...prev, sName];
        });

        closeSportModal();
        alert("Sport added successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to add sport");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    } finally {
      setSportLoading(false);
    }
  }

  return (
    <div className="courts-page">
      <div className="courts-container">
        <header className="courts-header">
          <div className="courts-header-content">
            <h1 className="courts-title">Courts Management</h1>
            <p className="courts-subtitle">Manage all sports courts, pricing, and availability</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="courts-btn-secondary" type="button" onClick={openSportModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Sport
            </button>
            <button className="courts-btn-add" type="button" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Court
            </button>
          </div>
        </header>

        <div className="courts-toolbar">
          <div className="courts-search-wrapper">
            <svg className="courts-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="courts-search"
              placeholder="Search by ID, name, sport, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {sections.map(section => (
          <section className="courts-section" key={section.sport}>
            <div className="courts-section-header">
              <div className="courts-section-icon">
                {getSportIcon(section.sport)}
              </div>
              <h2 className="courts-section-title">{section.sport.charAt(0).toUpperCase() + section.sport.slice(1).toLowerCase()} Courts</h2>
              <span className="courts-section-count">{section.rows.length}</span>
            </div>
            <CourtTable rows={section.rows} onEdit={openEditModal} onRemove={handleRemove} />
          </section>
        ))}
      </div>

      {isModalOpen && (
        <div className="courts-modal-backdrop" onMouseDown={closeModal}>
          <div className="courts-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="courts-modal-header">
              <h3 className="courts-modal-title">{mode === "ADD" ? "Add New Court" : "Edit Court"}</h3>
              <button className="courts-modal-close" type="button" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="courts-form" onSubmit={handleSubmit}>
              <div className="courts-grid">
                <div className="courts-field">
                  <label>Sport</label>
                  <select value={sport} onChange={(e) => setSport(e.target.value)}>
                    {sports.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {mode === "EDIT" ? (
                  <div className="courts-field">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="AVAILABLE">Available</option>
                      <option value="BOOKED">Booked</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                  </div>
                ) : (
                  <div className="courts-field">
                    <label>Status</label>
                    <input type="text" value="Available" disabled />
                  </div>
                )}

                <div className="courts-field courts-full">
                  <label>Court Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cricket - A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="courts-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    placeholder="e.g. 22"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>

                <div className="courts-field">
                  <label>Price per Hour (LKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                  />
                </div>
              </div>

              <div className="courts-form-actions">
                <button className="courts-btn-secondary" type="button" onClick={closeModal}>
                  Cancel
                </button>

                <button className="courts-btn-primary" type="submit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {mode === "ADD" ? "Add Court" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sport Modal */}
      {isSportModalOpen && (
        <div className="courts-modal-backdrop" onMouseDown={closeSportModal}>
          <div className="courts-modal" style={{ maxWidth: '400px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="courts-modal-header">
              <h3 className="courts-modal-title">Add New Sport</h3>
              <button className="courts-modal-close" type="button" onClick={closeSportModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="courts-form" onSubmit={handleAddSport}>
              <div className="courts-field courts-full">
                <label>Sport Name</label>
                <input
                  type="text"
                  placeholder="e.g. NETBALL"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>

              <div className="courts-form-actions">
                <button className="courts-btn-secondary" type="button" onClick={closeSportModal}>
                  Cancel
                </button>

                <button className="courts-btn-primary" type="submit" disabled={sportLoading}>
                  {sportLoading ? "Adding..." : "Add Sport"}
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
      {rows.length === 0 ? (
        <div className="courts-empty-state">
          <svg className="courts-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="courts-empty-text">No courts to show</p>
        </div>
      ) : (
        <table className="courts-table">
          <thead>
            <tr>
              <th>Court ID</th>
              <th>Name</th>
              <th>Capacity</th>
              <th>Price / Hour</th>
              <th>Status</th>
              <th className="courts-actions-header">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="courts-id">{c.id}</span>
                </td>
                <td>
                  <span className="courts-name">{c.name}</span>
                </td>
                <td>
                  <div className="courts-capacity">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {c.capacity}
                  </div>
                </td>
                <td>
                  <span className="courts-price">{formatLKR(c.pricePerHour)}</span>
                </td>
                <td>
                  <span className={`courts-badge courts-badge-${c.status.toLowerCase()}`}>
                    {statusLabel(c.status)}
                  </span>
                </td>

                <td>
                  <div className="courts-actions">
                    <button className="courts-btn-edit" type="button" onClick={() => onEdit(c)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button className="courts-btn-remove" type="button" onClick={() => onRemove(c.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}