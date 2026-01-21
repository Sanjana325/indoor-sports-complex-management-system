import { useMemo, useState } from "react";
import "../../styles/AdminHome.css";

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
  // start/end: "HH:mm"
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (!Number.isFinite(mins) || mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function statusLabelBooking(s) {
  if (s === "PENDING_PAYMENT") return "Pending";
  if (s === "CONFIRMED") return "Confirmed";
  if (s === "CANCELLED") return "Cancelled";
  return s;
}
function statusKeyBooking(s) {
  if (s === "CONFIRMED") return "confirmed";
  if (s === "CANCELLED") return "cancelled";
  return "pending";
}
function sportKeyFromCourtName(court) {
  const lower = court.toLowerCase();
  if (lower.includes("cricket")) return "cricket";
  if (lower.includes("badminton")) return "badminton";
  if (lower.includes("futsal")) return "futsal";
  return "cricket";
}
function sportLabelFromKey(k) {
  if (k === "cricket") return "Cricket";
  if (k === "badminton") return "Badminton";
  if (k === "futsal") return "Futsal";
  return "Cricket";
}

export default function AdminHome() {
  // ✅ tiles (UI-only mock totals — later from backend)
  const totals = useMemo(
    () => ({
      users: 124,
      bookings: 38,
      payments: 29,
      classes: 12,
    }),
    []
  );

  // ✅ UI-only mock data for calendar
  const [bookings] = useState([
    {
      id: "B-500001",
      playerName: "Kavindi Silva",
      court: "Badminton - A",
      date: "2026-09-30",
      time: "09:30-10:30",
      status: "CONFIRMED",
    },
    {
      id: "B-500002",
      playerName: "Nuwan Perera",
      court: "Cricket - A",
      date: "2026-09-30",
      time: "13:00-15:00",
      status: "PENDING_PAYMENT",
    },
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

  const [classes] = useState([
    {
      id: "CL-300001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      date: "2026-09-30",
      startTime: "16:00",
      endTime: "17:30",
    },
  ]);

  // ✅ Calendar controls
  const [monthDate, setMonthDate] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [selectedDateISO, setSelectedDateISO] = useState(() => toISODate(new Date()));
  const [isDayOpen, setIsDayOpen] = useState(false);

  // ✅ Events counts for mini-bars inside month cells
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
      const sportKey = sportKeyFromCourtName(b.court);
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

  // ✅ Data shown in day popup
  const dayData = useMemo(() => {
    const dateISO = selectedDateISO;

    const dayBookings = bookings
      .filter((b) => b.date === dateISO)
      .map((b) => {
        const sportKey = sportKeyFromCourtName(b.court);
        return {
          id: b.id,
          playerName: b.playerName,
          court: b.court,
          time: b.time,
          statusKey: statusKeyBooking(b.status),
          statusLabel: statusLabelBooking(b.status),
          sportKey,
          sportLabel: sportLabelFromKey(sportKey),
        };
      });

    const dayBlocked = blockedSlots.filter((x) => x.date === dateISO);

    const dayClasses = classes
      .filter((c) => c.date === dateISO)
      .map((c) => ({
        ...c,
        duration: fmtDuration(c.startTime, c.endTime),
      }));

    return { bookings: dayBookings, blocked: dayBlocked, classes: dayClasses };
  }, [selectedDateISO, bookings, blockedSlots, classes]);

  // ✅ Availability panel (UI-only logic)
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
      if (isBlocked(c.name)) {
        return { ...c, statusKey: "blocked", statusLabel: "Blocked" };
      }
      if (isBooked(c.name)) {
        return { ...c, statusKey: "booked", statusLabel: "Booked" };
      }
      return { ...c, statusKey: "available", statusLabel: "Available" };
    });
  }, [selectedDateISO, bookings, blockedSlots]);

  function handleSelectDate(dateISO) {
    setSelectedDateISO(dateISO);
    setIsDayOpen(true);
  }

  return (
    <div className="ah-page">
      <h2 className="ah-title">Admin Home</h2>

      {/* 4 tiles */}
      <div className="ah-tiles">
        <div className="ah-tile">
          <div className="ah-tile-label">Total Users</div>
          <div className="ah-tile-num">{totals.users}</div>
        </div>

        <div className="ah-tile">
          <div className="ah-tile-label">Total Bookings</div>
          <div className="ah-tile-num">{totals.bookings}</div>
        </div>

        <div className="ah-tile">
          <div className="ah-tile-label">Total Payments</div>
          <div className="ah-tile-num">{totals.payments}</div>
        </div>

        <div className="ah-tile">
          <div className="ah-tile-label">Total Classes</div>
          <div className="ah-tile-num">{totals.classes}</div>
        </div>
      </div>

      {/* Calendar + Right panel */}
      <div className="ah-lower">
        <div className="ah-left">
          <CalendarPanel
            monthDate={monthDate}
            selectedDateISO={selectedDateISO}
            onChangeMonth={setMonthDate}
            onSelectDate={handleSelectDate}
            eventsByDate={eventsByDate}
          />
        </div>

        <div className="ah-right">
          <AvailabilityPanel title={`Availability (${selectedDateISO})`} courts={availability} />
        </div>
      </div>

      {isDayOpen && (
        <DayDetailsModal
          dateISO={selectedDateISO}
          data={dayData}
          onClose={() => setIsDayOpen(false)}
        />
      )}
    </div>
  );
}
