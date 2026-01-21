import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/PlayerAvailableClasses.css";

function formatLKR(n) {
  if (!Number.isFinite(n)) return "-";
  return `LKR ${n.toLocaleString("en-LK")}`;
}

function formatSchedule(c) {
  if (c.scheduleType === "ONETIME") {
    return `${c.oneTimeDate || "-"} | ${c.startTime || "--:--"} - ${c.endTime || "--:--"}`;
  }
  const days = Array.isArray(c.days) && c.days.length ? c.days.join(", ") : "-";
  return `${days} | ${c.startTime || "--:--"} - ${c.endTime || "--:--"}`;
}

export default function PlayerAvailableClasses() {
  const navigate = useNavigate();

  // ✅ UI-only mock classes (later from backend)
  const [classes] = useState([
    {
      id: "CL-800001",
      sport: "CRICKET",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
      coachQualifications: "Level 1 Cricket Coach",
      coachSpecialization: "Batting & Fielding",
      scheduleType: "WEEKLY",
      days: ["Mon", "Wed"],
      oneTimeDate: "",
      startTime: "16:00",
      endTime: "17:30",
      fee: 2500,
      capacity: 20,
      enrolledCount: 14,
    },
    {
      id: "CL-800002",
      sport: "BADMINTON",
      className: "Badminton Drills",
      coachName: "Dilani Jayasinghe",
      coachQualifications: "National Coach Certificate",
      coachSpecialization: "Footwork & Speed",
      scheduleType: "ONETIME",
      days: [],
      oneTimeDate: "2026-10-02",
      startTime: "18:00",
      endTime: "19:00",
      fee: 2000,
      capacity: 16,
      enrolledCount: 16, // full -> should NOT show
    },
    {
      id: "CL-800003",
      sport: "FUTSAL",
      className: "Futsal Training",
      coachName: "Kasun Silva",
      coachQualifications: "AFC Grassroots License",
      coachSpecialization: "Defensive Play",
      scheduleType: "WEEKLY",
      days: ["Sat"],
      oneTimeDate: "",
      startTime: "09:00",
      endTime: "10:30",
      fee: 3000,
      capacity: 18,
      enrolledCount: 11,
    },
  ]);

  const availableClasses = useMemo(() => {
    return classes.filter((c) => Number(c.enrolledCount) < Number(c.capacity));
  }, [classes]);

  // Enroll + payment flow
  const [step, setStep] = useState("LIST"); // LIST | PAY | DONE
  const [selectedClass, setSelectedClass] = useState(null);

  const [payMethod, setPayMethod] = useState(""); // ONLINE | BANKSLIP
  const [bankSlipFile, setBankSlipFile] = useState(null);

  function onEnrollNow(item) {
    setSelectedClass(item);
    setPayMethod("");
    setBankSlipFile(null);
    setStep("PAY");
  }

  function submitPayment() {
    if (!payMethod) return alert("Please select a payment method");

    if (payMethod === "ONLINE") {
      alert("Online payment gateway not added yet (UI-only).");
      return;
    }

    if (payMethod === "BANKSLIP") {
      if (!bankSlipFile) return alert("Please upload your bank slip");
      setStep("DONE");
    }
  }

  return (
    <div className="pac-page">
      <div className="pac-top">
        <div>
          <h2 className="pac-title">Available Classes</h2>
          <div className="pac-sub">Only classes that still have capacity are shown.</div>
        </div>

        <button type="button" className="pac-outline-btn" onClick={() => navigate("/player")}>
          ← Back
        </button>
      </div>

      {step === "LIST" && (
        <>
          {availableClasses.length === 0 ? (
            <div className="pac-empty">
              <div className="pac-empty-title">No available classes right now</div>
              <div className="pac-empty-sub">All classes are currently full.</div>
            </div>
          ) : (
            <div className="pac-grid">
              {availableClasses.map((c) => (
                <div key={c.id} className="pac-tile">
                  <div className="pac-row">
                    <div className="pac-name">{c.className}</div>
                    <div className="pac-fee">{formatLKR(c.fee)}</div>
                  </div>

                  <div className="pac-meta">
                    <div><strong>Coach:</strong> {c.coachName}</div>
                    <div><strong>Qualification:</strong> {c.coachQualifications || "-"}</div>
                    <div><strong>Specialization:</strong> {c.coachSpecialization || "-"}</div>
                  </div>

                  <div className="pac-schedule">
                    <strong>Schedule:</strong> {formatSchedule(c)}
                  </div>

                  <div className="pac-cap">
                    <strong>Capacity:</strong> {c.enrolledCount}/{c.capacity}
                  </div>

                  <div className="pac-actions">
                    <button type="button" className="pac-outline-btn" onClick={() => onEnrollNow(c)}>
                      Enroll Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {step === "PAY" && selectedClass && (
        <div className="pac-card">
          <div className="pac-card-title">Payment for Enrollment</div>

          <div className="pac-pay-box">
            <div className="pac-pay-summary">
              <div><strong>Class:</strong> {selectedClass.className}</div>
              <div><strong>Coach:</strong> {selectedClass.coachName}</div>
              <div><strong>Schedule:</strong> {formatSchedule(selectedClass)}</div>
              <div className="pac-pay-total"><strong>Fee:</strong> {formatLKR(selectedClass.fee)}</div>
            </div>

            <div className="pac-pay-methods">
              <div className="pac-pay-title">Choose Payment Method</div>

              <label className="pac-radio">
                <input
                  type="radio"
                  name="pay"
                  value="ONLINE"
                  checked={payMethod === "ONLINE"}
                  onChange={(e) => setPayMethod(e.target.value)}
                />
                <span>Online Payment (Gateway coming soon)</span>
              </label>

              <label className="pac-radio">
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
                <div className="pac-upload">
                  <label>Upload Bank Slip</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setBankSlipFile(e.target.files?.[0] || null)}
                  />
                  <div className="pac-upload-hint">
                    Enrollment will be <strong>confirmed only after verification</strong>.
                  </div>
                </div>
              )}

              <div className="pac-pay-actions">
                <button type="button" className="pac-outline-btn" onClick={() => setStep("LIST")}>
                  Back
                </button>
                <button type="button" className="pac-outline-btn" onClick={submitPayment}>
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "DONE" && selectedClass && (
        <div className="pac-card">
          <div className="pac-done">
            <div className="pac-done-title">✅ Payment Submitted</div>
            <div className="pac-done-sub">
              Your enrollment is now <strong>Pending Verification</strong>. It will become <strong>Confirmed</strong> after staff/admin verifies your payment.
            </div>

            <div className="pac-pay-actions">
              <button type="button" className="pac-outline-btn" onClick={() => navigate("/player/my-payments")}>
                Go to My Payments
              </button>
              <button type="button" className="pac-outline-btn" onClick={() => navigate("/player/my-classes")}>
                Go to My Classes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
