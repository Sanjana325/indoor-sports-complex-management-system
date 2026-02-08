import { useMemo, useState, useEffect } from "react";
import "../../styles/AdminHome.css";

import CalendarPanel from "../../components/CalendarPanel";
import DayDetailsModal from "../../components/DayDetailsModal";
import AvailabilityPanel from "../../components/AvailabilityPanel";

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
          sportLabel: sportLabelFromKey(sportKey)
        };
      });

    const dayBlocked = blockedSlots.filter((x) => x.date === dateISO);

    const dayClasses = classes
      .filter((c) => c.date === dateISO)
      .map((c) => ({
        ...c,
        duration: fmtDuration(c.startTime, c.endTime)
      }));

    return { bookings: dayBookings, blocked: dayBlocked, classes: dayClasses };
  }, [selectedDateISO, bookings, blockedSlots, classes]);

  const availability = useMemo(() => {
    const dateISO = selectedDateISO;

    const courtList = [
      { name: "Cricket - A", sportKey: "cricket" },
      { name: "Cricket - B", sportKey: "cricket" },
      { name: "Badminton - A", sportKey: "badminton" },
      { name: "Futsal - A", sportKey: "futsal" }
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

  const [isSportsOpen, setIsSportsOpen] = useState(false);

  return (
    <div className="ah-page">
      <div className="ah-headrow">
        <h2 className="ah-title">Admin Home</h2>

        <div className="ah-actions">
          <button className="ah-action-btn" type="button" onClick={() => setIsSportsOpen(true)}>
            View All Sports
          </button>
        </div>
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

      {isSportsOpen && <SportsModal onClose={() => setIsSportsOpen(false)} />}
    </div>
  );
}

function SportsModal({ onClose }) {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newSportName, setNewSportName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSports() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.message || "Failed to load sports");
        return;
      }

      const data = await res.json();
      setSports(data.sports || []);
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSport(e) {
    e.preventDefault();

    const name = String(newSportName || "").trim().toUpperCase();
    if (!name) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sportName: name })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.message || "Failed to add sport");
        return;
      }

      setNewSportName("");
      await fetchSports();
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSport(sportId, sportName) {
    const ok = window.confirm(`Delete "${sportName}"?`);
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/sports/${sportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.message || "Failed to delete sport");
        return;
      }

      await fetchSports();
    } catch (err) {
      console.error(err);
      alert("Failed to connect to server");
    }
  }

  return (
    <div className="ah-modal-backdrop" onMouseDown={onClose}>
      <div className="ah-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ah-modal-head">
          <div>
            <div className="ah-modal-title">Sports</div>
            <div className="ah-modal-sub">Add and remove sports used for courts and classes</div>
          </div>
          <button type="button" className="ah-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="ah-modal-body">
          <div className="ah-sports-grid">
            <div className="ah-sports-card">
              <div className="ah-list-title">Add Sport</div>

              <form className="ah-sport-form" onSubmit={handleAddSport}>
                <input
                  className="ah-sport-input"
                  type="text"
                  placeholder="e.g. CHESS"
                  value={newSportName}
                  onChange={(e) => setNewSportName(e.target.value.toUpperCase())}
                />
                <button className="ah-sport-add" type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add"}
                </button>
              </form>

              <div className="ah-sport-hint">
                Sports will appear in the Add Court dropdown automatically.
              </div>
            </div>

            <div className="ah-sports-card">
              <div className="ah-list-title">All Sports</div>

              {loading ? (
                <div className="ah-empty">Loading...</div>
              ) : sports.length === 0 ? (
                <div className="ah-empty">No sports found</div>
              ) : (
                <div className="ah-sports-list">
                  {sports.map((s) => (
                    <div key={s.SportID} className="ah-sport-row">
                      <div className="ah-sport-name">{String(s.SportName || "").toUpperCase()}</div>
                      <button
                        type="button"
                        className="ah-sport-del"
                        onClick={() => handleDeleteSport(s.SportID, s.SportName)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="ah-sport-hint">
                If a sport is linked to courts or coaches, delete may be blocked by the database.
              </div>
            </div>
          </div>
        </div>

        <div className="ah-modal-foot">
          <button type="button" className="ah-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
