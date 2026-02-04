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
  const [classes] = useState([
    {
      enrollmentId: "ENR-500001",
      className: "Beginner Cricket",
      coachName: "Sahan Fernando",
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

  return (
    <div className="pmc-page">
      <div className="pmc-top">
        <h2 className="pmc-title">My Classes</h2>
      </div>

      {tiles.length === 0 ? (
        <div className="pmc-empty">
          <div className="pmc-empty-title">No enrolled classes yet</div>
          <div className="pmc-empty-sub">Your paid classes will appear here.</div>
        </div>
      ) : (
        <div className="pmc-grid">
          {tiles.map((c) => (
            <div key={c.enrollmentId} className="pmc-tile">
              <div className="pmc-row">
                <div className="pmc-name">{c.className}</div>
                <span className={statusPillClass(c.paymentStatus)}>
                  {statusLabel(c.paymentStatus)}
                </span>
              </div>

              <div className="pmc-meta">
                <div>
                  <strong>Coach:</strong> {c.coachName}
                </div>
                <div>
                  <strong>Schedule:</strong> {formatSchedule(c)}
                </div>
                <div>
                  <strong>
                    {c.billingType === "ONE_TIME" ? "One-time Fee" : "Monthly Fee"}:
                  </strong>{" "}
                  {formatLKR(c.fee)}
                </div>

                {c.billingType === "MONTHLY" && c.nextPaymentDue && (
                  <div className="pmc-next">
                    Next payment due: <strong>{c.nextPaymentDue}</strong>
                  </div>
                )}

                {c.paymentStatus === "PENDING_VERIFICATION" && (
                  <div className="pmc-hint">
                    Payment submitted. Waiting for admin verification.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
