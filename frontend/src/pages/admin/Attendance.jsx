import { useEffect, useMemo, useState } from "react";
import "../../styles/Attendance.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function Attendance() {
  /* ─── state ─── */
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // enrollmentId → "PRESENT" | "ABSENT"
  const [noSession, setNoSession] = useState(false);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  /* ─── helpers ─── */
  function getBasePath() {
    const role = localStorage.getItem("role");
    return role === "STAFF" ? "/api/staff" : "/api/admin";
  }

  function getHeaders() {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }

  /* ─── Fetch classes on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        setLoadingClasses(true);
        const res = await fetch(`${API_BASE}${getBasePath()}/attendance/classes`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setClasses(data.classes || []);
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, []);

  /* ─── Fetch session attendance when class + date change ─── */
  useEffect(() => {
    if (!selectedClassId || !selectedDate) {
      setSession(null);
      setStudents([]);
      setMarks({});
      setNoSession(false);
      return;
    }

    (async () => {
      try {
        setLoadingStudents(true);
        setNoSession(false);
        setSuccessMsg("");

        const params = new URLSearchParams({ classId: selectedClassId, sessionDate: selectedDate });
        const res = await fetch(`${API_BASE}${getBasePath()}/attendance?${params}`, {
          headers: getHeaders(),
        });
        const data = await res.json();

        if (res.ok) {
          if (!data.session) {
            setSession(null);
            setStudents([]);
            setMarks({});
            setNoSession(true);
          } else {
            setSession(data.session);
            setStudents(data.students || []);
            // Pre‑populate marks from existing DB values
            const existing = {};
            (data.students || []).forEach((s) => {
              if (s.status === "PRESENT" || s.status === "ABSENT") {
                existing[s.enrollmentId] = s.status;
              }
            });
            setMarks(existing);
            setNoSession(false);
          }
        } else {
          console.error(data.message);
        }
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, [selectedClassId, selectedDate]);

  /* ─── Derived ─── */
  const canShowStudents = session && students.length > 0;

  const filteredStudents = useMemo(() => {
    if (!canShowStudents) return [];
    const q = nameSearch.trim().toLowerCase();
    return students.filter((s) => (q ? s.name.toLowerCase().includes(q) : true));
  }, [students, nameSearch, canShowStudents]);

  function getStatus(enrollmentId) {
    return marks[enrollmentId] || "NOT_MARKED";
  }

  function mark(enrollmentId, status) {
    setMarks((prev) => ({ ...prev, [enrollmentId]: status }));
    setSuccessMsg("");
  }

  function clearMarksForThisSession() {
    if (!canShowStudents) return;
    const ok = window.confirm("Clear all marks for this session?");
    if (!ok) return;
    setMarks({});
    setSuccessMsg("");
  }

  /* ─── Save attendance ─── */
  async function saveAttendance() {
    if (!session) return;

    // Build marks array — only include entries that have been marked
    const marksArray = Object.entries(marks)
      .filter(([, status]) => status === "PRESENT" || status === "ABSENT")
      .map(([enrollmentId, status]) => ({
        enrollmentId: Number(enrollmentId),
        status,
      }));

    if (marksArray.length === 0) {
      alert("No attendance marks to save. Please mark at least one student.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}${getBasePath()}/attendance/mark`, {
        method: "POST",
        headers: {
          ...getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: session.sessionId, marks: marksArray }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(`✓ Attendance saved — ${data.count} record(s) updated.`);
      } else {
        alert(data.message || "Failed to save attendance");
      }
    } catch (err) {
      alert("Error saving attendance. Check your connection.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Render ─── */
  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <h2 className="att-title">Attendance</h2>
          <p className="att-subtitle">
            Select class and date, then mark students as present or absent.
          </p>
        </div>
      </div>

      <div className="att-form-card">
        <div className="att-form-row">
          <div className="att-field">
            <label>Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses}
            >
              <option value="">
                {loadingClasses ? "Loading classes..." : "-- Select --"}
              </option>
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.title} — {c.sport} ({c.coach})
                </option>
              ))}
            </select>
          </div>

          <div className="att-field">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="att-actions">
            <button
              className="att-secondary-btn"
              type="button"
              onClick={clearMarksForThisSession}
              disabled={!canShowStudents || saving}
            >
              Clear Marks
            </button>

            <button
              className="att-primary-btn"
              type="button"
              onClick={saveAttendance}
              disabled={!canShowStudents || saving}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

        {successMsg && (
          <p className="att-hint" style={{ color: "#19c37d", fontWeight: 700 }}>
            {successMsg}
          </p>
        )}

        {session && session.status === "CANCELLED" && (
          <p className="att-hint" style={{ color: "#ff3b3b" }}>
            ⚠ This session is marked as CANCELLED.
          </p>
        )}
      </div>

      <div className="att-list-card">
        <div className="att-list-header">
          <h3 className="att-list-title">Students</h3>

          <input
            className="att-search"
            placeholder="Search student name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            disabled={!canShowStudents}
          />
        </div>

        {loadingStudents ? (
          <div className="att-empty">Loading students...</div>
        ) : noSession ? (
          <div className="att-empty">
            No session scheduled for this class on the selected date.
          </div>
        ) : !selectedClassId || !selectedDate ? (
          <div className="att-empty">
            Select a class and date to view enrolled students.
          </div>
        ) : session && students.length === 0 ? (
          <div className="att-empty">No students enrolled in this class.</div>
        ) : canShowStudents && filteredStudents.length === 0 ? (
          <div className="att-empty">No students match your search.</div>
        ) : canShowStudents ? (
          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th className="att-center">Status</th>
                  <th className="att-center">Mark</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const status = getStatus(s.enrollmentId);
                  return (
                    <tr key={s.enrollmentId}>
                      <td>{s.name}</td>

                      <td className="att-center">
                        <span className={`att-badge ${status.toLowerCase()}`}>
                          {status === "NOT_MARKED" ? "Not Marked" : status}
                        </span>
                      </td>

                      <td className="att-center">
                        <button
                          type="button"
                          data-status="present"
                          className={`att-mark-btn ${status === "PRESENT" ? "active" : ""}`}
                          onClick={() => mark(s.enrollmentId, "PRESENT")}
                          disabled={saving}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          data-status="absent"
                          className={`att-mark-btn ${status === "ABSENT" ? "active" : ""}`}
                          onClick={() => mark(s.enrollmentId, "ABSENT")}
                          disabled={saving}
                        >
                          Absent
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
