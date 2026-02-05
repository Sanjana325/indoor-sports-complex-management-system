import { useEffect, useMemo, useState } from "react";
import "../../styles/Reports.css";

const PRESETS = [
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "3M", label: "Last 3 Months" },
  { value: "6M", label: "Last 6 Months" },
  { value: "YEAR", label: "Last 1 Year" },
  { value: "2Y", label: "Last 2 Years" },
];

const REPORTS = [
  { key: "BOOKINGS", title: "Bookings Report", desc: "Generate report of all bookings with date range filters", icon: "calendar" },
  { key: "PAYMENTS", title: "Payments Report", desc: "Financial summary with payment status breakdown", icon: "dollar" },
  { key: "ATTENDANCE", title: "Attendance Report", desc: "Class-wise attendance tracking and statistics", icon: "users" },
  { key: "ENROLLMENTS", title: "Enrollments Report", desc: "Student enrollment data by class and date", icon: "graduation" },
];

function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d, months) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function addYears(d, years) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}

function inRange(itemDateISO, startISO, endISO) {
  if (!itemDateISO || !startISO || !endISO) return false;
  return itemDateISO >= startISO && itemDateISO <= endISO;
}

function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(headers, rows) {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [];
  lines.push(headers.map(esc).join(","));
  rows.forEach((r) => lines.push(r.map(esc).join(",")));
  return lines.join("\n");
}

function getReportIcon(iconType) {
  switch (iconType) {
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    case "dollar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    case "graduation":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      );
    default:
      return null;
  }
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState("BOOKINGS");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [rangeMode, setRangeMode] = useState("PRESET");
  const [preset, setPreset] = useState("MONTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [generatedRange, setGeneratedRange] = useState(() => computePresetRange("MONTH"));

  const [bookings] = useState([
    { id: "B-5001", player: "Nuwan Perera", court: "Cricket - A", date: "2026-01-05", time: "16:00 - 18:00", status: "CONFIRMED" },
    { id: "B-5002", player: "Kavindi Silva", court: "Badminton - A", date: "2026-01-12", time: "10:00 - 11:00", status: "PENDING_PAYMENT" },
    { id: "B-5003", player: "Saman Silva", court: "Futsal - A", date: "2025-12-20", time: "18:00 - 19:00", status: "CANCELLED" },
    { id: "B-5004", player: "Ishan Fernando", court: "Cricket - B", date: "2025-11-14", time: "14:00 - 15:00", status: "CONFIRMED" },
  ]);

  const [payments] = useState([
    { id: "PAY001", name: "Nuwan Perera", category: "Court Booking", method: "Bank Slip", amount: 2500, date: "2026-01-06", status: "VERIFIED" },
    { id: "PAY002", name: "Saman Silva", category: "Class Fee", method: "Online", amount: 3000, date: "2026-01-10", status: "COMPLETED" },
    { id: "PAY003", name: "Kavindi Silva", category: "Court Booking", method: "Bank Slip", amount: 2000, date: "2025-12-22", status: "CANCELLED" },
    { id: "PAY004", name: "Ishan Fernando", category: "Class Fee", method: "Online", amount: 3500, date: "2025-11-20", status: "COMPLETED" },
  ]);

  const [attendance] = useState([
    { id: "AT-7001", className: "Beginner Cricket", date: "2026-01-07", student: "Nuwan Perera", status: "PRESENT" },
    { id: "AT-7002", className: "Beginner Cricket", date: "2026-01-07", student: "Kavindi Silva", status: "ABSENT" },
    { id: "AT-7003", className: "Karate Basics", date: "2025-12-10", student: "Saman Silva", status: "PRESENT" },
    { id: "AT-7004", className: "Chess for Beginners", date: "2025-11-05", student: "Ishan Fernando", status: "PRESENT" },
  ]);

  const [enrollments] = useState([
    { id: "ENR-6001", player: "Kavindi Silva", className: "Beginner Cricket", dateEnrolled: "2026-01-01", status: "ENROLLED" },
    { id: "ENR-6002", player: "Nuwan Perera", className: "Badminton Intermediate", dateEnrolled: "2025-12-15", status: "ENROLLED" },
    { id: "ENR-6003", player: "Saman Silva", className: "Karate Basics", dateEnrolled: "2025-11-10", status: "CANCELLED" },
    { id: "ENR-6004", player: "Ishan Fernando", className: "Chess for Beginners", dateEnrolled: "2025-11-02", status: "ENROLLED" },
  ]);

  function computePresetRange(presetValue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (presetValue === "WEEK") {
      const s = startOfWeek(today);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "This Week" };
    }
    if (presetValue === "MONTH") {
      const s = startOfMonth(today);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "This Month" };
    }
    if (presetValue === "3M") {
      const s = addMonths(today, -3);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "Last 3 Months" };
    }
    if (presetValue === "6M") {
      const s = addMonths(today, -6);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "Last 6 Months" };
    }
    if (presetValue === "YEAR") {
      const s = addYears(today, -1);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "Last 1 Year" };
    }
    if (presetValue === "2Y") {
      const s = addYears(today, -2);
      return { startISO: toISODate(s), endISO: toISODate(today), label: "Last 2 Years" };
    }

    const s = startOfMonth(today);
    return { startISO: toISODate(s), endISO: toISODate(today), label: "This Month" };
  }

  function openPreview(reportKey) {
    setActiveReport(reportKey);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  useEffect(() => {
    if (!isModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e) {
      if (e.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isModalOpen]);

  function generatePreview() {
    if (rangeMode === "CUSTOM") {
      if (!startDate || !endDate) {
        alert("Select both start and end dates.");
        return;
      }

      const s = parseISODate(startDate);
      const e = parseISODate(endDate);
      if (e < s) {
        alert("End date must be after start date");
        return;
      }

      setGeneratedRange({
        startISO: startDate,
        endISO: endDate,
        label: `Custom (${startDate} → ${endDate})`,
      });
      return;
    }

    const r = computePresetRange(preset);
    setGeneratedRange(r);
  }

  const { startISO, endISO } = generatedRange;

  const filteredBookings = useMemo(() => bookings.filter((b) => inRange(b.date, startISO, endISO)), [bookings, startISO, endISO]);
  const filteredPayments = useMemo(() => payments.filter((p) => inRange(p.date, startISO, endISO)), [payments, startISO, endISO]);
  const filteredAttendance = useMemo(() => attendance.filter((a) => inRange(a.date, startISO, endISO)), [attendance, startISO, endISO]);
  const filteredEnrollments = useMemo(() => enrollments.filter((e) => inRange(e.dateEnrolled, startISO, endISO)), [enrollments, startISO, endISO]);

  const previewRows = useMemo(() => {
    if (activeReport === "BOOKINGS") return filteredBookings;
    if (activeReport === "PAYMENTS") return filteredPayments;
    if (activeReport === "ATTENDANCE") return filteredAttendance;
    return filteredEnrollments;
  }, [activeReport, filteredBookings, filteredPayments, filteredAttendance, filteredEnrollments]);

  const summaryCards = useMemo(() => {
    if (activeReport === "BOOKINGS") {
      return [
        { label: "Total", value: String(filteredBookings.length), color: "primary" },
        { label: "Confirmed", value: String(filteredBookings.filter((b) => b.status === "CONFIRMED").length), color: "success" },
        { label: "Pending", value: String(filteredBookings.filter((b) => b.status === "PENDING_PAYMENT").length), color: "warning" },
        { label: "Cancelled", value: String(filteredBookings.filter((b) => b.status === "CANCELLED").length), color: "danger" },
      ];
    }

    if (activeReport === "PAYMENTS") {
      const total = filteredPayments.reduce((s, p) => s + p.amount, 0);
      return [
        { label: "Total", value: String(filteredPayments.length), color: "primary" },
        { label: "Amount (LKR)", value: total.toLocaleString("en-LK"), color: "success" },
        { label: "Verified", value: String(filteredPayments.filter((p) => p.status === "VERIFIED").length), color: "info" },
        { label: "Completed", value: String(filteredPayments.filter((p) => p.status === "COMPLETED").length), color: "success" },
      ];
    }

    if (activeReport === "ATTENDANCE") {
      return [
        { label: "Records", value: String(filteredAttendance.length), color: "primary" },
        { label: "Present", value: String(filteredAttendance.filter((a) => a.status === "PRESENT").length), color: "success" },
        { label: "Absent", value: String(filteredAttendance.filter((a) => a.status === "ABSENT").length), color: "danger" },
        { label: "Sessions", value: String(new Set(filteredAttendance.map((a) => `${a.className}__${a.date}`)).size), color: "info" },
      ];
    }

    return [
      { label: "Total", value: String(filteredEnrollments.length), color: "primary" },
      { label: "Enrolled", value: String(filteredEnrollments.filter((e) => e.status === "ENROLLED").length), color: "success" },
      { label: "Cancelled", value: String(filteredEnrollments.filter((e) => e.status === "CANCELLED").length), color: "danger" },
      { label: "Classes", value: String(new Set(filteredEnrollments.map((e) => e.className)).size), color: "info" },
    ];
  }, [activeReport, filteredBookings, filteredPayments, filteredAttendance, filteredEnrollments]);

  function exportPDF() {
    const title = REPORTS.find((r) => r.key === activeReport)?.title || "Report";
    const rangeText = generatedRange.label || `${startISO} to ${endISO}`;
    const html = document.getElementById("rep-print-area")?.innerHTML || "<p>No preview</p>";

    const w = window.open("", "_blank", "width=950,height=700");
    if (!w) {
      alert("Popup blocked. Please allow popups.");
      return;
    }

    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 18px; color: #111; }
            h1 { margin: 0 0 6px; font-size: 20px; }
            .meta { margin: 0 0 16px; opacity: 0.85; font-size: 12px; }

            .repPro-summary { display: grid; grid-template-columns: repeat(4, minmax(160px, 1fr)); gap: 10px; margin: 12px 0; }
            .repPro-sCard { border: 1px solid #ddd; border-radius: 10px; padding: 10px; }
            .repPro-sLabel { font-size: 12px; opacity: 0.75; }
            .repPro-sValue { font-size: 18px; font-weight: 700; margin-top: 4px; }

            .repPro-tableWrap { border: 1px solid #ddd; border-radius: 10px; overflow: hidden; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e6e6e6; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; }
            th { background: #f5f5f5; font-weight: 700; }

            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="meta">Range: ${rangeText}</p>
          ${html}
        </body>
      </html>
    `);

    w.document.close();
    w.focus();
    w.print();
  }

  function exportExcelCSV() {
    const title = REPORTS.find((r) => r.key === activeReport)?.title || "Report";
    const safeTitle = title.replaceAll(" ", "_");

    if (activeReport === "BOOKINGS") {
      const headers = ["Booking ID", "Player", "Court", "Date", "Time", "Status"];
      const rows = filteredBookings.map((b) => [b.id, b.player, b.court, b.date, b.time, b.status]);
      downloadTextFile(`${safeTitle}.csv`, toCSV(headers, rows));
      return;
    }

    if (activeReport === "PAYMENTS") {
      const headers = ["Payment ID", "Name", "Category", "Method", "Amount", "Date", "Status"];
      const rows = filteredPayments.map((p) => [p.id, p.name, p.category, p.method, p.amount, p.date, p.status]);
      downloadTextFile(`${safeTitle}.csv`, toCSV(headers, rows));
      return;
    }

    if (activeReport === "ATTENDANCE") {
      const headers = ["Record ID", "Class", "Date", "Student", "Status"];
      const rows = filteredAttendance.map((a) => [a.id, a.className, a.date, a.student, a.status]);
      downloadTextFile(`${safeTitle}.csv`, toCSV(headers, rows));
      return;
    }

    const headers = ["Enrollment ID", "Player", "Class", "Date Enrolled", "Status"];
    const rows = filteredEnrollments.map((e) => [e.id, e.player, e.className, e.dateEnrolled, e.status]);
    downloadTextFile(`${safeTitle}.csv`, toCSV(headers, rows));
  }

  function onPresetChange(v) {
    setPreset(v);
    setRangeMode("PRESET");
  }

  function onCustomDateChange(kind, v) {
    if (kind === "START") setStartDate(v);
    if (kind === "END") setEndDate(v);
    setRangeMode("CUSTOM");
  }

  function clearCustomDates() {
    setStartDate("");
    setEndDate("");
    setRangeMode("PRESET");
  }

  return (
    <div className="repPro">
      <div className="repPro-container">
        <header className="repPro-header">
          <div className="repPro-header-content">
            <h1 className="repPro-title">Reports</h1>
            <p className="repPro-subtitle">Choose a report, preview with date filters, then export</p>
          </div>
        </header>

        <div className="repPro-list">
          {REPORTS.map((r) => (
            <div className="repPro-card" key={r.key}>
              <div className="repPro-card-icon">
                {getReportIcon(r.icon)}
              </div>
              <div className="repPro-card-content">
                <h3 className="repPro-cardTitle">{r.title}</h3>
                <p className="repPro-cardDesc">{r.desc}</p>
              </div>
              <div className="repPro-card-actions">
                <button className="repPro-btnPreview" type="button" onClick={() => openPreview(r.key)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="repPro-modalBackdrop" onMouseDown={closeModal} role="presentation">
          <div
            className="repPro-modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Report preview"
          >
            <div className="repPro-modalHeader">
              <div className="repPro-modalHeader-content">
                <h2 className="repPro-modalTitle">
                  {REPORTS.find((r) => r.key === activeReport)?.title}
                </h2>
                <p className="repPro-modalSubtitle">Choose a preset or custom dates, then click Preview Report</p>
              </div>

              <button className="repPro-modalClose" onClick={closeModal} type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="repPro-controls">
              <div className="repPro-controls-grid">
                <div className="repPro-field">
                  <label>Preset Range</label>
                  <select
                    value={preset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    className={rangeMode === "PRESET" ? "repPro-activeField" : ""}
                  >
                    {PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="repPro-field">
                  <label>Start Date (Custom)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onCustomDateChange("START", e.target.value)}
                    className={rangeMode === "CUSTOM" ? "repPro-activeField" : ""}
                  />
                </div>

                <div className="repPro-field">
                  <label>End Date (Custom)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onCustomDateChange("END", e.target.value)}
                    className={rangeMode === "CUSTOM" ? "repPro-activeField" : ""}
                  />
                </div>

                <div className="repPro-field-actions">
                  <button className="repPro-btnSecondary" type="button" onClick={clearCustomDates}>
                    Clear Custom
                  </button>
                  <button className="repPro-btnPrimary" type="button" onClick={generatePreview}>
                    Preview Report
                  </button>
                </div>
              </div>

              <div className="repPro-range-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span><strong>Selected Range:</strong> {generatedRange.label ? generatedRange.label : "Not generated yet"}</span>
              </div>
            </div>

            <div className="repPro-modalBody">
              <div id="rep-print-area">
                <div className="repPro-summary">
                  {summaryCards.map((c) => (
                    <div className={`repPro-sCard repPro-sCard-${c.color}`} key={c.label}>
                      <div className="repPro-sLabel">{c.label}</div>
                      <div className="repPro-sValue">{c.value}</div>
                    </div>
                  ))}
                </div>

                <div className="repPro-tableWrap">
                  {activeReport === "BOOKINGS" && (
                    <table className="repPro-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Player</th>
                          <th>Court</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="repPro-empty">
                              No data for this range.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((b) => (
                            <tr key={b.id}>
                              <td>{b.id}</td>
                              <td>{b.player}</td>
                              <td>{b.court}</td>
                              <td>{b.date}</td>
                              <td>{b.time}</td>
                              <td>{b.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeReport === "PAYMENTS" && (
                    <table className="repPro-table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="repPro-empty">
                              No data for this range.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((p) => (
                            <tr key={p.id}>
                              <td>{p.id}</td>
                              <td>{p.name}</td>
                              <td>{p.category}</td>
                              <td>{p.method}</td>
                              <td>{p.amount.toLocaleString("en-LK")}</td>
                              <td>{p.date}</td>
                              <td>{p.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeReport === "ATTENDANCE" && (
                    <table className="repPro-table">
                      <thead>
                        <tr>
                          <th>Record ID</th>
                          <th>Class</th>
                          <th>Date</th>
                          <th>Student</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="repPro-empty">
                              No data for this range.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((a) => (
                            <tr key={a.id}>
                              <td>{a.id}</td>
                              <td>{a.className}</td>
                              <td>{a.date}</td>
                              <td>{a.student}</td>
                              <td>{a.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeReport === "ENROLLMENTS" && (
                    <table className="repPro-table">
                      <thead>
                        <tr>
                          <th>Enrollment ID</th>
                          <th>Player</th>
                          <th>Class</th>
                          <th>Date Enrolled</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="repPro-empty">
                              No data for this range.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((e) => (
                            <tr key={e.id}>
                              <td>{e.id}</td>
                              <td>{e.player}</td>
                              <td>{e.className}</td>
                              <td>{e.dateEnrolled}</td>
                              <td>{e.status}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="repPro-modalFooter">
              <button className="repPro-btnSecondary" type="button" onClick={closeModal}>
                Close
              </button>
              <button className="repPro-btnExport" type="button" onClick={exportPDF}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Export PDF
              </button>
              <button className="repPro-btnExport" type="button" onClick={exportExcelCSV}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}