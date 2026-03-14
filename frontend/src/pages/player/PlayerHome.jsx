import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Event, SportsEsports, Schedule } from "@mui/icons-material";
import "../../styles/PlayerHome.css";

export default function PlayerHome() {
  const navigate = useNavigate();

  // Mock Data
  const [bookings] = useState([
    { id: "B-700001", playerName: "You", court: "Court A", date: "2025-10-19", time: "16:00-18:00", status: "CONFIRMED" },
    { id: "B-700002", playerName: "You", court: "Court B", date: "2025-10-21", time: "10:00-12:00", status: "PENDING_PAYMENT" },
  ]);

  const [blockedSlots] = useState([
    { id: "BS-900001", court: "Court A", date: "2025-10-20", startTime: "12:00", endTime: "14:00", reason: "Maintenance" },
  ]);

  // Derive today's date for availability
  const [selectedDateISO] = useState(() => {
    const d = new Date();
    const pad2 = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });

  // Next booking logic
  const nextBooking = useMemo(() => bookings[0] || null, [bookings]);

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

  function onBookCourt() {
    navigate("/player/book-court");
  }

  function onViewClasses() {
    navigate("/player/available-classes");
  }

  return (
    <div className="ph-page glass-page">
      <div className="ph-container">
        
        {/* HERO SECTION */}
        <section className="ph-hero glass-panel">
          <div className="ph-hero-text">
            <h1 className="ph-title-glass">Welcome to the Arena!</h1>
            <p className="ph-subtitle-glass">Your personal sports dashboard.</p>
          </div>
          
          <div className="ph-hero-widget glass-widget">
            <h3 className="widget-title"><Schedule fontSize="small" /> Next Upcoming Booking</h3>
            {nextBooking ? (
              <div className="next-booking-details">
                <div className="nb-court">{nextBooking.court}</div>
                <div className="nb-time">{nextBooking.date} • {nextBooking.time}</div>
                <div className={`nb-status status-${nextBooking.status.toLowerCase()}`}>{nextBooking.status}</div>
              </div>
            ) : (
              <div className="no-booking">No upcoming bookings.</div>
            )}
          </div>
        </section>

        <div className="ph-main-grid">
          {/* QUICK ACTIONS */}
          <section className="ph-quick-actions">
            <h2 className="section-title-glass">Quick Actions</h2>
            <div className="quick-actions-grid">
              <button className="action-card glass-button" onClick={onBookCourt}>
                <Event className="action-icon vibrant-icon" />
                <span>Book a Court</span>
              </button>
              <button className="action-card glass-button" onClick={onViewClasses}>
                <SportsEsports className="action-icon vibrant-icon" />
                <span>Join a Class</span>
              </button>
            </div>
          </section>

          {/* AVAILABILITY WIDGET */}
          <section className="ph-availability-widget glass-panel">
            <h2 className="section-title-glass">Today's Availability</h2>
            <div className="availability-list">
              {availability.map((court, idx) => (
                <div key={idx} className={`avail-item status-${court.statusKey}`}>
                  <span className="avail-court-name">{court.name}</span>
                  <span className="avail-status-badge">{court.statusLabel}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}