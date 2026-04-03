import { useMemo, useState, useEffect } from "react";
import "../../styles/AdminHome.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

export default function AdminHome() {
  const totals = useMemo(
    () => ({
      users: 124,
      bookings: 38,
      payments: 29,
      classes: 12
    }),
    []
  );

  const [bookings] = useState([
    {
      id: "B-500001",
      playerName: "Kavindi Silva",
      court: "Badminton - A",
      date: "2026-09-30",
      time: "09:30-10:30",
      status: "CONFIRMED"
    },
    {
      id: "B-500002",
      playerName: "Nuwan Perera",
      court: "Cricket - A",
      date: "2026-09-30",
      time: "13:00-15:00",
      status: "PENDING_PAYMENT"
    },
    {
      id: "B-500003",
      playerName: "Sahan Fernando",
      court: "Futsal - A",
      date: "2026-09-30",
      time: "19:00-21:30",
      status: "CONFIRMED"
    }
  ]);

  const [blockedSlots] = useState([
    {
      id: "BS-400001",
      court: "Cricket - A",
      date: "2026-09-30",
      startTime: "11:00",
      endTime: "12:30",
      reason: "Maintenance"
    }
  ]);

  const [classes] = useState([
    {
      id: "CL-300001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      date: "2026-09-30",
      startTime: "16:00",
      endTime: "17:30"
    }
  ]);



  return (
    <div className="ah-page">
      <div className="ah-headrow">
        <h2 className="ah-title">Overview</h2>
      </div>

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



    </div>
  );
}
