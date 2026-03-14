import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SportsCricket, SportsTennis, SportsSoccer, Event, Place, CheckCircle } from "@mui/icons-material";
import "../../styles/PlayerBookCourt.css";

const SPORTS = [
  { id: "Cricket", name: "Cricket", Icon: SportsCricket },
  { id: "Badminton", name: "Badminton", Icon: SportsTennis },
  { id: "Futsal", name: "Futsal", Icon: SportsSoccer },
];

const COURTS = [
  { id: "CRT-CR-A", sport: "Cricket", name: "Cricket Court A", price: 1500 },
  { id: "CRT-CR-B", sport: "Cricket", name: "Cricket Court B", price: 1500 },
  { id: "CRT-FU-A", sport: "Futsal", name: "Futsal Court A", price: 2000 },
  { id: "CRT-BD-A", sport: "Badminton", name: "Badminton Court A", price: 1000 },
  { id: "CRT-BD-B", sport: "Badminton", name: "Badminton Court B", price: 1000 },
];

const TIME_SLOTS = [
  { id: "08-09", label: "08:00 AM - 09:00 AM", available: true },
  { id: "09-10", label: "09:00 AM - 10:00 AM", available: true },
  { id: "10-11", label: "10:00 AM - 11:00 AM", available: false },
  { id: "11-12", label: "11:00 AM - 12:00 PM", available: true },
  { id: "12-13", label: "12:00 PM - 01:00 PM", available: true },
  { id: "13-14", label: "01:00 PM - 02:00 PM", available: true },
  { id: "14-15", label: "02:00 PM - 03:00 PM", available: false },
  { id: "15-16", label: "03:00 PM - 04:00 PM", available: true },
  { id: "16-17", label: "04:00 PM - 05:00 PM", available: true },
  { id: "17-18", label: "05:00 PM - 06:00 PM", available: true },
  { id: "18-19", label: "06:00 PM - 07:00 PM", available: true },
  { id: "19-20", label: "07:00 PM - 08:00 PM", available: true },
];

function todayISO() {
  const d = new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function PlayerBookCourt() {
  const navigate = useNavigate();

  // State
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  // Derived state
  const availableCourts = useMemo(() => {
    return COURTS.filter(c => c.sport === selectedSport);
  }, [selectedSport]);

  const selectedCourt = useMemo(() => {
    return COURTS.find(c => c.id === selectedCourtId) || null;
  }, [selectedCourtId]);

  const totalAmount = useMemo(() => {
    if (!selectedCourt) return 0;
    return selectedTimeSlots.length * selectedCourt.price;
  }, [selectedTimeSlots, selectedCourt]);

  // Handlers
  const handleSportSelect = (sportId) => {
    setSelectedSport(sportId);
    setSelectedCourtId("");
    setSelectedTimeSlots([]);
  };

  const handleTimeSlotToggle = (slotId) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) return prev.filter(id => id !== slotId);
      return [...prev, slotId];
    });
  };

  const handleConfirm = () => {
    if (!selectedSport || !selectedCourtId || !selectedDate || selectedTimeSlots.length === 0) {
      alert("Please complete all selections before confirming.");
      return;
    }
    alert("Booking Confirmed!");
    navigate("/player/my-bookings");
  };

  return (
    <div className="pbc-page">
      <div className="pbc-header">
        <h1 className="pbc-title-glass">Book a Court</h1>
        <button className="pbc-back-btn" onClick={() => navigate("/player")}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="pbc-layout">
        {/* LEFT COLUMN: Main Flow (70%) */}
        <div className="pbc-main-flow">
          
          {/* STEP 1: Select Sport */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">1. Select Sport</h2>
            <div className="pbc-sports-grid">
              {SPORTS.map((sport) => {
                const isSelected = selectedSport === sport.id;
                return (
                  <button
                    key={sport.id}
                    className={`pbc-sport-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSportSelect(sport.id)}
                  >
                    <sport.Icon className="sport-icon" />
                    <span>{sport.name}</span>
                    {isSelected && <CheckCircle className="selected-icon" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2: Date & Space */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">2. Select Date & Space</h2>
            
            {!selectedSport ? (
              <div className="pbc-hint-box">Please select a sport first.</div>
            ) : (
              <div className="pbc-inline-selectors">
                <div className="pbc-control">
                  <label><Event fontSize="small" /> Date</label>
                  <input 
                    type="date" 
                    className="pbc-input-glass"
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    min={todayISO()}
                  />
                </div>
                
                <div className="pbc-control">
                  <label><Place fontSize="small" /> Court</label>
                  <select 
                    className="pbc-input-glass"
                    value={selectedCourtId}
                    onChange={(e) => {
                      setSelectedCourtId(e.target.value);
                      setSelectedTimeSlots([]);
                    }}
                  >
                    <option value="">-- Choose Court --</option>
                    {availableCourts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (LKR {c.price}/hr)</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* STEP 3: Available Time Slots */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">3. Available Time Slots</h2>
            
            {!selectedCourtId ? (
              <div className="pbc-hint-box">Please select a court and date to view time slots.</div>
            ) : (
              <div className="pbc-slots-grid">
                {TIME_SLOTS.map(slot => {
                  const isSelected = selectedTimeSlots.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      className={`pbc-slot-card ${slot.available ? "available" : "unavailable"} ${isSelected ? "selected" : ""}`}
                      onClick={() => slot.available && handleTimeSlotToggle(slot.id)}
                      disabled={!slot.available}
                    >
                      <div className="slot-time">{slot.label}</div>
                      <div className="slot-price-badge">
                        <span className="slot-price">LKR {selectedCourt?.price || 0}</span>
                        <span className="slot-badge">{slot.available ? "AVAILABLE" : "BOOKED"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: Sticky Summary (30%) */}
        <div className="pbc-sidebar">
          <div className="pbc-summary-card glass-panel sticky">
            <h3 className="summary-title">Booking Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span className="summary-label">Sport:</span>
                <span className="summary-value">{selectedSport || "-"}</span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Court:</span>
                <span className="summary-value">{selectedCourt?.name || "-"}</span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Date:</span>
                <span className="summary-value">{selectedDate || "-"}</span>
              </div>
              
              <div className="summary-row separator">
                <span className="summary-label">Time Slots ({selectedTimeSlots.length}):</span>
              </div>
              
              {selectedTimeSlots.length > 0 ? (
                <ul className="summary-slots-list">
                  {selectedTimeSlots.map(slotId => (
                    <li key={slotId}>{TIME_SLOTS.find(s => s.id === slotId)?.label}</li>
                  ))}
                </ul>
              ) : (
                <div className="summary-empty-slots">No slots selected.</div>
              )}
            </div>
            
            <div className="summary-total-section">
              <div className="summary-total-label">Total</div>
              <div className="summary-total-amount">LKR {totalAmount.toLocaleString("en-LK")}</div>
            </div>

            <button 
              className="pbc-confirm-btn"
              disabled={!selectedSport || !selectedCourtId || selectedTimeSlots.length === 0}
              onClick={handleConfirm}
            >
              CONFIRM BOOKING
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}