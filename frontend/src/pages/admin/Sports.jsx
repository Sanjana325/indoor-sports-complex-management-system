import { useState, useEffect } from "react";
import adminService from "../../services/adminService";

// management page for creating and configuring different sport disciplines
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

    // fetches the full list of sports from the database
    async function fetchSports() {
        try {
            setLoading(true);
            const data = await adminService.getSports();
            setSports(data.sports || data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    // sends new sport data or updates existing ones to the server
    async function handleAddOrUpdateSport(e) {
        e.preventDefault();
        const name = String(newSportName || "").trim().toUpperCase();
        if (!name) return;
        try {
            setSaving(true);
            const isEdit = !!editingSport;
            const payload = { sportName: name, colorCode: newSportColor, isBookable };
            
            if (isEdit) {
                await adminService.updateSport(editingSport.SportID, payload);
            } else {
                await adminService.createSport(payload);
            }

            handleCloseModal();
            await fetchSports();
        } catch (err) { 
            alert(err.response?.data?.message || "Failed to save sport"); 
        } finally { 
            setSaving(false); 
        }
    }

    // prepares the popup form for a brand new sport entry
    function handleAddClick() {
        setEditingSport(null); setNewSportName(""); setNewSportColor("#22c55e"); setIsBookable(true); setIsModalOpen(true);
    }

    // loads existing sport data into the form for modification
    function handleEditClick(s) {
        setEditingSport(s); setNewSportName(s.SportName); setNewSportColor(s.ColorCode || "#22c55e");
        setIsBookable(s.IsBookable === 1 || s.IsBookable === true); setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false); setEditingSport(null); setNewSportName("");
    }

    // permanently removes a sport from the system database
    async function handleDeleteSport(id, name) {
        if (!window.confirm(`Permanently remove ${name}?`)) return;
        try {
            await adminService.deleteSport(id);
            await fetchSports();
        } catch (err) { 
            alert(err.response?.data?.message || "Connection error"); 
        }
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
                        {/* handles loading states or empty lists for the sports database */}
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>Loading database...</td></tr>
                        ) : sports.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>No sports detected.</td></tr>
                        ) : (
                            sports.map(s => (
                                <tr key={s.id}>
                                    <td><span className="table-id">{s.id}</span></td>
                                    <td style={{ fontWeight: 700, fontSize: "1rem" }}>{String(s.SportName || "").toUpperCase()}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {/* visual preview of the sport's chosen identification color */}
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
                                            <button className="btn btn-edit" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleEditClick(s)}>Edit</button>
                                            <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: "0.8rem" }} onClick={() => handleDeleteSport(s.SportID, s.SportName)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* modal entry form for registering or updating sport metadata */}
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
                                    {/* hex color picker for visual reports and calendaring */}
                                    <input type="color" value={newSportColor} onChange={e => setNewSportColor(e.target.value)} style={{ width: "50px", height: "50px", border: "none", borderRadius: "8px", cursor: "pointer", background: "none" }} />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>This color will represent the sport in calendars and charts.</span>
                                </div>
                            </div>
                            <div className="form-group">
                                {/* toggles whether students can book this court directly or only through classes */}
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
