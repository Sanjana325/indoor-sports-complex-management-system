import { useState, useEffect } from "react";
import "../../styles/AdminHome.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Sports() {
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(false);

    const [newSportName, setNewSportName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchSports() {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/sports`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.message || "Failed to load sports");
                return;
            }

            const data = await res.json();
            setSports(data.sports || []);
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddSport(e) {
        e.preventDefault();

        const name = String(newSportName || "").trim().toUpperCase();
        if (!name) return;

        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/sports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sportName: name })
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.message || "Failed to add sport");
                return;
            }

            setNewSportName("");
            await fetchSports();
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSport(sportId, sportName) {
        const ok = window.confirm(`Delete "${sportName}"?`);
        if (!ok) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/sports/${sportId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.message || "Failed to delete sport");
                return;
            }

            await fetchSports();
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server");
        }
    }

    return (
        <div className="ah-page">
            <div className="ah-headrow">
                <h2 className="ah-title">Sports</h2>
            </div>

            <div className="ah-modal-body" style={{ padding: 0, marginTop: "20px" }}>
                <div className="ah-sports-grid">
                    <div className="ah-sports-card">
                        <div className="ah-list-title" style={{ fontWeight: 800, marginBottom: "16px", fontSize: "16px" }}>Add Sport</div>

                        <form className="ah-sport-form" onSubmit={handleAddSport}>
                            <input
                                className="ah-sport-input"
                                type="text"
                                placeholder="e.g. CHESS"
                                value={newSportName}
                                onChange={(e) => setNewSportName(e.target.value.toUpperCase())}
                            />
                            <button className="ah-sport-add" type="submit" disabled={saving}>
                                {saving ? "Adding..." : "Add"}
                            </button>
                        </form>

                        <div className="ah-sport-hint">
                            Sports will appear in the Add Court dropdown automatically.
                        </div>
                    </div>

                    <div className="ah-sports-card">
                        <div className="ah-list-title" style={{ fontWeight: 800, marginBottom: "16px", fontSize: "16px" }}>All Sports</div>

                        {loading ? (
                            <div className="ah-empty">Loading...</div>
                        ) : sports.length === 0 ? (
                            <div className="ah-empty">No sports found</div>
                        ) : (
                            <div className="ah-sports-list">
                                {sports.map((s) => (
                                    <div key={s.SportID} className="ah-sport-row">
                                        <div className="ah-sport-name">{String(s.SportName || "").toUpperCase()}</div>
                                        <button
                                            type="button"
                                            className="ah-sport-del"
                                            onClick={() => handleDeleteSport(s.SportID, s.SportName)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="ah-sport-hint">
                            If a sport is linked to courts or coaches, delete may be blocked by the database.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
