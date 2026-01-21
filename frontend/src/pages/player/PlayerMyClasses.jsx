import { useMemo, useState } from "react";
import "../../styles/PlayerMyClasses.css";

function formatLKR(n) {
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

function formatSchedule(c) {
  if (c.scheduleType === "ONETIME") {
    return `${c.oneTimeDate || "-"} | ${c.startTime || "--:--"} - ${c.endTime || "--:--"}`;
  }
  const days = Array.isArray(c.days) && c.days.length ? c.days.join(", ") : "-";
  return `${days} | ${c.startTime || "--:--"} - ${c.endTime || "--:--"}`;
}

function statusPillClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "pmc-pill confirmed";
  return "pmc-pill pending";
}

export default function PlayerMyClasses() {
  // ✅ UI-only mock enrolled classes
  const [enrolled] = useState([
    {
      id: "ENR-500001",
      classId: "CL-800001",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      scheduleType: "WEEKLY",
      days: ["Mon", "Wed"],
      oneTimeDate: "",
      startTime: "16:00",
      endTime: "17:30",
      fee: 2500,
      status: "Confirmed", // Confirmed | Pending Verification
    },
    {
      id: "ENR-500002",
      classId: "CL-800003",
      className: "Futsal Training",
      coachName: "Kasun Silva",
      scheduleType: "WEEKLY",
      days: ["Sat"],
      oneTimeDate: "",
      startTime: "09:00",
      endTime: "10:30",
      fee: 3000,
      status: "Pending Verification",
    },
  ]);

  const tiles = useMemo(() => enrolled, [enrolled]);

  return (
    <div className="pmc-page">
      <div className="pmc-top">
        <h2 className="pmc-title">My Classes</h2>
      </div>

      {tiles.length === 0 ? (
        <div className="pmc-empty">
          <div className="pmc-empty-title">No enrolled classes yet</div>
          <div className="pmc-empty-sub">Enroll in a class to see it here.</div>
        </div>
      ) : (
        <div className="pmc-grid">
          {tiles.map((c) => (
            <div key={c.id} className="pmc-tile">
              <div className="pmc-row">
                <div className="pmc-name">{c.className}</div>
                <span className={statusPillClass(c.status)}>{c.status}</span>
              </div>

              <div className="pmc-meta">
                <div>
                  <strong>Coach:</strong> {c.coachName}
                </div>
                <div>
                  <strong>Schedule:</strong> {formatSchedule(c)}
                </div>
                <div>
                  <strong>Fee:</strong> {formatLKR(c.fee)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
