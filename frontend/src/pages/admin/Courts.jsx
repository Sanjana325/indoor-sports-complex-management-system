import { useMemo, useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function formatLKR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString()}`;
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

  const [selectedSports, setSelectedSports] = useState([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");

  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    fetchSports();
    fetchCourts();
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
      setSports(list.map(s => String(s.SportName || "").toUpperCase()).filter(Boolean));
      setSelectedSports([]);
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
      setCourts(rows.map(r => ({
        id: r.CourtID,
        sportsList: String(r.Sports || "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean),
        sportsText: String(r.Sports || ""),
        name: r.CourtName,
        capacity: r.Capacity,
        pricePerHour: r.PricePerHour
      })));
    } catch (err) {
      console.error("Failed to fetch courts", err);
    } finally {
      setLoadingCourts(false);
    }
  }

  const filteredCourts = useMemo(() => {
    if (!normalizedSearch) return courts;
    return courts.filter(c => {
      const hay = `${c.id} ${c.sportsText} ${c.name} ${c.capacity} ${c.pricePerHour ?? ""}`.toLowerCase();
      return hay.includes(normalizedSearch);
    });
  }, [courts, normalizedSearch]);

  const resetForm = () => {
    setSelectedSports([]); setName(""); setCapacity(""); setPricePerHour(""); setEditingId(null);
  };

  const openAddModal = () => { setMode("ADD"); resetForm(); setIsModalOpen(true); };
  const openEditModal = (court) => {
    setMode("EDIT"); setEditingId(court.id); setSelectedSports(court.sportsList || []);
    setName(court.name || ""); setCapacity(String(court.capacity ?? ""));
    setPricePerHour(String(court.pricePerHour ?? "")); setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  async function handleRemove(id) {
    if (!window.confirm("Are you sure you want to remove this court?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/courts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCourts();
      else alert("Failed to delete court");
    } catch (err) { console.error(err); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedSports.length === 0) return alert("Select at least one sport");
    const sportIds = selectedSports.map(s => rawSports.find(r => String(r.SportName).toUpperCase() === s)?.SportID).filter(Boolean);
    const body = { name: name.trim(), capacity: Number(capacity), pricePerHour: Number(pricePerHour), sportIds };
    const token = localStorage.getItem("token");
    const url = mode === "ADD" ? `${API_BASE}/api/admin/courts` : `${API_BASE}/api/admin/courts/${editingId}`;
    const method = mode === "ADD" ? "POST" : "PUT";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) { closeModal(); fetchCourts(); }
      else alert("Failed to save court");
    } catch (err) { console.error(err); }
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-2">
        <div>
          <h2 className="page-title">Courts Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Detailed inventory of all available playing fields</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <span>+ Add Court</span>
        </button>
      </div>

      <div className="arena-card mb-2" style={{ padding: "var(--space-1)" }}>
        <input 
          className="form-input" 
          placeholder="Search by name, sport, or ID..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {loadingCourts ? (
        <div className="arena-card" style={{ textAlign: "center", padding: "var(--space-4)" }}>Loading...</div>
      ) : (
        <div className="arena-table-container">
          <table className="arena-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Court Name</th>
                <th>Sports</th>
                <th>Capacity</th>
                <th>Price / Hr</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourts.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{c.id}</td>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {c.sportsList.map(s => <span key={s} className="status-pill success" style={{ fontSize: "0.7rem" }}>{s}</span>)}
                    </div>
                  </td>
                  <td>{c.capacity} Players</td>
                  <td style={{ fontWeight: 600, color: "var(--primary-dark)" }}>{formatLKR(c.pricePerHour)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button className="btn btn-secondary" style={{ padding: "6px 12px" }} onClick={() => openEditModal(c)}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: "6px 12px" }} onClick={() => handleRemove(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-2)" }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "500px", boxShadow: "var(--shadow-lg)" }}>
            <h3 className="mb-2">{mode === "ADD" ? "Create New Court" : "Update Court Details"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Court Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cricket Arena A" required />
              </div>
              <div className="form-group">
                <label className="form-label">Select Sports</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "var(--space-1)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)" }}>
                  {sports.map(s => (
                    <label key={s} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", cursor: "pointer", padding: "4px 8px", background: selectedSports.includes(s) ? "var(--primary-light)" : "transparent", borderRadius: "10px", border: "1px solid", borderColor: selectedSports.includes(s) ? "var(--primary)" : "transparent" }}>
                      <input type="checkbox" checked={selectedSports.includes(s)} onChange={e => e.target.checked ? setSelectedSports([...selectedSports, s]) : setSelectedSports(selectedSports.filter(x => x !== s))} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input type="number" className="form-input" value={capacity} onChange={e => setCapacity(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price / Hr</label>
                  <input type="number" className="form-input" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} required />
                </div>
              </div>
              <div className="flex-between mt-2" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
