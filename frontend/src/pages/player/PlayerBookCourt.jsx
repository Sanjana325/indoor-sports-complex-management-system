import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SportsCricket, SportsTennis, SportsSoccer, Event, Place, 
  CheckCircle, SportsBasketball, SportsVolleyball, ErrorOutline,
  CreditCard, Receipt
} from "@mui/icons-material";
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Card, Box, Typography, Button, IconButton 
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import "../../styles/PlayerBookCourt.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Map names to icons locally
const ICON_MAP = {
  "Cricket": SportsCricket,
  "Badminton": SportsTennis,
  "Futsal": SportsSoccer,
  "Basketball": SportsBasketball,
  "Volleyball": SportsVolleyball,
};

const DEFAULT_ICON = SportsSoccer;

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

  // API State
  const [sports, setSports] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [apiError, setApiError] = useState("");
  const [availability, setAvailability] = useState({ bookings: [], blocked: [] });
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // UI Selections
  const [selectedSportId, setSelectedSportId] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch Sports on Mount
  useEffect(() => {
    async function fetchSports() {
      try {
        setLoadingSports(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/player/sports`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSports(data.sports || []);
        } else {
          setApiError(data.message || "Failed to load sports");
        }
      } catch (err) {
        setApiError("Connection error. Please try again.");
      } finally {
        setLoadingSports(false);
      }
    }
    fetchSports();
  }, []);

  // Fetch Courts when Sport changes
  useEffect(() => {
    if (!selectedSportId) {
      setCourts([]);
      return;
    }

    async function fetchCourts() {
      try {
        setLoadingCourts(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/player/courts?sportId=${selectedSportId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setCourts(data.courts || []);
        } else {
          setApiError(data.message || "Failed to load courts");
        }
      } catch (err) {
        setApiError("Connection error while loading courts.");
      } finally {
        setLoadingCourts(false);
      }
    }
    fetchCourts();
  }, [selectedSportId]);

  // Fetch Availability when Court or Date changes
  useEffect(() => {
    if (!selectedCourtId || !selectedDate) {
      setAvailability({ bookings: [], blocked: [] });
      return;
    }

    async function fetchAvailability() {
      try {
        setLoadingAvailability(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/player/courts/${selectedCourtId}/availability?date=${selectedDate}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAvailability({
            bookings: data.bookings || [],
            blocked: data.blocked || []
          });
        } else {
          console.error("Failed to load availability", data.message);
        }
      } catch (err) {
        console.error("Connection error while loading availability.", err);
      } finally {
        setLoadingAvailability(false);
      }
    }
    fetchAvailability();
  }, [selectedCourtId, selectedDate]);

  // Derived state
  const selectedSport = useMemo(() => {
    return sports.find(s => String(s.SportID) === String(selectedSportId)) || null;
  }, [sports, selectedSportId]);

  const selectedCourt = useMemo(() => {
    return courts.find(c => String(c.CourtID) === String(selectedCourtId)) || null;
  }, [courts, selectedCourtId]);

  const totalAmount = useMemo(() => {
    if (!selectedCourt) return 0;
    return selectedTimeSlots.length * Number(selectedCourt.PricePerHour || 0);
  }, [selectedTimeSlots, selectedCourt]);

  const isSlotBlocked = (slotId) => {
    const [startH] = slotId.split("-").map(Number);
    const slotStart = new Date(`${selectedDate}T${String(startH).padStart(2, "0")}:00:00`);
    const slotEnd = new Date(`${selectedDate}T${String(startH + 1).padStart(2, "0")}:00:00`);

    // Check bookings
    const hasBooking = availability.bookings.some(b => {
      const bStart = new Date(b.StartDateTime);
      const bEnd = new Date(b.EndDateTime);
      return (slotStart < bEnd && slotEnd > bStart);
    });
    if (hasBooking) return true;

    // Check blocked slots (includes classes)
    const hasBlocked = availability.blocked.some(b => {
      const bStart = new Date(b.StartDateTime);
      const bEnd = new Date(b.EndDateTime);
      return (slotStart < bEnd && slotEnd > bStart);
    });
    if (hasBlocked) return true;

    return false;
  };

  const dynamicTimeSlots = useMemo(() => {
    return TIME_SLOTS.map(slot => ({
      ...slot,
      available: !isSlotBlocked(slot.id)
    }));
  }, [selectedDate, availability, selectedCourtId]);

  // Handlers
  const handleSportSelect = (sportId) => {
    setSelectedSportId(sportId);
    setSelectedCourtId("");
    setSelectedTimeSlots([]);
  };

  const handleTimeSlotToggle = (slotId) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) return prev.filter(id => id !== slotId);
      return [...prev, slotId];
    });
  };

  const handleOpenPayment = () => {
    if (!selectedSportId || !selectedCourtId || !selectedDate || selectedTimeSlots.length === 0) {
      alert("Please complete all selections before confirming.");
      return;
    }
    setPaymentModalOpen(true);
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
            {apiError && <div className="pbc-error-inline"><ErrorOutline fontSize="small" /> {apiError}</div>}
            
            {loadingSports ? (
              <div className="pbc-loading-indicator">Updating available sports...</div>
            ) : (
              <div className="pbc-sports-grid">
                {sports.map((sport) => {
                  const isSelected = String(selectedSportId) === String(sport.SportID);
                  const IconComp = ICON_MAP[sport.SportName] || DEFAULT_ICON;
                  return (
                    <button
                      key={sport.SportID}
                      className={`pbc-sport-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSportSelect(sport.SportID)}
                    >
                      <IconComp className="sport-icon" />
                      <span>{sport.SportName}</span>
                      {isSelected && <CheckCircle className="selected-icon" />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* STEP 2: Date & Space */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">2. Select Date & Space</h2>
            
            {!selectedSportId ? (
              <div className="pbc-hint-box">Please select a sport first.</div>
            ) : loadingCourts ? (
              <div className="pbc-loading-indicator">Finding available courts for {selectedSport?.SportName}...</div>
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
                    {courts.map(c => (
                      <option key={c.CourtID} value={c.CourtID}>
                        {c.CourtName} (LKR {Number(c.PricePerHour).toLocaleString("en-LK")}/hr)
                      </option>
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
                {loadingAvailability ? (
                  <div className="pbc-loading-indicator">Updating slot availability...</div>
                ) : (
                  dynamicTimeSlots.map(slot => {
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
                          <span className="slot-price">LKR {Number(selectedCourt?.PricePerHour || 0).toLocaleString("en-LK")}</span>
                          <span className="slot-badge">{slot.available ? "AVAILABLE" : "BOOKED"}</span>
                        </div>
                      </button>
                    );
                  })
                )}
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
                <span className="summary-value">{selectedSport?.SportName || "-"}</span>
              </div>
              
              <div className="summary-row">
                <span className="summary-label">Court:</span>
                <span className="summary-value">{selectedCourt?.CourtName || "-"}</span>
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
                    <li key={slotId}>{dynamicTimeSlots.find(s => s.id === slotId)?.label}</li>
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
              disabled={!selectedSportId || !selectedCourtId || selectedTimeSlots.length === 0}
              onClick={handleOpenPayment}
            >
              CONFIRM BOOKING
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT SELECTION MODAL */}
      <Dialog 
        open={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "pbc-payment-dialog"
        }}
      >
        <DialogTitle className="pbc-dialog-title">
          Complete Payment
          <IconButton
            aria-label="close"
            onClick={() => setPaymentModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pbc-dialog-content">
          <Typography variant="body1" className="pbc-dialog-subtext">
            Your booking is reserved for 10 minutes. Please complete the payment of <strong>LKR {totalAmount.toLocaleString("en-LK")}</strong> to confirm.
          </Typography>

          <Box className="pbc-payment-options">
            <Card className="pbc-payment-card" onClick={() => console.log('Selected Online')}>
              <CreditCard className="pbc-payment-icon" />
              <Typography variant="h6">Online Payment</Typography>
              <Typography variant="body2">Pay instantly via secure gateway</Typography>
            </Card>

            <Card className="pbc-payment-card" onClick={() => console.log('Selected Bank Transfer')}>
              <Receipt className="pbc-payment-icon" />
              <Typography variant="h6">Bank Transfer</Typography>
              <Typography variant="body2">Upload bank deposit slip</Typography>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions className="pbc-dialog-actions">
          <Button onClick={() => setPaymentModalOpen(false)} className="pbc-cancel-btn">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}