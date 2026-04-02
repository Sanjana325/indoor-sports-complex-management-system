import { useEffect, useMemo, useState } from "react";
import "../../styles/CoachHome.css";

import CalendarPanel from "../../components/CalendarPanel";
import DayDetailsModal from "../../components/DayDetailsModal";
import AvailabilityPanel from "../../components/AvailabilityPanel";

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

  const [monthDate, setMonthDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [selectedDateISO, setSelectedDateISO] = useState(() => toISODate(new Date()));
  const [isDayOpen, setIsDayOpen] = useState(false);

  const eventsByDate = useMemo(() => {
    const map = {};
    function ensure(dateISO) {
      if (!map[dateISO]) {
        map[dateISO] = { cricket: 0, badminton: 0, futsal: 0, classes: 0, blocked: 0 };
      }
      return map[dateISO];
    }

    bookings.forEach((b) => {
      const key = ensure(b.date);
      const sportKey = sportKeyFromText(b.court);
      if (sportKey === "cricket") key.cricket += 1;
      if (sportKey === "badminton") key.badminton += 1;
      if (sportKey === "futsal") key.futsal += 1;
    });

    blockedSlots.forEach((x) => {
      const key = ensure(x.date);
      key.blocked += 1;
    });

    classes.forEach((c) => {
      const key = ensure(c.date);
      key.classes += 1;
    });

    return map;
  }, [bookings, blockedSlots, classes]);

  const dayData = useMemo(() => {
    const dateISO = selectedDateISO;

    const dayBookings = bookings.filter((b) => b.date === dateISO).map((b) => ({
      id: b.id,
      playerName: b.playerName,
      court: b.court,
      time: b.time,
      statusKey: b.status === "CONFIRMED" ? "confirmed" : "pending",
      statusLabel: b.status === "CONFIRMED" ? "Confirmed" : "Pending",
      sportKey: sportKeyFromText(b.court),
      sportLabel: b.court.split("-")[0]?.trim() || "Sport",
    }));

    const dayBlocked = blockedSlots.filter((x) => x.date === dateISO);

    const dayClasses = classes
      .filter((c) => c.date === dateISO)
      .map((c) => ({
        ...c,
        duration: fmtDuration(c.startTime, c.endTime),
      }));

    return { bookings: dayBookings, blocked: dayBlocked, classes: dayClasses };
  }, [selectedDateISO, bookings, blockedSlots, classes]);

  const availability = useMemo(() => {
    const dateISO = selectedDateISO;

    const courtList = [
      { name: "Cricket - A", sportKey: "cricket" },
      { name: "Cricket - B", sportKey: "cricket" },
      { name: "Badminton - A", sportKey: "badminton" },
      { name: "Futsal - A", sportKey: "futsal" },
    ];

    function isBlocked(courtName) {
      return blockedSlots.some((x) => x.date === dateISO && x.court === courtName);
    }
    function isBooked(courtName) {
      return bookings.some((b) => b.date === dateISO && b.court === courtName && b.status !== "CANCELLED");
    }

    return courtList.map((c) => {
      if (isBlocked(c.name)) return { ...c, statusKey: "blocked", statusLabel: "Blocked" };
      if (isBooked(c.name)) return { ...c, statusKey: "booked", statusLabel: "Booked" };
      return { ...c, statusKey: "available", statusLabel: "Available" };
    });
  }, [selectedDateISO, bookings, blockedSlots]);

  function handleSelectDate(dateISO) {
    setSelectedDateISO(dateISO);
    setIsDayOpen(true);
  }

  return (
    <div className="ch-page">
      <h2 className="ch-title">ArenaPro - Coach Home</h2>

      <div className="ch-lower">
        <div className="ch-left">
          <CalendarPanel
            monthDate={monthDate}
            selectedDateISO={selectedDateISO}
            onChangeMonth={setMonthDate}
            onSelectDate={handleSelectDate}
            eventsByDate={eventsByDate}
          />
        </div>

        <div className="ch-right">
          <AvailabilityPanel title={`Availability (${selectedDateISO})`} courts={availability} />
        </div>
      </div>

      {isDayOpen && (
        <DayDetailsModal dateISO={selectedDateISO} data={dayData} onClose={() => setIsDayOpen(false)} />
      )}
    </div>
  );
}
