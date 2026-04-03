import { useEffect, useMemo, useState } from "react";
import "../../styles/CoachHome.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fmtDuration(start, end) {
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

function sportKeyFromText(t = "") {
  const lower = t.toLowerCase();
  if (lower.includes("cricket")) return "cricket";
  if (lower.includes("badminton")) return "badminton";
  if (lower.includes("futsal")) return "futsal";
  if (lower.includes("karate")) return "cricket";
  if (lower.includes("chess")) return "cricket";
  return "cricket";
}

export default function CoachHome() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Map backend classes to the format expected by the calendar
        // The backend returns 'startDate' for the first session or 'oneTimeDate' for one-time classes.
        // However, the calendar needs specific dates for each weekly session to show dots.
        // For now, I'll just map the base class data.
        // Actually, the frontend 'classes' mock had a 'date' field.
        // I should probably simplify the frontend mapping or enhance the backend.
        // Let's stick to the current frontend logic but with real data.
        
        const mapped = (data.classes || []).map(c => ({
            ...c,
            date: c.scheduleType === 'ONE_TIME' ? c.oneTimeDate?.split('T')[0] : c.startDate?.split('T')[0]
        }));

        setClasses(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UI-only mock bookings + blocked (for calendar bars + availability)
  const [bookings] = useState([
    {
      id: "B-500003",
      playerName: "Sahan Fernando",
      court: "Futsal - A",
      date: "2026-09-30",
      time: "19:00-21:30",
      status: "CONFIRMED",
    },
  ]);

  const [blockedSlots] = useState([
    {
      id: "BS-400001",
      court: "Cricket - A",
      date: "2026-09-30",
      startTime: "11:00",
      endTime: "12:30",
      reason: "Maintenance",
    },
  ]);



  return (
    <div className="ch-page">
      <h2 className="ch-title">ArenaPro - Coach Home</h2>


    </div>
  );
}
