import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Sports() {
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newSportName, setNewSportName] = useState("");
    const [newSportColor, setNewSportColor] = useState("#22c55e");
    const [isBookable, setIsBookable] = useState(true);
    const [editingSport, setEditingSport] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchSports(); }, []);

    async function fetchSports() {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/sports`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setSports(data.sports || []);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleAddOrUpdateSport(e) {
        e.preventDefault();
        const name = String(newSportName || "").trim().toUpperCase();
        if (!name) return;
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const isEdit = !!editingSport;
            const url = isEdit ? `${API_BASE}/api/admin/sports/${editingSport.SportID}` : `${API_BASE}/api/admin/sports`;
            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sportName: name, colorCode: newSportColor, isBookable })
            });
            if (res.ok) {
                handleCloseModal();
                await fetchSports();
            } else {
                const d = await res.json();
                alert(d.message || "Failed to save sport");
            }
        } catch (err) { alert("Connection error"); }
        finally { setSaving(false); }
    }

    function handleAddClick() {
        setEditingSport(null); setNewSportName(""); setNewSportColor("#22c55e"); setIsBookable(true); setIsModalOpen(true);
    }
    function handleEditClick(s) {
        setEditingSport(s); setNewSportName(s.SportName); setNewSportColor(s.ColorCode || "#22c55e");
        setIsBookable(s.IsBookable === 1 || s.IsBookable === true); setIsModalOpen(true);
    }
    function handleCloseModal() {
        setIsModalOpen(false); setEditingSport(null); setNewSportName("");
    }

    async function handleDeleteSport(id, name) {
        if (!window.confirm(`Permanently remove ${name}?`)) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/sports/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) await fetchSports();
        } catch (err) { console.error(err); }
    }

    return (
        <div className="admin-content-inner">
            <div className="flex-between mb-3">
                <div>
                    <h2 className="page-title">Manage Sports</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Configure available sports and settings</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddClick}>+ New Sport</button>
            </div>

            <div className="arena-table-container">
                <table className="arena-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Sport Name</th>
                            <th>Identity Color</th>
                            <th>Booking Type</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Loading database...</td></tr>
                        ) : sports.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>No sports detected.</td></tr>
                        ) : (
                            sports.map(s => (
                                <tr key={s.SportID}>
                                    <td style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>S-{String(s.SportID).padStart(3, '0')}</td>
                                    <td style={{ fontWeight: 700, fontSize: "1rem" }}>{String(s.SportName || "").toUpperCase()}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: s.ColorCode || "#22c55e", border: "1px solid rgba(0,0,0,0.05)" }}></div>
                                            <code style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{s.ColorCode}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${s.IsBookable ? "success" : "warning"}`}>
                                            {s.IsBookable ? "Publicly Bookable" : "Class Only"}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                            <button className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleEditClick(s)}>Edit</button>
                                            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleDeleteSport(s.SportID, s.SportName)}>Delete</button>
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
                    <div className="arena-card" style={{ width: "100%", maxWidth: "450px" }}>
                        <h3 className="mb-2">{editingSport ? "Modify Sport" : "Register New Sport"}</h3>
                        <form onSubmit={handleAddOrUpdateSport}>
                            <div className="form-group">
                                <label className="form-label">Sport Identity (Name)</label>
                                <input className="form-input" placeholder="e.g. BADMINTON" value={newSportName} onChange={e => setNewSportName(e.target.value.toUpperCase())} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Brand Color</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input type="color" value={newSportColor} onChange={e => setNewSportColor(e.target.value)} style={{ width: "50px", height: "50px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }} />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>This color will represent the sport in calendars and charts.</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="flex-between" style={{ cursor: "pointer", padding: "12px", background: "var(--bg-main)", borderRadius: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Enable Public Booking</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Allow players to reserve courts for this sport.</div>
                                    </div>
                                    <input type="checkbox" checked={isBookable} onChange={e => setIsBookable(e.target.checked)} style={{ width: "20px", height: "20px", accentColor: "var(--primary)" }} />
                                </label>
                            </div>
                            <div className="flex-between mt-3" style={{ justifyContent: "flex-end" }}>
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Processing..." : "Save Sport"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
