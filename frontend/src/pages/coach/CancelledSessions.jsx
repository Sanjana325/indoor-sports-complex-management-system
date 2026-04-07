import { useState, useEffect } from "react";
import "../../styles/CancelledSessions.css";

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
    <div className="cs-page">
      <div className="cs-header">
        <h1 className="cs-title">Cancelled Sessions</h1>
        <p className="cs-subtitle">View and track all class sessions that have been cancelled.</p>
      </div>

      <div className="cs-card">
        {loading ? (
          <div className="cs-loader-container">
            <div className="cs-loader">Loading...</div>
          </div>
        ) : error ? (
          <div className="cs-error-msg">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="cs-empty">
            <div className="cs-empty-icon">📂</div>
            <p>No cancelled sessions found.</p>
          </div>
        ) : (
          <div className="cs-table-wrapper">
            <table className="cs-table">
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
                      <span className="cs-id-badge">#{String(s.id).padStart(5, '0')}</span>
                    </td>
                    <td className="cs-bold">{s.className}</td>
                    <td>{s.sport}</td>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.startTime} - {s.endTime}</td>
                    <td className="cs-center">
                      <span className="cs-status-pill">CANCELLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
