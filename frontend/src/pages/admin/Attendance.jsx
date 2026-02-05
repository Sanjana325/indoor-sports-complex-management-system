import { useMemo, useState } from "react";
import "../../styles/Attendance.css";

function makeId(prefix = "AT") {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${n}`;
}

export default function Attendance() {
  const classes = useMemo(
    () => [
      "Beginner Cricket",
      "Karate Basics",
      "Futsal Training",
      "Chess for Beginners",
      "Badminton Intermediate",
    ],
    []
  );

  const [enrollments] = useState([
    { id: "ENR-1", className: "Beginner Cricket", playerName: "Kavindi Silva" },
    { id: "ENR-2", className: "Beginner Cricket", playerName: "Nuwan Perera" },
    { id: "ENR-3", className: "Beginner Cricket", playerName: "Saman Silva" },

    { id: "ENR-4", className: "Karate Basics", playerName: "Ishan Fernando" },
    { id: "ENR-5", className: "Karate Basics", playerName: "Tharushi Sanjana" },

    { id: "ENR-6", className: "Badminton Intermediate", playerName: "Kasun Silva" },
    { id: "ENR-7", className: "Badminton Intermediate", playerName: "Dilani Jayasinghe" },

    { id: "ENR-8", className: "Chess for Beginners", playerName: "Sahan Fernando" },
  ]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  const [records, setRecords] = useState({});

  const canShowStudents = selectedClass && selectedDate;

  const studentsForSelectedClass = useMemo(() => {
    if (!canShowStudents) return [];
    const q = nameSearch.trim().toLowerCase();

    return enrollments
      .filter((e) => e.className === selectedClass)
      .filter((e) => (q ? e.playerName.toLowerCase().includes(q) : true))
      .sort((a, b) => a.playerName.localeCompare(b.playerName));
  }, [enrollments, selectedClass, nameSearch, canShowStudents]);

  function keyFor(playerName) {
    return `${selectedDate}__${selectedClass}__${playerName}`;
  }

  function getStatus(playerName) {
    return records[keyFor(playerName)] || "NOT_MARKED";
  }

  function mark(playerName, status) {
    const k = keyFor(playerName);
    setRecords((prev) => ({ ...prev, [k]: status }));
  }

  function clearMarksForThisSession() {
    if (!canShowStudents) return;

    const ok = window.confirm("Clear all marks for this class and date?");
    if (!ok) return;

    setRecords((prev) => {
      const next = { ...prev };
      enrollments
        .filter((e) => e.className === selectedClass)
        .forEach((e) => {
          delete next[`${selectedDate}__${selectedClass}__${e.playerName}`];
        });
      return next;
    });
  }

  function saveAttendance() {
    if (!canShowStudents) return;
    alert("Attendance saved (UI only)");
  }

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
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Select --</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
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
              disabled={!canShowStudents}
            >
              Clear Marks
            </button>

            <button
              className="att-primary-btn"
              type="button"
              onClick={saveAttendance}
              disabled={!canShowStudents}
            >
              Save Attendance
            </button>
          </div>
        </div>

        <p className="att-hint">
          Note: UI-only. In the final system, attendance will be stored per class session date.
        </p>
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

        {!canShowStudents ? (
          <div className="att-empty">
            Select a class and date to view enrolled students.
          </div>
        ) : studentsForSelectedClass.length === 0 ? (
          <div className="att-empty">No students found for this class.</div>
        ) : (
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
                {studentsForSelectedClass.map((s) => {
                  const status = getStatus(s.playerName);
                  return (
                    <tr key={`${selectedClass}-${s.playerName}`}>
                      <td>{s.playerName}</td>

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
                          onClick={() => mark(s.playerName, "PRESENT")}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          data-status="absent"
                          className={`att-mark-btn ${status === "ABSENT" ? "active" : ""}`}
                          onClick={() => mark(s.playerName, "ABSENT")}
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
        )}
      </div>
    </div>
  );
}
