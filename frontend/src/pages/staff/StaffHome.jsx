import { useState, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../../services/api";

// staff dashboard providing a central calendar view of all venue bookings and classes
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

  // downloads comprehensive calendar data including bookings, classes, sports, and blocks
  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      // access admin data endpoints (now accessible to staff roles)
      const [bookRes, sessRes, sportRes, courtRes, blockRes] = await Promise.all([
        api.get("/api/admin/bookings"),
        api.get("/api/admin/classes/sessions"),
        api.get("/api/admin/sports"),
        api.get("/api/admin/courts"),
        api.get("/api/admin/blocked-slots")
      ]);

      setSports(sportRes.data.sports || []);
      setCourtsData(courtRes.data.courts || []);

      // maps court bookings into standard calendar event objects
      const bookingEvents = (bookRes.data.bookings || [])
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

      const sessionEvents = (sessRes.data.sessions || []);

      // maps administrative maintenance blocks into red-coded calendar events
      const blockedEvents = (blockRes.data.slots || []).map((slot) => {
        return {
          id: `block-${slot.blockedSlotId}`,
          title: `Blocked: ${slot.reason} (${slot.courtName})`,
          start: slot.startDateTime,
          end: slot.endDateTime,
          backgroundColor: "#fee2e2", 
          borderColor: "#ef4444",    
          textColor: "#dc2626",      
          classNames: ["blocked-calendar-event"], 
          extendedProps: {
            type: "BLOCKED",
            court: slot.courtName,
            reason: slot.reason,
            createdBy: `${slot.createdByFirstName} ${slot.createdByLastName}`,
            time: `${new Date(slot.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(slot.endDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
            status: "BLOCKED"
          }
        };
      });

      setEvents([...bookingEvents, ...sessionEvents, ...blockedEvents]);
    } catch (err) {
      console.error(err);
      setError("Error loading calendar data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // populates and opens the record detail modal when an event is clicked
  function handleEventClick(info) {
    const { extendedProps, title } = info.event;
    setSelectedEvent({
        id: info.event.id,
        title: info.event.title,
        ...extendedProps
    });
    setIsDetailModalOpen(true);
  }

  // dynamically filters the master event list by court name
  const filteredEvents = useMemo(() => {
    if (courtFilter === "ALL") return events;
    return events.filter((e) => {
      const courtStr = String(e.extendedProps.court || "").toLowerCase();
      const filterStr = courtFilter.toLowerCase();
      return courtStr.includes(filterStr);
    });
  }, [events, courtFilter]);

  return (
    <div className="admin-content-inner">
      {/* page header with court selection filters */}
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">Arena Schedule</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>View and monitor all complex activities in real-time.</p>
        </div>
        
        <div className="flex-start" style={{ gap: '12px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Court:</label>
          <select 
            className="form-input"
            style={{ width: '180px' }}
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
        
            {/* color legend to help staff distinguish between sports and blocks */}
            <div className="arena-legend">
              {sports.map(s => (
                <div key={s.SportID} className="arena-legend-item">
                  <span className="arena-legend-dot" style={{ backgroundColor: s.ColorCode || "#1976d2" }}></span>
                  <span className="arena-legend-name">{s.SportName}</span>
                </div>
              ))}
              <div className="arena-legend-item">
                <span className="arena-legend-dot" style={{ backgroundColor: "#6366f1" }}></span>
                <span className="arena-legend-name">Bookings</span>
              </div>
              <div className="arena-legend-item">
                <span className="arena-legend-dot" style={{ backgroundColor: "#dc2626" }}></span>
                <span className="arena-legend-name">Blocked</span>
              </div>
            </div>

      <div className="arena-card" style={{ padding: '20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        )}

        {error && <div style={{ color: 'var(--primary)', marginBottom: '10px' }}>{error}</div>}

        {/* full calendar grid with monthly, weekly, and daily views */}
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
          height="800px"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          dayMaxEvents={true}
          nowIndicator={true}
          themeSystem="standard"
          eventDisplay="block"
          // custom renderer for internal event cards with cancellation styling
          eventContent={(arg) => {
            const isCancelled = arg.event.extendedProps.status === 'CANCELLED';
            const isBlocked = arg.event.extendedProps.type === 'BLOCKED';
            const type = arg.event.extendedProps.type;
            
            let displayTitle = arg.event.title;
            if (arg.view.type === 'dayGridMonth') {
              if (type === 'BOOKING') displayTitle = arg.event.extendedProps.playerName;
              if (type === 'SESSION') displayTitle = displayTitle.replace('[CANCELLED] ', '');
            }

            return (
              <div className={`fc-event-main-inner ${isCancelled ? 'is-cancelled' : ''}`} style={{
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isCancelled ? 0.7 : 1,
                textDecoration: isCancelled ? 'line-through' : 'none'
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.7rem', opacity: 0.8 }}>
                   {arg.timeText}
                </span>
                <span style={{ fontWeight: 500 }}>{displayTitle}</span>
                {isCancelled && (
                  <span style={{ 
                    fontSize: '0.6rem', 
                    background: 'rgba(220, 38, 38, 0.2)', 
                    color: '#dc2626',
                    padding: '0 4px',
                    borderRadius: '2px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}>X</span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* drill-down modal providing deep-dive details for any scheduled activity */}
      {isDetailModalOpen && selectedEvent && (
        <div className="detail-modal-backdrop" onClick={() => setIsDetailModalOpen(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="arena-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsDetailModalOpen(false)} style={{
              position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
            }}>×</button>

            <h2 className="mb-1" style={{ fontSize: '1.25rem' }}>
              {selectedEvent.type === 'BOOKING' ? 'Booking Details' : 'Session Details'}
            </h2>

            <div style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>

            <div className="arena-list">
              {selectedEvent.type === 'BOOKING' ? (
                /* comprehensive view of individual player rentals */
                <>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Customer:</span>
                    <span style={{ fontWeight: 600 }}>[{selectedEvent.court}] {selectedEvent.playerName}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Phone:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Sport:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.sportName}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Court:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.court}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Time:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.time}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Price:</span>
                    <span style={{ fontWeight: 600 }}>LKR {selectedEvent.price.toFixed(2)}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Status:</span>
                    <span className={`status-pill ${selectedEvent.status === 'PAID' || selectedEvent.status === 'CONFIRMED' ? 'success' : 'warning'}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                </>
              ) : selectedEvent.type === 'BLOCKED' ? (
                /* technical breakdown of venue maintenance blocks */
                <>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Blocked Court:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.court}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Reason:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.reason}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Time:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.time}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Blocked By:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.createdBy}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Status:</span>
                    <span className="status-pill danger">
                      {selectedEvent.status}
                    </span>
                  </div>
                </>
              ) : (
                /* professional overview of group coaching sessions */
                <>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Class:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.title}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Coach:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.coach}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Phone:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.coachPhone}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Sport:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.sport}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Court:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.court}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Time:</span>
                    <span style={{ fontWeight: 600 }}>{selectedEvent.time}</span>
                  </div>
                  <div className="arena-list-item">
                    <span className="form-label" style={{ margin: 0 }}>Status:</span>
                    <span className={`status-pill ${selectedEvent.status === 'CANCELLED' ? 'danger' : 'success'}`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex-between mt-2">
              <button className="btn btn-primary" onClick={() => window.location.href = '/staff/payments'}>View Payments</button>
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
