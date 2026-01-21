import { useMemo, useState } from "react";
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

function formatLKR(n) {
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

export default function MyClasses() {
  const coachName = useMemo(() => {
    const fn = localStorage.getItem("firstName") || "Sahan";
    const ln = localStorage.getItem("lastName") || "Fernando";
    return `${fn} ${ln}`.trim();
  }, []);

  // UI-only mock classes (Admin registers later via backend)
  const [classes] = useState([
    {
      id: "CL-300001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      scheduleType: "WEEKLY",
      days: ["Mon", "Wed"],
      oneTimeDate: "",
      startTime: "18:00",
      endTime: "19:30",
      capacity: 20,
      enrolledCount: 14,
      fee: 2500,
    },
    {
      id: "CL-300006",
      sport: "CRICKET",
      className: "Advanced Cricket Nets",
      coachName: "Sahan Fernando",
      scheduleType: "WEEKLY",
      days: ["Fri"],
      oneTimeDate: "",
      startTime: "16:00",
      endTime: "17:30",
      capacity: 18,
      enrolledCount: 11,
      fee: 3000,
    },
    {
      id: "CL-300020",
      sport: "BADMINTON",
      className: "Badminton Drills",
      coachName: "Sahan Fernando",
      scheduleType: "ONETIME",
      days: [],
      oneTimeDate: "2026-10-02",
      startTime: "18:00",
      endTime: "19:00",
      capacity: 16,
      enrolledCount: 9,
      fee: 2000,
    },
    // other coach's classes (should not show for this coach)
    {
      id: "CL-300002",
      sport: "KARATE",
      className: "Karate Basics",
      coachName: "Nimal Perera",
      scheduleType: "WEEKLY",
      days: ["Tue", "Thu"],
      oneTimeDate: "",
      startTime: "17:30",
      endTime: "19:00",
      capacity: 25,
      enrolledCount: 20,
      fee: 3500,
    },
  ]);

  // cancelled sessions (UI-only)
  const [cancelledSessions, setCancelledSessions] = useState([]);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const myClasses = useMemo(() => {
    return classes.filter((c) => c.coachName === coachName);
  }, [classes, coachName]);

  function openCancel() {
    setIsCancelOpen(true);
  }

  function closeCancel() {
    setIsCancelOpen(false);
  }

  function handleCancelSubmit(payload) {
    setCancelledSessions((prev) => [{ ...payload, createdAt: new Date().toISOString() }, ...prev]);
    setIsCancelOpen(false);
    alert("Class session cancelled.");
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
              <th className="mc-col-dates">Date / Dates</th>
              <th className="mc-col-duration">Duration</th>
              <th className="mc-col-fee">Fee</th>
              <th className="mc-col-enrolled">Students Enrolled</th>
            </tr>
          </thead>

          <tbody>
            {myClasses.length === 0 ? (
              <tr>
                <td colSpan="6" className="mc-empty">
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
                    {c.scheduleType === "ONETIME" ? c.oneTimeDate || "-" : formatDays(c.days)}
                  </td>

                  <td className="mc-col-duration">{durationLabel(c.startTime, c.endTime)}</td>

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
                <strong>{x.dateISO}</strong> — {x.classId} — <span className="mc-reason">{x.reason}</span>
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
