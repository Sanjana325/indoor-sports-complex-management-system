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
import api from "../../services/api";


// icons used to visually identify different sports
const ICON_MAP = {
  "Cricket": SportsCricket,
  "Badminton": SportsTennis,
  "Futsal": SportsSoccer,
  "Basketball": SportsBasketball,
  "Volleyball": SportsVolleyball,
};


const DEFAULT_ICON = SportsSoccer;

// system allowed 1-hour time blocks for court reservations
const TIME_SLOTS = [
  { id: "08-09", label: "08:00 AM - 09:00 AM", available: true },
  { id: "09-10", label: "09:00 AM - 10:00 AM", available: true },
  { id: "10-11", label: "10:00 AM - 11:00 AM", available: true },
  { id: "11-12", label: "11:00 AM - 12:00 PM", available: true },
  { id: "12-13", label: "12:00 PM - 01:00 PM", available: true },
  { id: "13-14", label: "01:00 PM - 02:00 PM", available: true },
  { id: "14-15", label: "02:00 PM - 03:00 PM", available: true },
  { id: "15-16", label: "03:00 PM - 04:00 PM", available: true },
  { id: "16-17", label: "04:00 PM - 05:00 PM", available: true },
  { id: "17-18", label: "05:00 PM - 06:00 PM", available: true },
  { id: "18-19", label: "06:00 PM - 07:00 PM", available: true },
  { id: "19-20", label: "07:00 PM - 08:00 PM", available: true },
  { id: "20-21", label: "08:00 PM - 09:00 PM", available: true },
  { id: "21-22", label: "09:00 PM - 10:00 PM", available: true },
  { id: "22-23", label: "10:00 PM - 11:00 PM", available: true },
];


function todayISO() {
  const d = new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}


export default function PlayerBookCourt() {
  const navigate = useNavigate();


  // state management for api data and user selections
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); // 'ONLINE' or 'BANK'


  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalStep, setPaymentModalStep] = useState(1);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [slipFile, setSlipFile] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  // 🔥 RESET booking ID if selections change to prevent stale ID errors
  useEffect(() => {
    setCreatedBookingId(null);
  }, [selectedSportId, selectedCourtId, selectedDate, selectedTimeSlots]);

  // OTP Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [bankDetails, setBankDetails] = useState(null);

  // fetches official bank account details from the centralized backend config
  useEffect(() => {
    async function fetchBankDetails() {
      try {
        const res = await api.get("/api/config/bank-details");
        if (res.data.success) {
          setBankDetails(res.data.bankDetails);
        }
      } catch (err) {
        console.error("Failed to load bank details from server", err);
      }
    }
    fetchBankDetails();

    // define payhere global callbacks
    if (window.payhere) {
      window.payhere.onCompleted = (orderId) => {
        console.log("Payment completed. OrderID:" + orderId);
        // show success and redirect
        alert("Payment successful! Your booking is now confirmed.");
        navigate("/player/my-bookings", { replace: true });
      };

      window.payhere.onDismissed = () => {
        console.log("Payment dismissed");
        alert("Payment window closed. Please complete the payment to confirm your booking.");
      };

      window.payhere.onError = (error) => {
        console.error("Payment Error:", error);
        alert("Payment failed: " + error);
      };
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otpArray];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtpArray(newOtp);
    setOtpCode(newOtp.join(""));

    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpArray[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleResendOtp = async () => {
    await handleConfirmBookingClick();
    setResendTimer(60);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };


  // downloads the master list of all sports offered for booking
  useEffect(() => {
    async function fetchSports() {
      try {
        setLoadingSports(true);
        const res = await api.get("/api/player/sports");
        setSports(res.data.sports || []);
      } catch (err) {
        setApiError(err.response?.data?.message || "Connection error. Please try again.");
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
        const res = await api.get("/api/player/courts", { params: { sportId: selectedSportId } });
        setCourts(res.data.courts || []);
      } catch (err) {
        setApiError(err.response?.data?.message || "Connection error while loading courts.");
      } finally {
        setLoadingCourts(false);
      }
    }
    fetchCourts();
  }, [selectedSportId]);


  // checks the server for existing reservations to prevent double-booking
  useEffect(() => {
    if (!selectedCourtId || !selectedDate) {
      setAvailability({ bookings: [], blocked: [] });
      return;
    }


    async function fetchAvailability() {
      try {
        setLoadingAvailability(true);
        const res = await api.get(`/api/player/courts/${selectedCourtId}/availability`, { 
          params: { date: selectedDate } 
        });
        setAvailability({
          bookings: res.data.bookings || [],
          blocked: res.data.blocked || []
        });
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


  // logically checks if a slot is blocked by a booking, class, or historical date
  const isSlotBlocked = (slotId) => {
    const [startH] = slotId.split("-").map(Number);
    const slotStart = new Date(`${selectedDate}T${String(startH).padStart(2, "0")}:00:00`);
    const slotEnd = new Date(`${selectedDate}T${String(startH + 1).padStart(2, "0")}:00:00`);

    // Check bookings

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
    const isToday = selectedDate === todayISO();
    const now = new Date();

    return TIME_SLOTS.filter(slot => {
      // automatically hide slots that have already started if viewing today's schedule
      if (isToday) {
        const [startH] = slot.id.split("-").map(Number);
        const slotStart = new Date(`${selectedDate}T${String(startH).padStart(2, "0")}:00:00`);
        if (slotStart < now) return false;
      }
      return true;
    }).map(slot => ({
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
      // If adding...
      if (!prev.includes(slotId)) {
        if (prev.length === 0) return [slotId];

        // Ensure new slot is adjacent to current selection
        const newStart = parseInt(slotId.split("-")[0]);
        
        const existingStarts = prev.map(id => parseInt(id.split("-")[0]));
        const minStart = Math.min(...existingStarts);
        const maxStart = Math.max(...existingStarts);

        if (newStart === minStart - 1 || newStart === maxStart + 1) {
          return [...prev, slotId];
        } else {
          alert("Please select contiguous time slots. You cannot leave gaps between your selected hours.");
          return prev;
        }
      } 
      
      // If deselecting...
      else {
        const remaining = prev.filter(id => id !== slotId);
        if (remaining.length <= 1) return remaining;

        // Ensure the remaining set is still contiguous
        const starts = remaining.map(id => parseInt(id.split("-")[0])).sort((a, b) => a - b);
        let isContiguous = true;
        for (let i = 0; i < starts.length - 1; i++) {
          if (starts[i+1] !== starts[i] + 1) {
            isContiguous = false;
            break;
          }
        }

        if (isContiguous) {
          return remaining;
        } else {
          alert("Deselecting this slot would leave a gap. Please deselect from the ends of your selection first.");
          return prev;
        }
      }
    });
  };


  // sends an OTP verification email before finalizing any paid transaction
  const handleConfirmBookingClick = async () => {
    if (!selectedSportId || !selectedCourtId || !selectedDate || selectedTimeSlots.length === 0 || !selectedPaymentMethod) {
      alert("Please complete all selections, including payment method, before confirming.");
      return;
    }

    try {
      setOtpSending(true);
      const res = await api.post("/api/player/otp/generate");
      
      setOtpError("");
      setOtpCode("");
      setOtpArray(["", "", "", "", "", ""]);
      setOtpModalOpen(true);
      if (resendTimer === 0) setResendTimer(60);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error generating OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
       setOtpError("Please enter a valid 6-digit OTP.");
       return;
    }
    try {
      setOtpVerifying(true);
      setOtpError("");
      const res = await api.post("/api/player/otp/verify", { otpCode });
      
      // OTP Validated! Proceed based on pre-selected method
      if (selectedPaymentMethod === 'ONLINE') {
        await handleOnlinePayment();
      } else {
        await handleBankTransferClick();
      }

    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.message || "Error verifying OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOpenPayment = () => {
    if (!selectedSportId || !selectedCourtId || !selectedDate || selectedTimeSlots.length === 0) {
      alert("Please complete all selections before confirming.");
      return;
    }
    setPaymentModalStep(1);
    setSlipFile(null);
    setCreatedBookingId(null);
    setPaymentModalOpen(true);
  };


  // triggers the PayHere redirect for instant online credit/debit card payments
  const handleOnlinePayment = async () => {
    try {
      // 1. Create the booking FIRST (if not already created)
      let bookingId = createdBookingId;
      if (!bookingId) {
        const sortedSlots = [...selectedTimeSlots].sort();
        const startHour = sortedSlots[0].split("-")[0];
        const endHour = sortedSlots[sortedSlots.length - 1].split("-")[1];

        const bookingRes = await api.post("/api/player/bookings", {
          courtId: selectedCourtId,
          sportId: selectedSportId,
          startDateTime: `${selectedDate} ${startHour}:00:00`,
          endDateTime: `${selectedDate} ${endHour}:00:00`
        });

        bookingId = bookingRes.data.bookingId;
        setCreatedBookingId(bookingId);
      }


      // 2. Initiate Payment
      const payRes = await api.post("/api/player/payments/initiate-booking", { bookingId });
      const payData = payRes.data;


      // 3. Construct PayHere Object
      const payment = {
        sandbox: true,
        merchant_id: payData.merchant_id,
        return_url: window.location.origin + "/player/my-bookings",
        cancel_url: window.location.origin + "/player/book-court",
        notify_url: import.meta.env.VITE_PAYHERE_NOTIFY_URL,
        order_id: payData.order_id,
        items: payData.items,
        amount: payData.amount,
        currency: payData.currency,
        first_name: payData.customer_details.first_name,
        last_name: payData.customer_details.last_name,
        email: payData.customer_details.email,
        phone: payData.customer_details.phone,
        address: "N/A",
        city: "Colombo",
        country: "Sri Lanka",
        hash: payData.hash
      };


      // 4. Trigger PayHere
      if (window.payhere) {
        setOtpModalOpen(false);
        window.payhere.startPayment(payment);
      } else {
        alert("PayHere SDK not loaded. Please refresh the page.");
      }


    } catch (err) {
      console.error("Payment Error:", err);
      alert(err.response?.data?.message || "An error occurred during payment initiation.");
    }
  };

  const handleBankTransferClick = async () => {
    try {
      setUploadingSlip(true);

      let bookingId = createdBookingId;
      if (!bookingId) {
        const sortedSlots = [...selectedTimeSlots].sort();
        const startHour = sortedSlots[0].split("-")[0];
        const endHour = sortedSlots[sortedSlots.length - 1].split("-")[1];

        const bookingRes = await api.post("/api/player/bookings", {
          courtId: selectedCourtId,
          sportId: selectedSportId,
          startDateTime: `${selectedDate} ${startHour}:00:00`,
          endDateTime: `${selectedDate} ${endHour}:00:00`
        });

        bookingId = bookingRes.data.bookingId;
        setCreatedBookingId(bookingId);
      }

      setOtpModalOpen(false);
      setPaymentModalOpen(true);
      setPaymentModalStep(2);
      
      // Update state for the submission handler
      setCreatedBookingId(bookingId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error preparing bank transfer booking.");
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleBankSlipSubmit = async () => {
    if (!slipFile) {
      alert("Please select a file to upload.");
      return;
    }
    try {
      setUploadingSlip(true);
      const formData = new FormData();
      formData.append("bookingId", createdBookingId);
      formData.append("slip", slipFile);

      await api.post("/api/player/payments/slip", formData);

      alert("Bank slip uploaded successfully! It is pending admin verification.");
      setPaymentModalOpen(false);
      navigate("/player/my-bookings", { replace: true });
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "An error occurred during slip upload.");
    } finally {
      setUploadingSlip(false);
    }
  };


  return (
    <div className="pbc-page">
      {/* interactive booking workflow with live price calculation */}
      <div className="pbc-header">
        <h1 className="pbc-title-glass">Book a Court</h1>
        <button className="pbc-back-btn" onClick={() => navigate("/player")}>
          ← Back to Dashboard
        </button>
      </div>


      <div className="pbc-layout">
        {/* LEFT COLUMN: Main Flow (70%) */}
        <div className="pbc-main-flow">

          {/* step 1: browser based selection of the primary sport category */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">
              <span className="pbc-step-badge">1</span>
              Select Sport
            </h2>
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
            <h2 className="pbc-section-title">
              <span className="pbc-step-badge">2</span>
              Select Date & Space
            </h2>

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
          {/* step 3: real-time grid for selecting available 1-hour time blocks */}
          <section className="pbc-section glass-panel">
            <h2 className="pbc-section-title">
              <span className="pbc-step-badge">3</span>
              Available Time Slots
            </h2>

            {!selectedCourtId ? (
              <div className="pbc-hint-box">Please select a court and date to view time slots.</div>
            ) : (
              <div className="pbc-slots-grid">
                {loadingAvailability ? (
                  <div className="pbc-loading-indicator">Updating slot availability...</div>
                ) : dynamicTimeSlots.length === 0 ? (
                  <div className="pbc-hint-box" style={{ gridColumn: "1 / -1" }}>No available slots for this date.</div>
                ) : (
                  dynamicTimeSlots.map(slot => {
                    const isSelected = selectedTimeSlots.includes(slot.id);
                    const isAvailable = slot.available;
                    
                    return (
                      <button
                        key={slot.id}
                        className={`pbc-slot-card ${isAvailable ? "available" : "booked"} ${isSelected ? "selected" : ""}`}
                        onClick={() => isAvailable && handleTimeSlotToggle(slot.id)}
                        disabled={!isAvailable}
                      >
                        <div className="slot-time">{slot.label}</div>
                        <div className="slot-price-badge">
                          <span className="slot-price">LKR {Number(selectedCourt?.PricePerHour || 0).toLocaleString("en-LK")}</span>
                          <span className={`slot-badge ${isAvailable ? "" : "booked"}`}>
                            {isAvailable ? "AVAILABLE" : "BOOKED"}
                          </span>
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
        {/* summary sidebar providing a breakdown of costs and selection details */}
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

            {/* PAYMENT METHOD SELECTION */}
            {selectedTimeSlots.length > 0 && (
              <div className="pbc-sidebar-payment-section">
                <div className="pbc-sidebar-payment-title">Select Payment Method</div>
                {!selectedPaymentMethod && (
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', mb: 1.5, display: 'block', fontStyle: 'italic' }}>
                    * Please select a payment method before confirming.
                  </Typography>
                )}
                <div className="pbc-sidebar-payment-grid">
                  <Card 
                    className={`pbc-payment-card sidebar-mode ${selectedPaymentMethod === 'ONLINE' ? 'selected-payment' : ''}`} 
                    onClick={() => setSelectedPaymentMethod('ONLINE')}
                  >
                    <CreditCard className="pbc-payment-icon" />
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Pay Online</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>Instant confirmation</Typography>
                    </div>
                  </Card>

                  <Card 
                    className={`pbc-payment-card sidebar-mode ${selectedPaymentMethod === 'BANK' ? 'selected-payment' : ''}`} 
                    onClick={() => setSelectedPaymentMethod('BANK')}
                  >
                    <Receipt className="pbc-payment-icon" />
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>Bank Slip</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>Manual verification</Typography>
                    </div>
                  </Card>
                </div>

                {selectedPaymentMethod === 'BANK' && (
                  <Box sx={{ mt: 2, animation: 'pbc-fade-in 0.3s ease-out' }}>
                    <Box className="pbc-bank-details-card" style={{ marginTop: 0, padding: '12px' }}>
                        <div className="bank-info-row">
                            <span className="info-label">Bank</span>
                            <span className="info-value">{bankDetails?.bankName || "Loading..."}</span>
                        </div>
                        <div className="bank-info-row">
                            <span className="info-label">Branch</span>
                            <span className="info-value">{bankDetails?.branch || "Loading..."}</span>
                        </div>
                        <div className="bank-info-row">
                            <span className="info-label">Owner</span>
                            <span className="info-value">{bankDetails?.accountName || "Loading..."}</span>
                        </div>
                        <div className="bank-info-row">
                            <span className="info-label">Acc No</span>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className="info-value">{bankDetails?.accountNumber || "Loading..."}</span>
                              {bankDetails && (
                                <button className="copy-btn" onClick={() => copyToClipboard(bankDetails.accountNumber)}>Copy</button>
                              )}
                            </Box>
                        </div>
                    </Box>

                    <div className="pbc-expiry-notice">
                       <span>⚠️</span>
                       <span>Once confirmed, you have 10 minutes to complete the payment before your booking expires.</span>
                    </div>
                  </Box>
                )}
              </div>
            )}


            <button
              className="pbc-confirm-btn"
              disabled={!selectedSportId || !selectedCourtId || selectedTimeSlots.length === 0 || !selectedPaymentMethod || otpSending}
              onClick={handleConfirmBookingClick}
            >
              {otpSending ? "SENDING VERIFICATION..." : "CONFIRM BOOKING"}
            </button>
          </div>
        </div>
      </div>

      {/* BANK SLIP UPLOAD MODAL */}
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
          Upload Bank Slip
          <IconButton
            aria-label="close"
            onClick={() => setPaymentModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pbc-dialog-content">
             <Box sx={{ mt: 2 }}>
                 <Typography variant="body1" className="pbc-dialog-subtext" sx={{ mb: 2, textAlign: 'center' }}>
                     Please upload the deposit slip for <strong>LKR {totalAmount.toLocaleString("en-LK")}</strong> within 10 minutes of confirmation to finalize your booking.
                 </Typography>
                 
                  <Typography variant="body2" className="pbc-dialog-subtext" sx={{ mb: 1.5, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Upload Transaction Slip</Typography>
                  <div className="file-upload-zone" onClick={() => document.getElementById('slip-input').click()}>
                    <Receipt sx={{ fontSize: '2rem', mb: 1, color: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="body2" sx={{ color: slipFile ? '#00ff88' : 'rgba(255,255,255,0.5)' }}>
                      {slipFile ? slipFile.name : "Click to select or drag and drop slip"}
                    </Typography>
                    <input 
                        id="slip-input"
                        type="file" 
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => setSlipFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                  </div>
                 
                 <Button 
                    variant="contained" 
                    fullWidth
                    className="pbc-submit-slip-btn"
                    disabled={!slipFile || uploadingSlip}
                    onClick={handleBankSlipSubmit}
                    sx={{ mt: 3 }}
                 >
                    {uploadingSlip ? "Uploading..." : "Submit Bank Slip"}
                 </Button>
             </Box>
        </DialogContent>
        <DialogActions className="pbc-dialog-actions">
          <Button onClick={() => setPaymentModalOpen(false)} className="pbc-cancel-btn">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>


      {/* OTP VERIFICATION MODAL */}
      <Dialog
        open={otpModalOpen}
        onClose={() => !otpVerifying && setOtpModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          className: "pbc-payment-dialog"
        }}
      >
        <DialogTitle className="pbc-dialog-title">
          Identity Verification
          <IconButton
            aria-label="close"
            onClick={() => setOtpModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
            disabled={otpVerifying}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pbc-dialog-content">
          <Typography variant="body1" className="pbc-dialog-subtext" sx={{ mb: 2, textAlign: 'center' }}>
            We've sent a 6-digit Secure Booking OTP to your registered email address.
            It is valid for 10 minutes.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="otp-input-container">
                {otpArray.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    className={`otp-box ${data ? "filled" : ""}`}
                    maxLength={1}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    disabled={otpVerifying}
                  />
                ))}
              </div>

              {otpError && (
                  <Typography variant="body2" sx={{ color: '#ff4d4d', mb: 2, fontWeight: 600 }}>
                      <ErrorOutline fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {otpError}
                  </Typography>
              )}

              <Button
                 variant="contained"
                 fullWidth
                 className="pbc-submit-slip-btn"
                 disabled={otpCode.length !== 6 || otpVerifying}
                 onClick={handleVerifyOtp}
              >
                 {otpVerifying ? "Verifying..." : "Verify Identity"}
              </Button>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                {resendTimer > 0 ? (
                  <Typography className="resend-timer-text">
                    Resend code in <strong style={{ color: '#fff' }}>{resendTimer}s</strong>
                  </Typography>
                ) : (
                  <Typography className="resend-timer-text">
                    Didn't receive code?
                    <button className="resend-link" onClick={handleResendOtp} disabled={otpSending}>
                      Resend Now
                    </button>
                  </Typography>
                )}
              </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}

