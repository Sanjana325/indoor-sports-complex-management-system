import { useEffect, useMemo, useState } from "react";
import "../../styles/MyClasses.css";
import CancelClassModal from "../../components/CancelClassModal";

function formatDays(days) {
  if (!days || days.length === 0) return "-";
  return days.join(", ");
}

function timeToMinutes(t) {
  if (!t || !t.includes(":")) return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function durationLabel(startTime, endTime) {
  const s = timeToMinutes(startTime);
  const e = timeToMinutes(endTime);
  if (s === null || e === null) return "-";
  const diff = e - s;
  if (diff <= 0) return "-";

  const h = Math.floor(diff / 60);
  const m = diff % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatLKR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const coachName = useMemo(() => {
    const fn = localStorage.getItem("firstName") || "";
    const ln = localStorage.getItem("lastName") || "";
    return `${fn} ${ln}`.trim() || "Coach";
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/my-classes`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setClasses(data.classes || []);
      } else {
        setError(data.message || "Failed to fetch classes");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // cancelled sessions (UI-only)
  const [cancelledSessions, setCancelledSessions] = useState([]);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // The backend already filters classes by CoachID, so we don't need to filter by name here.
  const myClasses = classes;

  function openCancel() {
    setIsCancelOpen(true);
  }

  function closeCancel() {
    setIsCancelOpen(false);
  }

  async function handleCancelSubmit(payload) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/sessions/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: payload.sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCancelledSessions((prev) => [{ ...payload, createdAt: new Date().toISOString() }, ...prev]);
        setIsCancelOpen(false);
        alert("Class session cancelled successfully.");
        // Refresh classes to update enrollment counts if needed (though session status doesn't affect main class data here)
        fetchMyClasses();
      } else {
        alert(data.message || "Failed to cancel session");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  }

  return (
    <div className="mc-page">
      <div className="mc-header">
        <div>
          <h2 className="mc-title">My Classes</h2>
          <p className="mc-sub">
             Cancelled sessions will reflect in the UI.
          </p>
        </div>

        <button type="button" className="mc-cancel-btn" onClick={openCancel}>
          Cancel Class Session
        </button>
      </div>

      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr>
              <th className="mc-col-name">Name</th>
              <th className="mc-col-class">Class</th>
              <th className="mc-col-dates">Date/Dates</th>
              <th className="mc-col-schedule">Schedule</th>
              <th className="mc-col-court">Court</th>
              <th className="mc-col-fee">Fee</th>
              <th className="mc-col-enrolled">Students Enrolled</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="mc-empty">
                  Loading classes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="mc-empty" style={{ color: "#ff4d4d" }}>
                  {error}
                </td>
              </tr>
            ) : myClasses.length === 0 ? (
              <tr>
                <td colSpan="7" className="mc-empty">
                  No classes assigned to you.
                </td>
              </tr>
            ) : (
              myClasses.map((c) => (
                <tr key={c.id}>
                  <td className="mc-col-name">{coachName}</td>

                  <td className="mc-col-class">
                    <div className="mc-class-main">{c.className}</div>
                    <div className="mc-class-sub">{c.sport}</div>
                  </td>

                  <td className="mc-col-dates">
                    {c.scheduleType === "ONE_TIME" ? c.oneTimeDate || "-" : formatDays(c.days)}
                  </td>

                  <td className="mc-col-schedule">
                    {c.startTime} - {c.endTime}
                  </td>

                  <td className="mc-col-court">
                    {c.courtName || "-"}
                  </td>

                  <td className="mc-col-fee">{formatLKR(c.fee)}</td>

                  <td className="mc-col-enrolled">
                    {Number.isFinite(c.enrolledCount) && Number.isFinite(c.capacity)
                      ? `${c.enrolledCount}/${c.capacity}`
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {cancelledSessions.length > 0 && (
        <div className="mc-cancel-log">
          <div className="mc-cancel-log-title">Recently Cancelled Sessions (UI-only)</div>
          <ul className="mc-cancel-log-list">
            {cancelledSessions.slice(0, 4).map((x) => (
              <li key={x.sessionId}>
                <strong>{x.dateISO}</strong> — {x.classId}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCancelOpen && (
        <CancelClassModal
          coachName={coachName}
          classes={myClasses}
          onClose={closeCancel}
          onSubmit={handleCancelSubmit}
        />
      )}
    </div>
  );
}
