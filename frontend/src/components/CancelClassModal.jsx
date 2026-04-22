import { useEffect, useMemo, useState } from "react";

// converts an ISO date string to a short 3-letter weekday label
function dayShortFromISO(iso) {
  const d = new Date(iso + "T00:00:00");
  const idx = d.getDay(); 
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[idx] || "Mon";
}

// calculates and formats human-readable duration between two clock times
function durationLabel(start, end) {
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (!Number.isFinite(mins) || mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// interactive modal that allows coaches to select and cancel a specific teaching session
export default function CancelClassModal({ coachName, classes, onClose, onSubmit }) {
  const [dateISO, setDateISO] = useState(() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [sessionsForDate, setSessionsForDate] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // accessibility listener to handle modal closure via the escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // triggers a fresh session lookup whenever the coach picks a different calendar date
  useEffect(() => {
    if (!dateISO) return;
    fetchSessions();
  }, [dateISO]);

  // queries the backend for active coaching sessions scheduled on the selected date
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/sessions?date=${dateISO}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSessionsForDate(data.sessions || []);
      } else {
        setSessionsForDate([]);
      }
    } catch (err) {
      console.error(err);
      setSessionsForDate([]);
    } finally {
      setLoadingSessions(false);
      setSelectedSessionId("");
    }
  };

  // validates the selection and passes the cancellation details up to the parent handler
  function handleSubmit(e) {
    e.preventDefault();

    if (!dateISO) return alert("Please select a date");
    if (!selectedSessionId) return alert("Please select a class for that date");

    const session = sessionsForDate.find((s) => String(s.id) === String(selectedSessionId));
    if (!session) return alert("Invalid session selection");

    onSubmit({
      sessionId: session.id,
      classId: session.classId,
      dateISO: dateISO,
      label: `${session.className} (${session.sport})`
    });
  }

  return (
    /* full-screen semi-transparent overlay to focus user attention on the modal */
    <div className="detail-modal-backdrop" onMouseDown={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="arena-card" onMouseDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        {/* standard dismiss button for exiting the cancellation workflow */}
        <button type="button" onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
        }}>×</button>

        <h3 className="mb-2" style={{ fontSize: '1.25rem' }}>Cancel Session</h3>
        <div style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>

        <form onSubmit={handleSubmit}>
          {/* date picker input to narrow down which day's sessions to view */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>

          {/* dynamic dropdown list that updates based on the selected date above */}
          <div className="form-group">
            <label className="form-label">Select Class Session</label>
            <select className="form-input" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} disabled={loadingSessions}>
              {loadingSessions ? (
                <option>Loading sessions...</option>
              ) : (
                <>
                  <option value="">Select a class session</option>
                  {sessionsForDate.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.className} ({s.sport}) • {s.startTime}-{s.endTime} {s.status === 'CANCELLED' ? '[CANCELLED]' : ''}
                    </option>
                  ))}
                </>
              )}
            </select>
            {/* simple feedback for empty states when no sessions exist for a day */}
            {!loadingSessions && sessionsForDate.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>No classes found for this date.</div>
            )}
          </div>

          <div className="flex-between mt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Back
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
