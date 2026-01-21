import { useMemo, useState } from "react";
import "../../styles/Enrollments.css";

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([
    {
      id: "ENR-600001",
      playerName: "Kavindi Silva",
      className: "Beginner Cricket",
      dateEnrolled: "2026-01-18",
      status: "ACTIVE",
    },
    {
      id: "ENR-600002",
      playerName: "Nuwan Perera",
      className: "Badminton Intermediate",
      dateEnrolled: "2026-01-19",
      status: "ACTIVE",
    },
    {
      id: "ENR-600003",
      playerName: "Saman Silva",
      className: "Karate Basics",
      dateEnrolled: "2026-01-19",
      status: "ACTIVE",
    },
    {
      id: "ENR-600004",
      playerName: "Ishan Fernando",
      className: "Chess for Beginners",
      dateEnrolled: "2026-01-20",
      status: "CANCELLED",
    },
  ]);

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(enrollments.map((e) => e.className)));
    unique.sort((a, b) => a.localeCompare(b));
    return ["ALL", ...unique];
  }, [enrollments]);

  const [classFilter, setClassFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (classFilter === "ALL") return enrollments;
    return enrollments.filter((e) => e.className === classFilter);
  }, [enrollments, classFilter]);

  function statusLabel(s) {
    if (s === "ACTIVE") return "Active";
    if (s === "CANCELLED") return "Cancelled";
    if (s === "COMPLETED") return "Completed";
    return s;
  }

  function handleRemove(id) {
    const ok = window.confirm("Remove this enrollment?");
    if (!ok) return;
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="enr-page">
      <div className="enr-header">
        <h2 className="enr-title">Enrollments</h2>
      </div>

      <div className="enr-toolbar">
        <label className="enr-label">Filter by Class:</label>
        <select
          className="enr-filter"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All Classes" : c}
            </option>
          ))}
        </select>
      </div>

      <div className="enr-table-wrap">
        <table className="enr-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Class</th>
              <th>Date Enrolled</th>
              <th>Status</th>
              <th className="enr-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="enr-empty">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>{e.playerName}</td>
                  <td>{e.className}</td>
                  <td>{e.dateEnrolled}</td>
                  <td>
                    <span className={`enr-badge ${e.status.toLowerCase()}`}>
                      {statusLabel(e.status)}
                    </span>
                  </td>
                  <td className="enr-center">
                    <button
                      className="enr-remove-btn"
                      type="button"
                      onClick={() => handleRemove(e.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
