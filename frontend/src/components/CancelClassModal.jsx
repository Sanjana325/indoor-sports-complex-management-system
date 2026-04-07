import { useEffect, useMemo, useState } from "react";
import "../styles/CancelClassModal.css";

function dayShortFromISO(iso) {
  const d = new Date(iso + "T00:00:00");
  const idx = d.getDay(); // 0 Sun ... 6 Sat
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[idx] || "Mon";
}

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

  // close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch sessions when date changes
  useEffect(() => {
    if (!dateISO) return;
    fetchSessions();
  }, [dateISO]);

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
    <div className="ccm-backdrop" onMouseDown={onClose}>
      <div className="ccm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ccm-head">
          <h3 className="ccm-title">Cancel Class Session</h3>
          <button type="button" className="ccm-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="ccm-form" onSubmit={handleSubmit}>
          <div className="ccm-field">
            <label>Date</label>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>

          <div className="ccm-field">
            <label>Class (for selected date)</label>
            <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} disabled={loadingSessions}>
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
            {!loadingSessions && sessionsForDate.length === 0 && (
              <div className="ccm-hint">No classes found for this date.</div>
            )}
          </div>

          <div className="ccm-actions">
            <button type="button" className="ccm-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ccm-btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
