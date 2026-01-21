import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/PlayerBookCourt.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function toMinutes(hhmm) {
  const [h, m] = (hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}
function overlaps(aStart, aEnd, bStart, bEnd) {
  // overlap if start < otherEnd AND otherStart < end
  return aStart < bEnd && bStart < aEnd;
}
function formatLKR(n) {
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7; // 07:00 to 22:00
  return `${pad2(h)}:00`;
});

export default function PlayerBookCourt() {
  const navigate = useNavigate();

  // ✅ UI-only “master” courts list (later from backend)
  const courts = useMemo(
    () => [
      { id: "CRT-CR-A", sport: "Cricket", name: "Cricket Court A", pricePerHour: 1500 },
      { id: "CRT-CR-B", sport: "Cricket", name: "Cricket Court B", pricePerHour: 1500 },
      { id: "CRT-FU-A", sport: "Futsal", name: "Futsal Court A", pricePerHour: 2000 },
      { id: "CRT-BD-A", sport: "Badminton", name: "Badminton Court A", pricePerHour: 1000 },
      { id: "CRT-BD-B", sport: "Badminton", name: "Badminton Court B", pricePerHour: 1000 },
    ],
    []
  );

  // ✅ UI-only “existing bookings/blocks” to simulate availability check
  const existingBookings = useMemo(
    () => [
      { courtName: "Cricket Court A", date: "2025-10-21", start: "10:00", end: "12:00", status: "CONFIRMED" },
      { courtName: "Badminton Court A", date: "2025-10-21", start: "16:00", end: "18:00", status: "CONFIRMED" },
    ],
    []
  );

  const blockedSlots = useMemo(
    () => [
      { courtName: "Futsal Court A", date: "2025-10-21", start: "12:00", end: "14:00", reason: "Maintenance" },
    ],
    []
  );

  // Step state
  const [dateISO, setDateISO] = useState(todayISO);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [checked, setChecked] = useState(false);

  // Selection state
  const [selectedCourtIds, setSelectedCourtIds] = useState([]);

  // Payment step
  const [step, setStep] = useState("SELECT"); // SELECT | PAY | DONE
  const [payMethod, setPayMethod] = useState(""); // ONLINE | BANKSLIP
  const [bankSlipFile, setBankSlipFile] = useState(null);

  const durationHours = useMemo(() => {
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    if (s === null || e === null) return 0;
    const diff = e - s;
    if (diff <= 0) return 0;
    return diff / 60;
  }, [startTime, endTime]);

  const availableCourts = useMemo(() => {
    if (!checked) return [];

    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    if (s === null || e === null || e <= s) return [];

    function courtUnavailable(courtName) {
      const anyBooking = existingBookings.some((b) => {
        if (b.date !== dateISO) return false;
        if (b.courtName !== courtName) return false;
        const bs = toMinutes(b.start);
        const be = toMinutes(b.end);
        if (bs === null || be === null) return false;
        return overlaps(s, e, bs, be);
      });

      const anyBlock = blockedSlots.some((x) => {
        if (x.date !== dateISO) return false;
        if (x.courtName !== courtName) return false;
        const xs = toMinutes(x.start);
        const xe = toMinutes(x.end);
        if (xs === null || xe === null) return false;
        return overlaps(s, e, xs, xe);
      });

      return anyBooking || anyBlock;
    }

    return courts.map((c) => ({
      ...c,
      isAvailable: !courtUnavailable(c.name),
    }));
  }, [checked, startTime, endTime, dateISO, courts, existingBookings, blockedSlots]);

  const grouped = useMemo(() => {
    const groups = { Cricket: [], Futsal: [], Badminton: [] };
    availableCourts.forEach((c) => {
      if (!groups[c.sport]) groups[c.sport] = [];
      groups[c.sport].push(c);
    });
    return groups;
  }, [availableCourts]);

  const anyAvailable = useMemo(() => {
    return availableCourts.some((c) => c.isAvailable);
  }, [availableCourts]);

  const selectedCourts = useMemo(() => {
    const set = new Set(selectedCourtIds);
    return availableCourts.filter((c) => set.has(c.id));
  }, [selectedCourtIds, availableCourts]);

  const totalAmount = useMemo(() => {
    if (!durationHours || durationHours <= 0) return 0;
    const perHourSum = selectedCourts.reduce((sum, c) => sum + (c.pricePerHour || 0), 0);
    return perHourSum * durationHours;
  }, [selectedCourts, durationHours]);

  function resetAfterCheck() {
    setSelectedCourtIds([]);
    setStep("SELECT");
    setPayMethod("");
    setBankSlipFile(null);
  }

  function handleCheckAvailability() {
    if (!dateISO) return alert("Please select a date");
    if (!startTime) return alert("Please select a start time");
    if (!endTime) return alert("Please select an end time");

    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    if (s === null || e === null) return alert("Invalid time selection");
    if (e <= s) return alert("End time must be after start time");

    setChecked(true);
    resetAfterCheck();
  }

  function toggleCourt(id) {
    setSelectedCourtIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function handleConfirmCourts() {
    if (!checked) return alert("Please check availability first");
    if (selectedCourts.length === 0) return alert("Please select at least one court");
    if (!durationHours) return alert("Please select a valid time duration");
    setStep("PAY");
  }

  function handleSubmitPayment() {
    if (!payMethod) return alert("Please select a payment method");

    if (payMethod === "ONLINE") {
      alert("Online payment gateway not added yet (UI-only).");
      return;
    }

    if (payMethod === "BANKSLIP") {
      if (!bankSlipFile) return alert("Please upload your bank slip");
      // UI-only success
      setStep("DONE");
      return;
    }
  }

  return (
    <div className="pbc-page">
      <div className="pbc-top">
        <div>
          <h2 className="pbc-title">Book a Court</h2>
          <div className="pbc-sub">
            Select date and time (hours only), then choose available courts and complete payment.
          </div>
        </div>

        <button type="button" className="pbc-outline-btn" onClick={() => navigate("/player")}>
          ← Back
        </button>
      </div>

      {/* SECTION 1: Time Selection */}
      <div className="pbc-card">
        <div className="pbc-card-title">1) Select Date & Time</div>

        <div className="pbc-grid">
          <div className="pbc-field">
            <label>Date</label>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>

          <div className="pbc-field">
            <label>Start Time (hour)</label>
            <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
              <option value="">Select</option>
              {HOURS.slice(0, HOURS.length - 1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="pbc-field">
            <label>End Time (hour)</label>
            <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
              <option value="">Select</option>
              {HOURS.slice(1).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="pbc-field pbc-field-btn">
            <label>&nbsp;</label>
            <button type="button" className="pbc-outline-btn" onClick={handleCheckAvailability}>
              Check Availability
            </button>
          </div>
        </div>

        <div className="pbc-hint">
          Duration: <strong>{durationHours ? `${durationHours} hour(s)` : "-"}</strong>
        </div>
      </div>

      {/* SECTION 2: Availability + Selection */}
      {checked && step === "SELECT" && (
        <div className="pbc-card">
          <div className="pbc-card-title">
            2) Select Available Courts{" "}
            <span className="pbc-meta">({dateISO} | {startTime || "--:--"} - {endTime || "--:--"})</span>
          </div>

          {!anyAvailable ? (
            <div className="pbc-empty">
              <div className="pbc-empty-title">🚫 Courts not available for that time</div>
              <div className="pbc-empty-sub">Try a different time slot or date.</div>
            </div>
          ) : (
            <div className="pbc-groups">
              {["Cricket", "Futsal", "Badminton"].map((sport) => {
                const items = (grouped[sport] || []).filter((c) => c.isAvailable);
                return (
                  <div key={sport} className="pbc-group">
                    <div className="pbc-group-title">{sport}</div>

                    {items.length === 0 ? (
                      <div className="pbc-group-empty">No available courts for {sport}.</div>
                    ) : (
                      <div className="pbc-tiles">
                        {items.map((c) => {
                          const isSelected = selectedCourtIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              className={`pbc-tile ${isSelected ? "is-selected" : ""}`}
                              onClick={() => toggleCourt(c.id)}
                            >
                              <div className="pbc-tile-name">{c.name}</div>
                              <div className="pbc-tile-price">{formatLKR(c.pricePerHour)} / hour</div>
                              <div className="pbc-tile-select">{isSelected ? "Selected ✓" : "Select"}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 3: Summary */}
          <div className="pbc-summary">
            <div className="pbc-summary-left">
              <div><strong>Selected Courts:</strong> {selectedCourts.length}</div>
              <div><strong>Duration:</strong> {durationHours ? `${durationHours} hour(s)` : "-"}</div>
            </div>

            <div className="pbc-summary-right">
              <div className="pbc-total">
                Total: <strong>{formatLKR(totalAmount)}</strong>
              </div>
              <button
                type="button"
                className="pbc-outline-btn"
                disabled={!anyAvailable || selectedCourts.length === 0 || !durationHours}
                onClick={handleConfirmCourts}
              >
                Confirm Courts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT STEP */}
      {checked && step === "PAY" && (
        <div className="pbc-card">
          <div className="pbc-card-title">3) Payment</div>

          <div className="pbc-pay-box">
            <div className="pbc-pay-summary">
              <div><strong>Date:</strong> {dateISO}</div>
              <div><strong>Time:</strong> {startTime} - {endTime}</div>
              <div><strong>Courts:</strong> {selectedCourts.map((c) => c.name).join(", ")}</div>
              <div className="pbc-pay-total"><strong>Total:</strong> {formatLKR(totalAmount)}</div>
            </div>

            <div className="pbc-pay-methods">
              <div className="pbc-pay-title">Choose Payment Method</div>

              <label className="pbc-radio">
                <input
                  type="radio"
                  name="pay"
                  value="ONLINE"
                  checked={payMethod === "ONLINE"}
                  onChange={(e) => setPayMethod(e.target.value)}
                />
                <span>Online Payment (Gateway coming soon)</span>
              </label>

              <label className="pbc-radio">
                <input
                  type="radio"
                  name="pay"
                  value="BANKSLIP"
                  checked={payMethod === "BANKSLIP"}
                  onChange={(e) => setPayMethod(e.target.value)}
                />
                <span>Bank Slip Upload</span>
              </label>

              {payMethod === "BANKSLIP" && (
                <div className="pbc-upload">
                  <label>Upload Bank Slip</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setBankSlipFile(e.target.files?.[0] || null)} />
                  <div className="pbc-upload-hint">
                    Booking will be <strong>confirmed only after verification</strong>.
                  </div>
                </div>
              )}

              <div className="pbc-pay-actions">
                <button type="button" className="pbc-outline-btn" onClick={() => setStep("SELECT")}>
                  Back
                </button>
                <button type="button" className="pbc-outline-btn" onClick={handleSubmitPayment}>
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {checked && step === "DONE" && (
        <div className="pbc-card">
          <div className="pbc-done">
            <div className="pbc-done-title">✅ Payment Submitted</div>
            <div className="pbc-done-sub">
              Your booking is now <strong>Pending Verification</strong>. It will become <strong>Confirmed</strong> after staff/admin verification.
            </div>

            <div className="pbc-pay-actions">
              <button type="button" className="pbc-outline-btn" onClick={() => navigate("/player/my-payments")}>
                Go to My Payments
              </button>
              <button type="button" className="pbc-outline-btn" onClick={() => navigate("/player/my-bookings")}>
                Go to My Bookings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
