import { useEffect, useMemo, useState } from "react";
import "../styles/CancelClassModal.css";

function dayShortFromISO(iso) {
  const d = new Date(iso + "T00:00:00");
  const idx = d.getDay(); // 0 Sun ... 6 Sat
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[idx] || "Mon";
}

function durationLabel(start, end) {
  if (!start || !end) return "-";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (!Number.isFinite(mins) || mins <= 0) return "-";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export default function CancelClassModal({ coachName, classes, onClose, onSubmit }) {
  const [dateISO, setDateISO] = useState(() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [reason, setReason] = useState("");

  // close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sessionsForDate = useMemo(() => {
    const dayShort = dayShortFromISO(dateISO);

    return (classes || [])
      .filter((c) => c.coachName === coachName)
      .flatMap((c) => {
        // weekly match: if days includes dayShort
        if (c.scheduleType === "WEEKLY") {
          const days = Array.isArray(c.days) ? c.days : [];
          if (!days.includes(dayShort)) return [];
          return [
            {
              sessionId: `${c.id}__${dateISO}`,
              classId: c.id,
              dateISO,
              label: `${c.className} (${c.sport}) • ${c.startTime}-${c.endTime}`,
              startTime: c.startTime,
              endTime: c.endTime,
            },
          ];
        }

        // one-time match: if oneTimeDate equals date
        if (c.scheduleType === "ONETIME") {
          if (c.oneTimeDate !== dateISO) return [];
          return [
            {
              sessionId: `${c.id}__${dateISO}`,
              classId: c.id,
              dateISO,
              label: `${c.className} (${c.sport}) • ${c.startTime}-${c.endTime}`,
              startTime: c.startTime,
              endTime: c.endTime,
            },
          ];
        }

        return [];
      });
  }, [classes, coachName, dateISO]);

  // Reset selection if date changes
  useEffect(() => {
    setSelectedSessionId("");
  }, [dateISO]);

  function handleSubmit(e) {
    e.preventDefault();

    if (!dateISO) return alert("Please select a date");
    if (!selectedSessionId) return alert("Please select a class for that date");
    if (!reason.trim()) return alert("Please enter a reason");

    const session = sessionsForDate.find((s) => s.sessionId === selectedSessionId);
    if (!session) return alert("Invalid session selection");

    onSubmit({
      sessionId: session.sessionId,
      classId: session.classId,
      dateISO: session.dateISO,
      reason: reason.trim(),
      duration: durationLabel(session.startTime, session.endTime),
    });
  }

  return (
    <div className="ccm-backdrop" onMouseDown={onClose}>
      <div className="ccm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ccm-head">
          <h3 className="ccm-title">Cancel Class Session</h3>
          <button type="button" className="ccm-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="ccm-form" onSubmit={handleSubmit}>
          <div className="ccm-field">
            <label>Date</label>
            <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
          </div>

          <div className="ccm-field">
            <label>Class (for selected date)</label>
            <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
              <option value="">Select a class session</option>
              {sessionsForDate.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.label}
                </option>
              ))}
            </select>
            {sessionsForDate.length === 0 && (
              <div className="ccm-hint">No classes found for this date.</div>
            )}
          </div>

          <div className="ccm-field">
            <label>Reason</label>
            <textarea
              rows="3"
              placeholder="e.g. Coach unavailable / tournament / emergency..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="ccm-actions">
            <button type="button" className="ccm-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ccm-btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
