import { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/AdminCalendar.css"; // Reuse the same styles

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function StaffHome() {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [courtsData, setCourtsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courtFilter, setCourtFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      // Pointing to ADMIN endpoints which are now STAFF-enabled
      const [bookRes, sessRes, sportRes, courtRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/classes/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/sports`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/courts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!bookRes.ok || !sessRes.ok || !sportRes.ok || !courtRes.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const bookData = await bookRes.json();
      const sessData = await sessRes.json();
      const sData = await sportRes.json();
      const cData = await courtRes.json();

      setSports(sData.sports || []);
      setCourtsData(cData.courts || []);

      // Transform Bookings
      const bookingEvents = (bookData.bookings || [])
        .filter((b) => b.status !== "EXPIRED" && b.status !== "CANCELLED")
        .map((b) => {
        const [startT, endT] = b.time.split(" - ");
        return {
          id: b.id,
          title: `Booking: ${b.playerName} (${b.court})`,
          start: `${b.date}T${startT}:00`,
          end: `${b.date}T${endT}:00`,
          backgroundColor: b.sportColor || "#6366f1",
          borderColor: b.sportColor || "#4f46e5",
          extendedProps: {
            type: "BOOKING",
            playerName: b.playerName,
            phoneNumber: b.phoneNumber,
            sportName: b.sportName,
            court: b.court,
            time: b.time,
            price: Number(b.pricePerHour) * ((new Date(b.endRaw) - new Date(b.startRaw)) / (1000 * 60 * 60)),
            status: b.status,
          },
        };
      });

      // Sessions
      const sessionEvents = (sessData.sessions || []).filter(s => s.extendedProps.status !== 'CANCELLED');

      setEvents([...bookingEvents, ...sessionEvents]);
    } catch (err) {
      console.error(err);
      setError("Error loading calendar data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleEventClick(info) {
    const { extendedProps, title } = info.event;
    setSelectedEvent({
        id: info.event.id,
        title: info.event.title,
        ...extendedProps
    });
    setIsDetailModalOpen(true);
  }

  const filteredEvents = useMemo(() => {
    if (courtFilter === "ALL") return events;
    return events.filter((e) => {
      const courtStr = String(e.extendedProps.court || "").toLowerCase();
      const filterStr = courtFilter.toLowerCase();
      return courtStr.includes(filterStr);
    });
  }, [events, courtFilter]);

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="header-top">
          <div>
            <h1 className="calendar-title">ArenaPro Schedule</h1>
            <p className="calendar-subtitle">View and monitor all complex activities in real-time.</p>
          </div>
          
          <div className="header-filters">
            <label className="filter-label">Court Filter:</label>
            <select 
              className="court-select"
              value={courtFilter} 
              onChange={(e) => setCourtFilter(e.target.value)}
            >
              <option value="ALL">All Courts</option>
              {courtsData.map(c => (
                <option key={c.CourtID} value={c.CourtName}>{c.CourtName}</option>
              ))}
            </select>
          </div>
        </div>
        
        {sports.length > 0 && (
          <div className="sport-legend-top">
            {sports.map(s => (
              <div key={s.SportID} className="legend-item-top">
                <span className="legend-blob-top" style={{ backgroundColor: s.ColorCode || "#1976d2" }}></span>
                <span className="legend-name-top">{s.SportName}</span>
              </div>
            ))}
            <div className="legend-item-top">
              <span className="legend-blob-top" style={{ backgroundColor: "#6366f1" }}></span>
              <span className="legend-name-top">Bookings</span>
            </div>
          </div>
        )}
      </div>

      <div className="calendar-container">
        {loading && (
          <div className="calendar-overlay">
            <div className="loader">Loading...</div>
          </div>
        )}

        {error && <div className="calendar-error">{error}</div>}

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={filteredEvents}
          eventClick={handleEventClick}
          height="750px"
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
        <div className="detail-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
            <div className="detail-modal-card" onClick={e => e.stopPropagation()}>
                <button className="detail-modal-close" onClick={() => setIsDetailModalOpen(false)}>×</button>
                
                <h2 className="detail-modal-title">
                    {selectedEvent.type === 'BOOKING' ? 'Booking Details' : 'Session Details'}
                </h2>
                
                <div className="detail-modal-divider"></div>
                
                <div className="detail-modal-body">
                    {selectedEvent.type === 'BOOKING' ? (
                        <>
                            <div className="detail-row">
                                <span className="detail-label">Customer:</span>
                                <span className="detail-value">
                                    <span className="detail-icon">👤</span> 
                                    [{selectedEvent.court}] {selectedEvent.playerName}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{selectedEvent.phoneNumber || 'N/A'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Sport:</span>
                                <span className="detail-value">{selectedEvent.sportName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Court:</span>
                                <span className="detail-value">{selectedEvent.court}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Time:</span>
                                <span className="detail-value">{selectedEvent.time}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Price:</span>
                                <span className="detail-value">LKR {selectedEvent.price.toFixed(2)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className={`status-pill status-${selectedEvent.status.toLowerCase()}`}>
                                    {selectedEvent.status}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="detail-row">
                                <span className="detail-label">Class:</span>
                                <span className="detail-value">{selectedEvent.title}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Coach:</span>
                                <span className="detail-value">{selectedEvent.coach}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{selectedEvent.coachPhone}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Sport:</span>
                                <span className="detail-value">{selectedEvent.sport}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Court:</span>
                                <span className="detail-value">{selectedEvent.court}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Time:</span>
                                <span className="detail-value">{selectedEvent.time}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className={`status-pill status-${selectedEvent.status.toLowerCase()}`}>
                                    {selectedEvent.status}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="detail-modal-footer">
                    {/* For Staff, we only provide a link to Payments for verification if needed */}
                    <button className="detail-btn-primary" onClick={() => window.location.href = '/staff/payments'}>View Payments</button>
                    <button className="detail-btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
