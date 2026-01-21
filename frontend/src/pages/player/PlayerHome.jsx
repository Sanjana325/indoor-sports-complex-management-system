import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/PlayerHome.css";

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
  return "cricket";
}

export default function PlayerHome() {
  const navigate = useNavigate();

  // UI-only mock (later from backend)
  const [bookings] = useState([
    { id: "B-700001", playerName: "You", court: "Court A", date: "2025-10-19", time: "16:00-18:00", status: "CONFIRMED" },
    { id: "B-700002", playerName: "You", court: "Court B", date: "2025-10-21", time: "10:00-12:00", status: "PENDING_PAYMENT" },
  ]);

  const [blockedSlots] = useState([
    { id: "BS-900001", court: "Court A", date: "2025-10-20", startTime: "12:00", endTime: "14:00", reason: "Maintenance" },
  ]);

  const [classes] = useState([
    { id: "CL-800001", sport: "CRICKET", className: "Beginner Cricket", coachName: "Sahan Fernando", date: "2025-10-21", startTime: "16:00", endTime: "17:30" },
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
      if (!map[dateISO]) map[dateISO] = { cricket: 0, badminton: 0, futsal: 0, classes: 0, blocked: 0 };
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

    const dayBookings = bookings
      .filter((b) => b.date === dateISO)
      .map((b) => ({
        id: b.id,
        playerName: b.playerName,
        court: b.court,
        time: b.time.replace("-", " - "),
        statusKey: b.status === "CONFIRMED" ? "confirmed" : "pending",
        statusLabel: b.status === "CONFIRMED" ? "Confirmed" : "Pending",
        sportKey: sportKeyFromText(b.court),
        sportLabel: "Court Booking",
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
      { name: "Court A", sportKey: "cricket" },
      { name: "Court B", sportKey: "cricket" },
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

  function onBookCourt() {
    navigate("/player/book-court");
  }

  function onViewClasses() {
    alert("View Available Classes (UI only) — you’ll define this flow later 🙂");
  }

  return (
    <div className="ph-page">
      <div className="ph-head">
        <h2 className="ph-title">Player Home</h2>

        <div className="ph-actions">
          <button type="button" className="ph-action-btn" onClick={onBookCourt}>
            Book a Court
          </button>
          <button type="button" className="ph-action-btn" onClick={onViewClasses}>
            View Available Classes
          </button>
        </div>
      </div>

      <div className="ph-lower">
        <div className="ph-left">
          <CalendarPanel
            monthDate={monthDate}
            selectedDateISO={selectedDateISO}
            onChangeMonth={setMonthDate}
            onSelectDate={handleSelectDate}
            eventsByDate={eventsByDate}
          />
        </div>

        <div className="ph-right">
          <AvailabilityPanel title={`Availability (${selectedDateISO})`} courts={availability} />
        </div>
      </div>

      {isDayOpen && (
        <DayDetailsModal dateISO={selectedDateISO} data={dayData} onClose={() => setIsDayOpen(false)} />
      )}
    </div>
  );
}
