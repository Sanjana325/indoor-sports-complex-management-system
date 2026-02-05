import { useMemo, useState } from "react";
import "../../styles/PlayerMyClasses.css";

function formatLKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `LKR ${num.toLocaleString("en-LK")}`;
}

function formatSchedule(c) {
  if (c.scheduleType === "ONETIME") {
    return `${c.oneTimeDate} | ${c.startTime} - ${c.endTime}`;
  }
  return `${c.days.join(", ")} | ${c.startTime} - ${c.endTime}`;
}

function statusPillClass(status) {
  const s = status.toUpperCase();
  if (s === "PAID") return "pmc-pill paid";
  if (s === "PENDING_VERIFICATION") return "pmc-pill pending";
  return "pmc-pill paid";
}

function statusLabel(status) {
  if (status === "PAID") return "Paid";
  if (status === "PENDING_VERIFICATION") return "Pending Verification";
  return status;
}

export default function PlayerMyClasses() {
  const [selectedCoach, setSelectedCoach] = useState(null);

  const [classes] = useState([
    {
      enrollmentId: "ENR-500001",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      coachSpecialization: "Cricket Batting & Bowling Techniques",
      coachQualification: "Level 2 Cricket Coach, ICC Certified",
      scheduleType: "WEEKLY",
      days: ["Mon", "Wed"],
      oneTimeDate: "",
      startTime: "16:00",
      endTime: "17:30",
      billingType: "MONTHLY",
      fee: 2500,
      paymentStatus: "PAID",
      nextPaymentDue: "2026-02",
    },
    {
      enrollmentId: "ENR-500002",
      className: "Futsal Training",
      coachName: "Kasun Silva",
      coachSpecialization: "Futsal Strategy & Team Play",
      coachQualification: "UEFA B License, 10+ years experience",
      scheduleType: "WEEKLY",
      days: ["Sat"],
      oneTimeDate: "",
      startTime: "09:00",
      endTime: "10:30",
      billingType: "MONTHLY",
      fee: 3000,
      paymentStatus: "PENDING_VERIFICATION",
      nextPaymentDue: "2026-02",
    },
    {
      enrollmentId: "ENR-500003",
      className: "Chess for Beginners",
      coachName: "Ishan Fernando",
      coachSpecialization: "Chess Fundamentals & Strategy",
      coachQualification: "FIDE Master, National Champion 2022",
      scheduleType: "ONETIME",
      days: [],
      oneTimeDate: "2026-02-02",
      startTime: "10:00",
      endTime: "12:00",
      billingType: "ONE_TIME",
      fee: 2000,
      paymentStatus: "PAID",
      nextPaymentDue: null,
    },
  ]);

  const tiles = useMemo(() => classes, [classes]);

  const handleViewCoach = (classItem) => {
    setSelectedCoach({
      name: classItem.coachName,
      specialization: classItem.coachSpecialization,
      qualification: classItem.coachQualification,
    });
  };

  const closeCoachModal = () => {
    setSelectedCoach(null);
  };

  return (
    <div className="pmc-page">
      <div className="pmc-container">
        <header className="pmc-header">
          <div className="pmc-header-content">
            <h1 className="pmc-title">My Classes</h1>
            <p className="pmc-subtitle">View and manage your enrolled classes</p>
          </div>
        </header>

        {tiles.length === 0 ? (
          <div className="pmc-empty-state">
            <svg className="pmc-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3 className="pmc-empty-title">No enrolled classes yet</h3>
            <p className="pmc-empty-text">Your paid classes will appear here once you enroll.</p>
          </div>
        ) : (
          <div className="pmc-grid">
            {tiles.map((c) => (
              <div key={c.enrollmentId} className="pmc-class-card">
                <div className="pmc-card-header">
                  <div className="pmc-class-info">
                    <h3 className="pmc-class-name">{c.className}</h3>
                    <div className="pmc-enrollment-id">#{c.enrollmentId}</div>
                  </div>
                  <span className={statusPillClass(c.paymentStatus)}>
                    {statusLabel(c.paymentStatus)}
                  </span>
                </div>

                <div className="pmc-card-body">
                  <div className="pmc-detail-row">
                    <div className="pmc-detail-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="pmc-detail-content">
                      <span className="pmc-detail-label">Coach</span>
                      <div className="pmc-coach-row">
                        <span className="pmc-detail-value">{c.coachName}</span>
                        <button 
                          type="button" 
                          className="pmc-view-more-btn"
                          onClick={() => handleViewCoach(c)}
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pmc-detail-row">
                    <div className="pmc-detail-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="pmc-detail-content">
                      <span className="pmc-detail-label">Schedule</span>
                      <span className="pmc-detail-value">{formatSchedule(c)}</span>
                    </div>
                  </div>

                  <div className="pmc-detail-row">
                    <div className="pmc-detail-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div className="pmc-detail-content">
                      <span className="pmc-detail-label">
                        {c.billingType === "ONE_TIME" ? "One-time Fee" : "Monthly Fee"}
                      </span>
                      <span className="pmc-detail-value pmc-fee">{formatLKR(c.fee)}</span>
                    </div>
                  </div>

                  {c.billingType === "MONTHLY" && c.nextPaymentDue && (
                    <div className="pmc-payment-due">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>Next payment due: <strong>{c.nextPaymentDue}</strong></span>
                    </div>
                  )}

                  {c.paymentStatus === "PENDING_VERIFICATION" && (
                    <div className="pmc-verification-notice">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>Payment submitted. Waiting for admin verification.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach Details Modal */}
      {selectedCoach && (
        <div className="pmc-modal-overlay" onClick={closeCoachModal}>
          <div className="pmc-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="pmc-modal-close" onClick={closeCoachModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="pmc-modal-header">
              <div className="pmc-modal-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h2 className="pmc-modal-title">{selectedCoach.name}</h2>
            </div>

            <div className="pmc-modal-body">
              <div className="pmc-modal-section">
                <div className="pmc-modal-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  Specialization
                </div>
                <p className="pmc-modal-text">{selectedCoach.specialization}</p>
              </div>

              <div className="pmc-modal-section">
                <div className="pmc-modal-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                  Qualification
                </div>
                <p className="pmc-modal-text">{selectedCoach.qualification}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}