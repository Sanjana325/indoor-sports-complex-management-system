import { useMemo, useState } from "react";
import "../../styles/StaffHome.css";

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

export default function StaffHome() {
  // ✅ tiles (UI-only mock totals — later from backend)
  const totals = useMemo(
    () => ({
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



  return (
    <div className="sh-page">
      <h2 className="sh-title">ArenaPro - Staff Home</h2>

      {/* 3 tiles */}
      <div className="sh-tiles">
        <div className="sh-tile">
          <div className="sh-tile-label">Total Bookings</div>
          <div className="sh-tile-num">{totals.bookings}</div>
        </div>

        <div className="sh-tile">
          <div className="sh-tile-label">Total Payments</div>
          <div className="sh-tile-num">{totals.payments}</div>
        </div>

        <div className="sh-tile">
          <div className="sh-tile-label">Total Classes</div>
          <div className="sh-tile-num">{totals.classes}</div>
        </div>
      </div>


    </div>
  );
}
