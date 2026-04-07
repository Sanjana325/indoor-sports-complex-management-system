import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/CoachHome.css";

export default function CoachHome() {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const coachName = useMemo(() => {
    const fn = localStorage.getItem("firstName") || "";
    const ln = localStorage.getItem("lastName") || "";
    return `${fn} ${ln}`.trim() || "Coach";
  }, []);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/coach/calendar`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.sessions || []);
        setSports(data.sports || []);
      } else {
        setError(data.message || "Failed to fetch calendar data");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  function handleEventClick(info) {
    const { extendedProps, title } = info.event;
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      ...extendedProps
    });
    setIsDetailModalOpen(true);
  }

  return (
    <div className="ch-page">
      <div className="ch-header">
        <div className="ch-header-left">
          <h1 className="ch-title">Welcome back, {coachName}!</h1>
          <p className="ch-subtitle">Here is your personal schedule for today and upcoming classes.</p>
        </div>
      </div>

      {sports.length > 0 && (
        <div className="ch-legend">
          {sports.map(s => (
            <div key={s.SportID} className="ch-legend-item">
              <span className="ch-legend-blob" style={{ backgroundColor: s.ColorCode || "#1976d2" }}></span>
              <span className="ch-legend-name">{s.SportName}</span>
            </div>
          ))}
        </div>
      )}

      <div className="ch-calendar-container">
        {loading && (
          <div className="ch-overlay">
            <div className="ch-loader">Loading Schedule...</div>
          </div>
        )}

        {error && <div className="ch-error">{error}</div>}

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          height="700px"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          dayMaxEvents={true}
          nowIndicator={true}
          themeSystem="standard"
        />
      </div>

      {isDetailModalOpen && selectedEvent && (
        <div className="ch-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div className="ch-modal-card" onClick={e => e.stopPropagation()}>
            <button className="ch-modal-close" onClick={() => setIsDetailModalOpen(false)}>×</button>

            <h2 className="ch-modal-title">Session Details</h2>
            <div className="ch-modal-divider"></div>

            <div className="ch-modal-body">
              <div className="ch-modal-row">
                <span className="ch-modal-label">Class:</span>
                <span className="ch-modal-value">{selectedEvent.title}</span>
              </div>
              <div className="ch-modal-row">
                <span className="ch-modal-label">Sport:</span>
                <span className="ch-modal-value">{selectedEvent.sport}</span>
              </div>
              <div className="ch-modal-row">
                <span className="ch-modal-label">Court:</span>
                <span className="ch-modal-value">{selectedEvent.court}</span>
              </div>
              <div className="ch-modal-row">
                <span className="ch-modal-label">Time:</span>
                <span className="ch-modal-value">{selectedEvent.time}</span>
              </div>
              <div className="ch-modal-row">
                <span className="ch-modal-label">Status:</span>
                <span className={`ch-status-pill ch-status-${selectedEvent.status.toLowerCase()}`}>
                  {selectedEvent.status}
                </span>
              </div>
            </div>

            <div className="ch-modal-footer">
              <button className="ch-modal-btn" onClick={() => window.location.href = '/coach/my-classes'}>View Class In List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
