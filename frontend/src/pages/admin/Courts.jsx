import { useMemo, useState, useEffect } from "react";
import "../../styles/Courts.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  const s = String(sportName || "").toUpperCase();
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
  const [courts, setCourts] = useState([]);
  const [sports, setSports] = useState([]);
  const [rawSports, setRawSports] = useState([]);
  const [loadingSports, setLoadingSports] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("ADD");
  const [editingId, setEditingId] = useState(null);

  const [sport, setSport] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [status, setStatus] = useState("AVAILABLE");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    fetchSports();
    fetchCourts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      const list = data.sports || [];
      setRawSports(list);

      const names = list
        .map((s) => String(s.SportName || "").toUpperCase())
        .filter(Boolean);

      setSports(names);

      setSport((prev) => {
        if (prev) return prev;
        return names[0] || "";
      });
    } catch (err) {
      console.error("Failed to fetch sports", err);
    } finally {
      setLoadingSports(false);
    }
  }

  async function fetchCourts() {
    try {
      setLoadingCourts(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/courts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      const rows = data.courts || [];

      const mapped = rows.map((r) => {
        const sportsText = String(r.Sports || "");
        const firstSport = sportsText.split(",")[0]?.trim() || "";
        return {
          id: r.CourtID,
          sport: firstSport.toUpperCase(),
          sportsText,
          name: r.CourtName,
          capacity: r.Capacity,
          pricePerHour: r.PricePerHour,
          status: r.Status
        };
      });

      setCourts(mapped);
    } catch (err) {
      console.error("Failed to fetch courts", err);
    } finally {
      setLoadingCourts(false);
    }
  }

  const filteredCourts = useMemo(() => {
    if (!normalizedSearch) return courts;
    return courts.filter((c) => {
      const hay = `${c.id} ${c.sportsText} ${c.name} ${c.capacity} ${c.pricePerHour ?? ""} ${c.status}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [courts, normalizedSearch]);

  const sections = useMemo(() => {
    const bySport = sports.map((sportName) => {
      const rows = filteredCourts.filter((c) => c.sport === sportName);
      return { sport: sportName, rows };
    });

    const unknownRows = filteredCourts.filter((c) => !sports.includes(c.sport));
    if (unknownRows.length > 0) {
      bySport.unshift({ sport: "OTHER", rows: unknownRows });
    }

    return bySport;
  }, [sports, filteredCourts]);

  function resetForm() {
    setSport(sports[0] || "");
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
    setSport(court.sport || sports[0] || "");
    setName(court.name || "");
    setCapacity(String(court.capacity ?? ""));
    setPricePerHour(String(court.pricePerHour ?? ""));
    setStatus(court.status || "AVAILABLE");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleRemove(id) {
    const ok = window.confirm("Are you sure you want to remove this court?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/courts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setCourts((prev) => prev.filter((c) => c.id !== id));
        return;
      }

      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to delete court");
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
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

  async function handleSubmit(e) {
    e.preventDefault();

    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }

    const capNum = Number(capacity);
    const priceNum = Number(pricePerHour);

    const token = localStorage.getItem("token");
    const selectedSportObj = rawSports.find(
      (s) => String(s.SportName || "").toUpperCase() === sport.toUpperCase()
    );
    const sportIds = selectedSportObj ? [selectedSportObj.SportID] : [];

    if (sportIds.length === 0) {
      alert("Selected sport is not configured in the database yet.");
      return;
    }

    if (mode === "ADD") {
      try {
        const res = await fetch(`${API_BASE}/api/admin/courts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: name.trim(),
            capacity: capNum,
            pricePerHour: priceNum,
            sportIds
          })
        });

        if (res.ok) {
          closeModal();
          resetForm();
          await fetchCourts();
          return;
        }

        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to create court");
      } catch (error) {
        console.error("Court creation failed", error);
        alert("Failed to create court");
      }
      return;
    }

    if (mode === "EDIT") {
      try {
        const res = await fetch(`${API_BASE}/api/admin/courts/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: name.trim(),
            capacity: capNum,
            pricePerHour: priceNum,
            status,
            sportIds
          })
        });

        if (res.ok) {
          closeModal();
          resetForm();
          await fetchCourts();
          return;
        }

        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Failed to update court");
      } catch (error) {
        console.error("Court update failed", error);
        alert("Failed to update court");
      }
    }
  }

  return (
    <div className="courts-page">
      <div className="courts-container">
        <header className="courts-header">
          <div className="courts-header-content">
            <h1 className="courts-title">Courts Management</h1>
            <p className="courts-subtitle">Manage all courts, pricing, and availability</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
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

        {loadingCourts ? (
          <div className="courts-empty-state">
            <p className="courts-empty-text">Loading courts...</p>
          </div>
        ) : (
          sections.map((section) => (
            <section className="courts-section" key={section.sport}>
              <div className="courts-section-header">
                <div className="courts-section-icon">{getSportIcon(section.sport)}</div>
                <h2 className="courts-section-title">
                  {section.sport === "OTHER"
                    ? "Other Courts"
                    : section.sport.charAt(0).toUpperCase() +
                    section.sport.slice(1).toLowerCase() +
                    " Courts"}
                </h2>
                <span className="courts-section-count">{section.rows.length}</span>
              </div>

              <CourtTable rows={section.rows} onEdit={openEditModal} onRemove={handleRemove} />
            </section>
          ))
        )}
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
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    disabled={loadingSports || sports.length === 0}
                  >
                    {sports.length === 0 ? (
                      <option value="">No sports available</option>
                    ) : (
                      sports.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    )}
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

                <button className="courts-btn-primary" type="submit" disabled={sports.length === 0}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {mode === "ADD" ? "Add Court" : "Save Changes"}
                </button>
              </div>

              {sports.length === 0 && (
                <div style={{ marginTop: 10, fontWeight: 700, opacity: 0.75 }}>
                  No sports in database. Add sports from Admin Home → View All Sports.
                </div>
              )}
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
                  <span className={`courts-badge courts-badge-${String(c.status || "").toLowerCase()}`}>
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
