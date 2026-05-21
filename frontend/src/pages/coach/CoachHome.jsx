import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../../services/api";

// main dashboard for coaching staff to manage their work schedule and attendance
export default function CoachHome() {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [attendance, setAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  // retrieves the current coach's full name from local storage for a personalized greeting
  const coachName = useMemo(() => {
    const fn = localStorage.getItem("firstName") || "";
    const ln = localStorage.getItem("lastName") || "";
    return `${fn} ${ln}`.trim() || "Coach";
  }, []);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // downloads assigned classes and sessions to populate the personal work calendar
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/coach/calendar");
      setEvents(res.data.sessions || []);
      setSports(res.data.sports || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  // fetches student enrollment and attendance status for a specific class session
  const fetchAttendance = async (sessionId) => {
    try {
      setLoadingAttendance(true);
      const res = await api.get(`/api/coach/sessions/${sessionId}/attendance`);
      setAttendance(res.data.attendance || []);
    } catch (err) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // triggers the detail popup when a coach clicks on a calendar time-slot
  function handleEventClick(info) {
    const { extendedProps } = info.event;
    const eventData = {
      id: info.event.id,
      title: info.event.title,
      ...extendedProps
    };
    setSelectedEvent(eventData);
    setIsDetailModalOpen(true);
    setShowAttendance(false);
  }

  function handleViewAttendance() {
    setShowAttendance(true);
    if (selectedEvent && attendance.length === 0) {
      fetchAttendance(selectedEvent.id);
    }
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setSelectedEvent(null);
    setAttendance([]);
    setShowAttendance(false);
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title">Welcome back, {coachName}!</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Here is your personal schedule for today and upcoming classes.</p>
        </div>
      </div>

      {/* color legend to help distinguish between different sports on the calendar */}
      {sports.length > 0 && (
        <div className="arena-legend">
          {sports.map(s => (
            <div key={s.SportID} className="arena-legend-item">
              <span className="arena-legend-dot" style={{ backgroundColor: s.ColorCode || "#1976d2" }}></span>
              <span className="arena-legend-name">{s.SportName}</span>
            </div>
          ))}
        </div>
      )}

      <div className="arena-card" style={{ padding: '20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading Schedule...</div>
        )}

        {error && <div style={{ color: 'var(--primary)', marginBottom: '10px' }}>{error}</div>}

        {/* interactive main calendar showing daily and weekly class sessions */}
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
        />
      </div>

      {/* detailed drill-down modal reveal when clicking a session */}
      {isDetailModalOpen && selectedEvent && (
        <div className="detail-modal-backdrop" onClick={closeDetailModal} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="arena-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={closeDetailModal} style={{
              position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)'
            }}>×</button>

            <h2 className="mb-1" style={{ fontSize: '1.25rem' }}>Session Details</h2>
            <div style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>

            <div className="arena-list">
              <div className="arena-list-item">
                <span className="form-label" style={{ margin: 0 }}>Class:</span>
                <span style={{ fontWeight: 600 }}>{selectedEvent.title}</span>
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

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '15px 0' }}></div>
              
              {/* toggles between basic session info and the student attendance list */}
              {!showAttendance ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleViewAttendance}
                  >
                    View Attendance Record
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="mb-2" style={{ fontSize: '1rem' }}>Attendance Record</h3>
                  <div className="arena-scroll-area">
                    {loadingAttendance ? (
                      <div style={{ textAlign: 'center', padding: '10px' }}>Loading records...</div>
                    ) : attendance.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)' }}>No students enrolled.</div>
                    ) : (
                      <div className="arena-list">
                        {attendance.map(a => (
                          <div key={a.studentId} className="arena-list-item">
                            <span style={{ fontWeight: 500 }}>{a.FirstName} {a.LastName}</span>
                            <span className={`status-pill ${a.status.toLowerCase() === 'present' ? 'success' : 'info'}`}>
                              {a.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex-between mt-2">
              <button className="btn btn-primary" onClick={() => window.location.href = '/coach/my-classes'}>View Class List</button>
              <button className="btn btn-secondary" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
