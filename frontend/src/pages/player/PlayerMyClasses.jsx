import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Person, 
  Place, 
  ArrowBack,
  Payments,
  Schedule,
  School,
  ErrorOutline
} from "@mui/icons-material";
import "../../styles/PlayerTables.css";
import ClassPaymentModal from "../../components/ClassPaymentModal";
import playerService from "../../services/playerService";

const DAY_MAP = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t) {
  if (!t) return "";
  const timeStr = String(t);
  return timeStr.includes(':') ? timeStr.slice(0, 5) : timeStr;
}

function formatScheduleDetailed(c) {
  const start = formatTime(c.StartTime);
  const end = formatTime(c.EndTime);
  const timeRange = start && end ? `${start} - ${end}` : (start || end || "");

  if (c.ScheduleType === "ONETIME") {
    return `One-Time | ${timeRange || "No time set"}`;
  }

  if (c.Weekdays) {
    try {
      const days = String(c.Weekdays).split(',')
        .map(d => {
          const idx = parseInt(d.trim());
          return !isNaN(idx) ? DAY_MAP[idx] : d;
        })
        .filter(d => d)
        .join(", ");
      return days ? `${days} | ${timeRange}` : timeRange;
    } catch (e) {
      console.error("[Format] Weekdays error:", e);
    }
  }
  
  return timeRange || "Schedule TBA";
}

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

export default function PlayerMyClasses() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payClassData, setPayClassData] = useState(null);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const data = await playerService.getMyClasses();
      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClass = async (enrollmentId) => {
    if (!window.confirm("Are you sure you want to leave this class? Recurring payments will be stopped.")) return;
    try {
      await playerService.leaveClass(enrollmentId);
      alert("Successfully left the class.");
      fetchMyClasses();
    } catch (err) {
      alert(err.response?.data?.message || "Error leaving class");
    }
  };

  const handlePayNow = (e, enrollment) => {
    e.stopPropagation();
    setPayClassData({
      ClassID: enrollment.ClassID,
      Title: enrollment.Title,
      Fee: enrollment.Fee
    });
    setPaymentModalOpen(true);
  };

  return (
    <div className="pt-page">
      <div className="pt-container">
        {/* HEADER SECTION */}
        <header className="pt-header">
          <div className="pt-header-content">
            <h1 className="pt-title">My Classes</h1>
            <p className="pt-subtitle">Manage your enrollments and track your progress</p>
          </div>

          <button 
            className="pt-sort" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate("/player")}
          >
            <ArrowBack sx={{ fontSize: '1.1rem' }} />
            Dashboard
          </button>
        </header>

        {/* CONTENT */}
        {loading ? (
          <div className="pt-loading-indicator">Loading your classes...</div>
        ) : error ? (
           <div className="pt-empty-state">
              <ErrorOutline className="pt-empty-icon" />
              <h3 className="pt-empty-title">Something went wrong</h3>
              <p className="pt-empty-text">{error}</p>
           </div>
        ) : enrollments.length === 0 ? (
          <div className="pt-empty-state">
            <School className="pt-empty-icon" style={{ fontSize: '4rem' }} />
            <h3 className="pt-empty-title">No enrolled classes yet</h3>
            <p className="pt-empty-text">Join a class to start your training journey at ArenaPro.</p>
          </div>
        ) : (
          <div className="pt-cards">
            {enrollments.map((c) => (
              <div key={c.EnrollmentID} className="pt-booking-card">
                {/* Visual Block */}
                <div className="pt-date-block" style={{ background: 'var(--pt-primary-soft)', border: 'none' }}>
                  <div className="pt-date-month" style={{ background: 'var(--pt-primary)' }}>CLASS</div>
                  <div className="pt-date-day">
                    <School sx={{ color: 'var(--pt-primary)', fontSize: '1.8rem' }} />
                  </div>
                </div>

                {/* Main Content */}
                <div className="pt-booking-main">
                  <div className="pt-booking-header-row">
                    <h3 className="pt-booking-court">{c.Title}</h3>
                    <span className={`pt-pill ${c.PaymentStatus === 'PAID' ? 'confirmed' : 'pending'}`}>
                      {c.PaymentStatus || "ACTIVE"}
                    </span>
                  </div>

                  <div className="pt-booking-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="pt-meta-group">
                      <Person sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase' }}>Coach</span>
                        <span style={{ fontSize: '0.9rem' }}>{c.CoachFirstName} {c.CoachLastName}</span>
                      </div>
                    </div>

                    <div className="pt-meta-group">
                      <Schedule sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase' }}>Schedule</span>
                        <span style={{ fontSize: '0.9rem' }}>{formatScheduleDetailed(c)}</span>
                      </div>
                    </div>

                    <div className="pt-meta-group">
                      <Place sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase' }}>Location</span>
                        <span style={{ fontSize: '0.9rem' }}>{c.CourtNames || "TBA"}</span>
                      </div>
                    </div>

                    <div className="pt-meta-group">
                      <Payments sx={{ fontSize: '1rem', color: 'var(--pt-primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--pt-muted)', textTransform: 'uppercase' }}>Fee</span>
                        <span style={{ fontSize: '0.9rem' }}>{formatLKR(c.Fee)} / {c.BillingType === 'MONTHLY' ? 'Mo' : 'Once'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Alert if Pending */}
                  {c.PaymentStatus !== "PAID" && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '12px 16px', 
                      background: '#fffbeb', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      border: '1px solid #fef3c7'
                    }}>
                      <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 800 }}>Payment is Due</span>
                      <button 
                         className="pt-tab active" 
                         style={{ padding: '6px 16px', fontSize: '0.75rem', background: '#d97706', color: 'white' }}
                         onClick={(e) => handlePayNow(e, c)}
                      >
                        Pay Now
                      </button>
                    </div>
                  )}

                  {/* Footer Action */}
                  <div style={{ 
                    marginTop: '1.25rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid #f1f5f9', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span className="pt-booking-id" style={{ background: 'transparent', padding: 0 }}>Enrollment: #ENR-{c.EnrollmentID}</span>
                    <button 
                      onClick={() => handleLeaveClass(c.EnrollmentID)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#ef4444', 
                        fontWeight: 700, 
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: '0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      Leave Class
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Class Payment Modal */}
      {payClassData && (
          <ClassPaymentModal 
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            classData={payClassData}
            onPaymentSuccess={fetchMyClasses}
          />
      )}
    </div>
  );
}