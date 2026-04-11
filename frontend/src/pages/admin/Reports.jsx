import { useEffect, useMemo, useState } from "react";

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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    case "dollar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      );
    case "graduation":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
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
    return { startISO: toISODate(startOfMonth(today)), endISO: toISODate(today), label: "This Month" };
  }

  function openPreview(reportKey) { setActiveReport(reportKey); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); }

  function generatePreview() {
    if (rangeMode === "CUSTOM") {
      if (!startDate || !endDate) { alert("Select both dates."); return; }
      const s = parseISODate(startDate); const e = parseISODate(endDate);
      if (e < s) { alert("Invalid range"); return; }
      setGeneratedRange({ startISO: startDate, endISO: endDate, label: `Custom (${startDate} to ${endDate})` });
    } else {
      setGeneratedRange(computePresetRange(preset));
    }
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
        { label: "Total", value: filteredBookings.length, color: "info" },
        { label: "Confirmed", value: filteredBookings.filter(b => b.status === "CONFIRMED").length, color: "success" },
        { label: "Pending", value: filteredBookings.filter(b => b.status === "PENDING_PAYMENT").length, color: "warning" },
        { label: "Cancelled", value: filteredBookings.filter(b => b.status === "CANCELLED").length, color: "danger" },
      ];
    }
    if (activeReport === "PAYMENTS") {
      const total = filteredPayments.reduce((s, p) => s + p.amount, 0);
      return [
        { label: "Total Transactions", value: filteredPayments.length, color: "info" },
        { label: "Revenue (LKR)", value: total.toLocaleString(), color: "success" },
        { label: "Verified", value: filteredPayments.filter(p => p.status === "VERIFIED" || p.status === "COMPLETED").length, color: "success" },
        { label: "Cancelled", value: filteredPayments.filter(p => p.status === "CANCELLED").length, color: "danger" },
      ];
    }
    if (activeReport === "ATTENDANCE") {
      return [
        { label: "Records", value: filteredAttendance.length, color: "info" },
        { label: "Present", value: filteredAttendance.filter(a => a.status === "PRESENT").length, color: "success" },
        { label: "Absent", value: filteredAttendance.filter(a => a.status === "ABSENT").length, color: "danger" },
        { label: "Sessions", value: new Set(filteredAttendance.map(a => `${a.className}_${a.date}`)).size, color: "warning" },
      ];
    }
    return [
      { label: "Total", value: filteredEnrollments.length, color: "info" },
      { label: "Active", value: filteredEnrollments.filter(e => e.status === "ENROLLED").length, color: "success" },
      { label: "Cancelled", value: filteredEnrollments.filter(e => e.status === "CANCELLED").length, color: "danger" },
      { label: "Classes", value: new Set(filteredEnrollments.map(e => e.className)).size, color: "warning" },
    ];
  }, [activeReport, filteredBookings, filteredPayments, filteredAttendance, filteredEnrollments]);

  function exportPDF() {
    const title = REPORTS.find(r => r.key === activeReport)?.title || "Report";
    const rangeText = generatedRange.label;
    const tableHTML = document.getElementById("rep-table-area")?.innerHTML || "";
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 40px; }
            h1 { color: #166534; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Range: ${rangeText}</p>
          ${tableHTML}
        </body>
      </html>
    `);
    w.document.close(); w.print();
  }

  function exportExcelCSV() {
    const title = REPORTS.find(r => r.key === activeReport)?.title || "Report";
    let headers, rows;
    if (activeReport === "BOOKINGS") {
      headers = ["ID", "Player", "Court", "Date", "Time", "Status"];
      rows = filteredBookings.map(b => [b.id, b.player, b.court, b.date, b.time, b.status]);
    } else if (activeReport === "PAYMENTS") {
      headers = ["ID", "Name", "Category", "Method", "Amount", "Date", "Status"];
      rows = filteredPayments.map(p => [p.id, p.name, p.category, p.method, p.amount, p.date, p.status]);
    } else if (activeReport === "ATTENDANCE") {
      headers = ["ID", "Class", "Date", "Student", "Status"];
      rows = filteredAttendance.map(a => [a.id, a.className, a.date, a.student, a.status]);
    } else {
      headers = ["ID", "Player", "Class", "Date", "Status"];
      rows = filteredEnrollments.map(e => [e.id, e.player, e.className, e.dateEnrolled, e.status]);
    }
    downloadTextFile(`${title.replace(/ /g, "_")}.csv`, toCSV(headers, rows));
  }

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-3">
        <div>
          <h2 className="page-title">Reports</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Generate and export business intelligence insights</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-2)" }}>
        {REPORTS.map((r) => (
          <div key={r.key} className="arena-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
              <div style={{ padding: "12px", background: "var(--primary-light)", borderRadius: "12px", color: "var(--primary)" }}>{getReportIcon(r.icon)}</div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{r.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{r.desc}</p>
              </div>
            </div>
            <button className="btn btn-secondary mt-2" style={{ width: "100%" }} onClick={() => openPreview(r.key)}>Configure & Preview</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--space-2)" }}>
          <div className="arena-card" style={{ width: "100%", maxWidth: "900px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="flex-between mb-2">
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{REPORTS.find(r => r.key === activeReport)?.title}</h3>
              <button className="btn" onClick={closeModal} style={{ padding: "4px 8px" }}>✕</button>
            </div>

            <div className="flex-between p-2 mb-2" style={{ background: "var(--bg-main)", borderRadius: "12px", gap: "12px", flexWrap: "wrap", justifyContent: "flex-start" }}>
              <div className="form-group mb-0">
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Preset</label>
                <select className="form-input" value={preset} onChange={(e) => { setPreset(e.target.value); setRangeMode("PRESET"); }}>
                  {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label" style={{ fontSize: "0.75rem" }}>Start</label>
                <input className="form-input" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setRangeMode("CUSTOM"); }} />
              </div>
              <div className="form-group mb-0">
                <label className="form-label" style={{ fontSize: "0.75rem" }}>End</label>
                <input className="form-input" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setRangeMode("CUSTOM"); }} />
              </div>
              <button className="btn btn-primary" style={{ alignSelf: "flex-end" }} onClick={generatePreview}>Refresh Preview</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "15px" }}>
                {summaryCards.map(c => (
                  <div key={c.label} className="arena-card" style={{ padding: "12px", textAlign: "center", border: "1px solid var(--bg-main)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>{c.label}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: `var(--${c.color})` || "var(--text-main)" }}>{c.value}</div>
                  </div>
                ))}
              </div>

              <div id="rep-table-area" className="arena-table-container">
                <table className="arena-table">
                  <thead>
                    <tr>
                      {activeReport === "BOOKINGS" && <><th>ID</th><th>Player</th><th>Court</th><th>Date</th><th>Status</th></>}
                      {activeReport === "PAYMENTS" && <><th>ID</th><th>Name</th><th>Amount</th><th>Date</th><th>Status</th></>}
                      {activeReport === "ATTENDANCE" && <><th>ID</th><th>Class</th><th>Date</th><th>Student</th><th>Status</th></>}
                      {activeReport === "ENROLLMENTS" && <><th>ID</th><th>Player</th><th>Class</th><th>Enrolled</th><th>Status</th></>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No records found for this range.</td></tr>
                    ) : (
                      previewRows.map(row => (
                        <tr key={row.id}>
                          {activeReport === "BOOKINGS" && <><td>{row.id}</td><td>{row.player}</td><td>{row.court}</td><td>{row.date}</td><td><span className={`status-pill ${row.status === "CONFIRMED" ? "success" : "warning"}`}>{row.status}</span></td></>}
                          {activeReport === "PAYMENTS" && <><td>{row.id}</td><td>{row.name}</td><td>LKR {row.amount.toLocaleString()}</td><td>{row.date}</td><td><span className={`status-pill ${row.status === "VERIFIED" || row.status === "COMPLETED" ? "success" : "danger"}`}>{row.status}</span></td></>}
                          {activeReport === "ATTENDANCE" && <><td>{row.id}</td><td>{row.className}</td><td>{row.date}</td><td>{row.student}</td><td><span className={`status-pill ${row.status === "PRESENT" ? "success" : "danger"}`}>{row.status}</span></td></>}
                          {activeReport === "ENROLLMENTS" && <><td>{row.id}</td><td>{row.player}</td><td>{row.className}</td><td>{row.dateEnrolled}</td><td><span className={`status-pill ${row.status === "ENROLLED" ? "success" : "danger"}`}>{row.status}</span></td></>}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex-between mt-3" style={{ borderTop: "1px solid var(--bg-main)", paddingTop: "15px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Range: <strong>{generatedRange.label}</strong></div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-secondary" onClick={exportExcelCSV}>Export CSV</button>
                <button className="btn btn-primary" onClick={exportPDF}>Export PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}