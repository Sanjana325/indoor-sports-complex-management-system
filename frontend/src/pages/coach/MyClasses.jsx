import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CancelClassModal from "../../components/CancelClassModal";
import api from "../../services/api";

// converts class schedule days array into a readable comma-separated string
function formatDays(days) {
  if (!days || days.length === 0) return "-";
  return days.join(", ");
}

// transforms standard 24h time strings into raw numeric minutes for duration math
function timeToMinutes(t) {
  if (!t || !t.includes(":")) return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

// calculates and labels the duration of a class session in hours and minutes
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

// formats numeric amounts into Sri Lankan Rupee currency strings
function formatLKR(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

// secondary modal component to show the names of students enrolled in a specific class
function EnrolledStudentsModal({ classId, className, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  // downloads the full enrollment list for the selected class ID
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/coach/classes/${classId}/students`);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error connecting to server");
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
          {/* handles loading or empty states for the student list */}
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

// main inventory page for coaches to oversee all their assigned academic classes
export default function MyClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);

  const coachName = useMemo(() => {
    const fn = localStorage.getItem("firstName") || "";
    const ln = localStorage.getItem("lastName") || "";
    return `${fn} ${ln}`.trim() || "Coach";
  }, []);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  // downloads the master list of all classes taught by this specific coach
  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/coach/my-classes");
      setClasses(res.data.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error connecting to server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const myClasses = classes;

  function openCancel() {
    setIsCancelOpen(true);
  }

  function closeCancel() {
    setIsCancelOpen(false);
  }

  // sends the cancellation request for a specific session to the backend
  async function handleCancelSubmit(payload) {
    try {
      const res = await api.patch("/api/coach/sessions/cancel", {
        sessionId: payload.sessionId,
      });

      setIsCancelOpen(false);
      alert("Class session cancelled successfully. Redirecting to cancellation history...");
      navigate("/coach/cancelled-sessions");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error connecting to server");
    }
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">My Classes</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Monitor student participation and manage your teaching schedule.</p>
        </div>

        {/* emergency trigger to cancel an upcoming class session */}
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
            {/* conditional rendering for class log database loading state */}
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
                    {/* displays the specific date for one-time sessions OR day names for recurring ones */}
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
                    {/* provides a drill-down button to see exactly who is in the class */}
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

      {/* modal trigger for selecting a specific class slot to revoke */}
      {isCancelOpen && (
        <CancelClassModal
          coachName={coachName}
          classes={myClasses}
          onClose={closeCancel}
          onSubmit={handleCancelSubmit}
        />
      )}

      {/* modal reveal for the detailed student enrollment register */}
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
