import { useState, useEffect } from "react";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControlLabel, Switch, Chip } from "@mui/material";
import "../../styles/AdminHome.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Sports() {
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(false);

    const [newSportName, setNewSportName] = useState("");
    const [newSportColor, setNewSportColor] = useState("#1976d2");
    const [isBookable, setIsBookable] = useState(true);
    const [editingSport, setEditingSport] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchSports();

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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ sportName: name, colorCode: newSportColor, isBookable })
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                alert(d.message || `Failed to ${isEdit ? "update" : "add"} sport`);
                return;
            }

            setNewSportName("");
            setNewSportColor("#1976d2");
            setIsBookable(true);
            setEditingSport(null);
            setIsModalOpen(false);
            await fetchSports();
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server");
        } finally {
            setSaving(false);
        }
    }

    function handleAddClick() {
        setEditingSport(null);
        setNewSportName("");
        setNewSportColor("#1976d2");
        setIsBookable(true);
        setIsModalOpen(true);
    }

    function handleEditClick(sport) {
        setEditingSport(sport);
        setNewSportName(sport.SportName);
        setNewSportColor(sport.ColorCode || "#1976d2");
        setIsBookable(sport.IsBookable === 1 || sport.IsBookable === true);
        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
        setEditingSport(null);
        setNewSportName("");
        setNewSportColor("#1976d2");
        setIsBookable(true);
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
            <Box className="ah-headrow" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 3, gap: 2 }}>
                <h2 className="ah-title" style={{ margin: 0 }}>Manage Sports</h2>
                <Button
                    variant="contained"
                    onClick={handleAddClick}
                    sx={{
                        bgcolor: '#1976d2',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)',
                        '&:hover': {
                            bgcolor: '#1565c0',
                            boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)',
                            transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s ease-in-out'
                    }}
                >
                    + Add New Sport
                </Button>
            </Box>

            <div style={{ padding: 0 }}>
                {loading ? (
                    <div className="ah-empty">Loading...</div>
                ) : sports.length === 0 ? (
                    <div className="ah-empty">No sports found</div>
                ) : (
                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>NAME</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>COLOR</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sports.map((s) => (
                                    <TableRow key={s.SportID} hover>
                                        <TableCell>{s.SportID}</TableCell>
                                        <TableCell>{String(s.SportName || "").toUpperCase()}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ width: 16, height: 16, borderRadius: 0.5, backgroundColor: s.ColorCode || '#1976d2' }} />
                                                <Typography variant="body2">{s.ColorCode}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {s.IsBookable ? (
                                                <Chip label="Bookable" color="success" size="small" variant="outlined" />
                                            ) : (
                                                <Chip label="Class-Only" color="warning" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => handleEditClick(s)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleDeleteSport(s.SportID, s.SportName)}
                                                >
                                                    Delete
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <div className="ah-sport-hint" style={{ marginTop: '16px' }}>
                    Bookable sports appear in the Player's court booking dashboard. Class-Only sports are restricted to enrollments.
                </div>
            </div>

            <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 800 }}>
                    {editingSport ? "Edit Sport" : "Add Sport"}
                </DialogTitle>
                <DialogContent dividers>
                    <form id="sport-form" onSubmit={handleAddOrUpdateSport} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
                        <div>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Sport Name</Typography>
                            <input
                                className="ah-sport-input"
                                type="text"
                                placeholder="e.g. CHESS"
                                value={newSportName}
                                onChange={(e) => setNewSportName(e.target.value.toUpperCase())}
                                style={{ width: '100%' }}
                                required
                            />
                        </div>

                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Sport Color (for Calendar)</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                <input
                                    type="color"
                                    value={newSportColor}
                                    onChange={(e) => setNewSportColor(e.target.value)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        padding: 0,
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: 'transparent'
                                    }}
                                />
                                <Typography variant="body2" color="textSecondary">
                                    Choose a color to represent this sport in the calendar
                                </Typography>
                            </Box>
                        </Box>

                        <FormControlLabel
                            control={<Switch checked={isBookable} onChange={(e) => setIsBookable(e.target.checked)} color="primary" />}
                            label={
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Allow Player Bookings</Typography>
                                    <Typography variant="caption" color="textSecondary">If disabled, this sport will only be available for classes.</Typography>
                                </Box>
                            }
                        />
                    </form>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseModal} disabled={saving} color="inherit">
                        Cancel
                    </Button>
                    <Button type="submit" form="sport-form" variant="contained" disabled={saving}>
                        {saving ? "Saving..." : (editingSport ? "Update" : "Add")}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
