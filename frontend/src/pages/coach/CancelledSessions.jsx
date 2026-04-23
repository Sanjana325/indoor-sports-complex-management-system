import { useState, useEffect } from "react";
import api from "../../services/api";

// page for coaches to track their own class sessions that were cancelled
export default function CancelledSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCancelledSessions();
  }, []);

  // downloads the history of cancelled sessions specifically for this coach
  const fetchCancelledSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/coach/cancelled-sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  // converts date strings into a readable month-day-year format
  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Cancelled Sessions</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>View and track all class sessions that have been cancelled.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={fetchCancelledSessions} 
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          {/* icon and label for refreshing the session list */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Sync Latest
        </button>
      </div>

      <div className="arena-table-container">
        {/* conditional rendering for loading, error, or empty states */}
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
                {/* maps every cancelled session into a table row */}
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
