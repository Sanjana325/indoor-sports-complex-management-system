import { useEffect, useMemo, useState } from "react";

// backend server address
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// the main component for tracking player attendance in classes
export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [noSession, setNoSession] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // determines the correct api endpoint based on the logged-in user's role
  const getBasePath = () => localStorage.getItem("role") === "STAFF" ? "/api/staff" : "/api/admin";
  
  // returns the required authorization headers for every api call
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  // loads the list of available classes when the page first opens
  useEffect(() => {
    (async () => {
      try {
        setLoadingClasses(true);
        const res = await fetch(`${API_BASE}${getBasePath()}/attendance/classes`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) setClasses(data.classes || []);
      } catch (err) { console.error(err); }
      finally { setLoadingClasses(false); }
    })();
  }, []);

  // fetches student enrollment for a specific class on a specific date
  useEffect(() => {
    if (!selectedClassId || !selectedDate) {
      setSession(null); setStudents([]); setMarks({}); setNoSession(false); return;
    }
    (async () => {
      try {
        setLoadingStudents(true); setNoSession(false); setSuccessMsg("");
        const params = new URLSearchParams({ classId: selectedClassId, sessionDate: selectedDate });
        const res = await fetch(`${API_BASE}${getBasePath()}/attendance?${params}`, { headers: getHeaders() });
        const data = await res.json();
        if (res.ok) {
          if (!data.session) {
            setSession(null); setStudents([]); setMarks({}); setNoSession(true);
          } else {
            setSession(data.session); setStudents(data.students || []);
            const existing = {};
            // pre-loads any existing attendance data already saved on the server
            (data.students || []).forEach((s) => {
              if (s.status === "PRESENT" || s.status === "ABSENT") existing[s.rawEnrollmentId] = s.status;
            });
            setMarks(existing); setNoSession(false);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoadingStudents(false); }
    })();
  }, [selectedClassId, selectedDate]);

  const canShowStudents = session && students.length > 0;

  // filters the student list based on real-time search input
  const filteredStudents = useMemo(() => {
    if (!canShowStudents) return [];
    const q = nameSearch.trim().toLowerCase();
    return students.filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [students, nameSearch, canShowStudents]);

  // updates the local state with a student's attendance status
  const mark = (rawEnrollmentId, status) => {
    setMarks((prev) => ({ ...prev, [rawEnrollmentId]: status }));
    setSuccessMsg("");
  };

  // resets all attendance marks in the current view
  const clearMarksForThisSession = () => {
    if (!canShowStudents || !window.confirm("Clear all marks for this session?")) return;
    setMarks({}); setSuccessMsg("");
  };

  // sends the local attendance marks to the database
  const saveAttendance = async () => {
    if (!session) return;
    const marksArray = Object.entries(marks)
      .filter(([, status]) => status === "PRESENT" || status === "ABSENT")
      .map(([rawEnrollmentId, status]) => ({ enrollmentId: Number(rawEnrollmentId), status }));

    if (marksArray.length === 0) {
      alert("Please mark at least one student."); return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}${getBasePath()}/attendance/mark`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, marks: marksArray }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`✓ Attendance saved — ${data.count} record(s) updated.`);
      } else {
        const data = await res.json(); alert(data.message || "Failed to save");
      }
    } catch (err) { alert("Error saving attendance"); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Select a class session to record participation</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={clearMarksForThisSession} disabled={!canShowStudents || saving}>Clear All</button>
          <button className="btn btn-primary" onClick={saveAttendance} disabled={!canShowStudents || saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>

      <div className="arena-card mb-3">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
          <div className="form-group">
            <label className="form-label">Active Classes</label>
            <select className="form-input" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} disabled={loadingClasses}>
              <option value="">{loadingClasses ? "Loading classes..." : "-- Select Class --"}</option>
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>{c.title} — {c.sport} ({c.coach})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Session Date</label>
            <input className="form-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
        {/* show success or alert messages beneath search filters */}
        {successMsg && <div className="status-pill success mt-2" style={{ width: "100%", textAlign: "center" }}>{successMsg}</div>}
        {session && session.status === "CANCELLED" && <div className="status-pill danger mt-2" style={{ width: "100%", textAlign: "center" }}>⚠ This session is cancelled.</div>}
      </div>

      <div className="arena-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="flex-between" style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--bg-main)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Roll Call</h3>
          <input className="form-input" style={{ maxWidth: "300px" }} placeholder="Filter by student name..." value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} disabled={!canShowStudents} />
        </div>

        <div className="arena-table-container">
          <table className="arena-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Profile</th>
                <th style={{ textAlign: "center" }}>Current Status</th>
                <th style={{ textAlign: "right" }}>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {/* handle different data states like loading or empty results */}
              {loadingStudents ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>Synchronizing enrollment data...</td></tr>
              ) : noSession ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No session scheduled for this date.</td></tr>
              ) : !selectedClassId || !selectedDate ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Select parameters to view students.</td></tr>
              ) : session && students.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No participants enrolled in this class.</td></tr>
              ) : (
                filteredStudents.map((s) => {
                  const status = marks[s.rawEnrollmentId] || "NOT_MARKED";
                  return (
                    <tr key={s.rawEnrollmentId}>
                      <td><span className="table-id" style={{ fontSize: '0.75rem' }}>{s.enrollmentId}</span></td>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`status-pill ${status === "PRESENT" ? "success" : status === "ABSENT" ? "danger" : ""}`}>
                          {status === "NOT_MARKED" ? "Not Recorded" : status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button 
                            className={`btn ${status === "PRESENT" ? "btn-primary" : "btn-secondary"}`} 
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }} 
                            onClick={() => mark(s.rawEnrollmentId, "PRESENT")}
                            disabled={saving}
                          >Present</button>
                          <button 
                            className={`btn ${status === "ABSENT" ? "btn-danger" : "btn-secondary"}`} 
                            style={{ padding: "4px 12px", fontSize: "0.8rem" }} 
                            onClick={() => mark(s.rawEnrollmentId, "ABSENT")}
                            disabled={saving}
                          >Absent</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  );
}
