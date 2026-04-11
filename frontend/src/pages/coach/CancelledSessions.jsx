import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CancelledSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCancelledSessions();
  }, []);

  const fetchCancelledSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/cancelled-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data.message || "Failed to fetch cancelled sessions");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">Cancelled Sessions</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>View and track all class sessions that have been cancelled.</p>
        </div>
      </div>

      <div className="arena-table-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>
        ) : error ? (
          <div style={{ color: "var(--primary)", textAlign: "center", padding: "3rem" }}>{error}</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No cancelled sessions found.
          </div>
        ) : (
          <table className="arena-table">
            <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Class Title</th>
                  <th>Sport</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th className="cs-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="status-pill info">CS-{String(s.id).padStart(5, '0')}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.className}</td>
                    <td>{s.sport}</td>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.startTime} - {s.endTime}</td>
                    <td>
                      <span className="status-pill danger">CANCELLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
