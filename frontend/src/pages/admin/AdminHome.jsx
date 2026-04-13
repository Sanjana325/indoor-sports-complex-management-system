import { useMemo, useState, useEffect } from "react";

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
  const [totals, setTotals] = useState({
    users: 0,
    bookings: 0,
    payments: 0,
    classes: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/admin/reports/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.totals) {
          setTotals(data.totals);
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
      }
    }
    fetchStats();
  }, []);

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
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <h2 className="page-title">Dashboard Overview</h2>
      </div>

      <div className="ah-tiles" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div className="arena-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-05)' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{totals.users}</div>
        </div>

        <div className="arena-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-05)' }}>Total Bookings</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{totals.bookings}</div>
        </div>

        <div className="arena-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-05)' }}>Total Payments</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{totals.payments}</div>
        </div>

        <div className="arena-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-05)' }}>Total Classes</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{totals.classes}</div>
        </div>
      </div>
    </div>
  );
}
