import { useEffect, useMemo, useState } from "react";
import CancelClassModal from "../../components/CancelClassModal";

function formatDays(days) {
// ... (rest of helper functions same as before)
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

function EnrolledStudentsModal({ classId, className, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/classes/${classId}/students`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      } else {
        setError(data.message || "Failed to load students");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="detail-modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="arena-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
        }}>×</button>

        <h3 className="mb-1" style={{ fontSize: '1.25rem' }}>Enrolled: {className}</h3>
        <div style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>

        <div className="arena-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading students...</div>
          ) : error ? (
            <div style={{ color: 'var(--primary)', padding: '20px', textAlign: 'center' }}>{error}</div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No students currently enrolled.</div>
          ) : (
            <div className="arena-scroll-area">
              <div className="arena-list">
                {students.map(s => (
                  <div key={s.id} className="arena-list-item">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{s.FirstName} {s.LastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.Email} • {s.PhoneNumber}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled: {new Date(s.EnrolledAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2" style={{ textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For Drill-Down
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);

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
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">My Classes</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Monitor student participation and manage your teaching schedule.</p>
        </div>

        <button type="button" className="btn btn-danger" onClick={openCancel}>
          Cancel Class Session
        </button>
      </div>

      <div className="arena-table-container">
        <table className="arena-table">
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
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  Loading classes...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: "var(--primary)" }}>
                  {error}
                </td>
              </tr>
            ) : myClasses.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: "var(--text-muted)" }}>
                  No classes assigned to you.
                </td>
              </tr>
            ) : (
              myClasses.map((c) => (
                <tr key={c.id}>
                  <td>{coachName}</td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{c.className}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.sport}</div>
                  </td>

                  <td>
                    {c.scheduleType === "ONE_TIME" ? c.oneTimeDate || "-" : formatDays(c.days)}
                  </td>

                  <td>
                    {c.startTime} - {c.endTime}
                  </td>

                  <td>
                    {c.courtName || "-"}
                  </td>

                  <td>{formatLKR(c.fee)}</td>

                  <td>
                    {Number.isFinite(c.enrolledCount) && Number.isFinite(c.capacity) ? (
                      <div className="flex-start" style={{ gap: '12px' }}>
                        <span style={{ fontWeight: 600 }}>{c.enrolledCount}/{c.capacity}</span>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedClassForStudents({ id: c.id, name: c.className })}
                        >
                          View List
                        </button>
                      </div>
                    ) : "-"}
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

      {selectedClassForStudents && (
        <EnrolledStudentsModal 
          classId={selectedClassForStudents.id}
          className={selectedClassForStudents.name}
          onClose={() => setSelectedClassForStudents(null)}
        />
      )}
    </div>
  );
}
