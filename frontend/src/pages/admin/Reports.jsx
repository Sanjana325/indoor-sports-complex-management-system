import { useMemo, useState } from "react";
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
  {
    key: "BOOKINGS",
    title: "Bookings Report",
    desc: "Generate report of all bookings with date range filters",
  },
  {
    key: "PAYMENTS",
    title: "Payments Report",
    desc: "Financial summary with payment status breakdown",
  },
  {
    key: "ATTENDANCE",
    title: "Attendance Report",
    desc: "Class-wise attendance tracking and statistics",
  },
  {
    key: "ENROLLMENTS",
    title: "Enrollments Report",
    desc: "Student enrollment data by class and date",
  },
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
  const diff = (day === 0 ? -6 : 1) - day; // Monday
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

export default function Reports() {
  const [activeReport, setActiveReport] = useState("BOOKINGS");
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const [preset, setPreset] = useState("MONTH");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [generatedRange, setGeneratedRange] = useState(() => {
    const r = computePresetRange("MONTH");
    return r;
  });

  // Mock data
  const [bookings] = useState([
    { id: "B-5001", player: "Nuwan Perera", court: "Cricket - A", date: "2026-01-05", time: "04:00 PM - 06:00 PM", status: "CONFIRMED" },
    { id: "B-5002", player: "Kavindi Silva", court: "Badminton - A", date: "2026-01-12", time: "10:00 - 11:00", status: "PENDING_PAYMENT" },
    { id: "B-5003", player: "Saman Silva", court: "Futsal - A", date: "2025-12-20", time: "06:00 PM - 07:00 PM", status: "CANCELLED" },
    { id: "B-5004", player: "Ishan Fernando", court: "Cricket - B", date: "2025-11-14", time: "02:00 PM - 03:00 PM", status: "CONFIRMED" },
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
    { id: "ENR-6001", player: "Kavindi Silva", className: "Beginner Cricket", dateEnrolled: "2026-01-01", status: "ACTIVE" },
    { id: "ENR-6002", player: "Nuwan Perera", className: "Badminton Intermediate", dateEnrolled: "2025-12-15", status: "ACTIVE" },
    { id: "ENR-6003", player: "Saman Silva", className: "Karate Basics", dateEnrolled: "2025-11-10", status: "CANCELLED" },
    { id: "ENR-6004", player: "Ishan Fernando", className: "Chess for Beginners", dateEnrolled: "2025-11-02", status: "ACTIVE" },
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
    setIsPreviewOpen(true);
  }

  function generatePreview() {
    if (startDate && endDate) {
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

  const filteredBookings = useMemo(
    () => bookings.filter((b) => inRange(b.date, startISO, endISO)),
    [bookings, startISO, endISO]
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => inRange(p.date, startISO, endISO)),
    [payments, startISO, endISO]
  );
  const filteredAttendance = useMemo(
    () => attendance.filter((a) => inRange(a.date, startISO, endISO)),
    [attendance, startISO, endISO]
  );
  const filteredEnrollments = useMemo(
    () => enrollments.filter((e) => inRange(e.dateEnrolled, startISO, endISO)),
    [enrollments, startISO, endISO]
  );

  const previewRows = useMemo(() => {
    if (activeReport === "BOOKINGS") return filteredBookings;
    if (activeReport === "PAYMENTS") return filteredPayments;
    if (activeReport === "ATTENDANCE") return filteredAttendance;
    return filteredEnrollments;
  }, [activeReport, filteredBookings, filteredPayments, filteredAttendance, filteredEnrollments]);

  const summaryCards = useMemo(() => {
    if (activeReport === "BOOKINGS") {
      return [
        { label: "Total", value: String(filteredBookings.length) },
        { label: "Confirmed", value: String(filteredBookings.filter((b) => b.status === "CONFIRMED").length) },
        { label: "Pending", value: String(filteredBookings.filter((b) => b.status === "PENDING_PAYMENT").length) },
        { label: "Cancelled", value: String(filteredBookings.filter((b) => b.status === "CANCELLED").length) },
      ];
    }

    if (activeReport === "PAYMENTS") {
      const total = filteredPayments.reduce((s, p) => s + p.amount, 0);
      return [
        { label: "Total", value: String(filteredPayments.length) },
        { label: "Amount (LKR)", value: total.toLocaleString() },
        { label: "Verified", value: String(filteredPayments.filter((p) => p.status === "VERIFIED").length) },
        { label: "Completed", value: String(filteredPayments.filter((p) => p.status === "COMPLETED").length) },
      ];
    }

    if (activeReport === "ATTENDANCE") {
      return [
        { label: "Records", value: String(filteredAttendance.length) },
        { label: "Present", value: String(filteredAttendance.filter((a) => a.status === "PRESENT").length) },
        { label: "Absent", value: String(filteredAttendance.filter((a) => a.status === "ABSENT").length) },
        { label: "Sessions", value: String(new Set(filteredAttendance.map((a) => `${a.className}__${a.date}`)).size) },
      ];
    }

    return [
      { label: "Total", value: String(filteredEnrollments.length) },
      { label: "Active", value: String(filteredEnrollments.filter((e) => e.status === "ACTIVE").length) },
      { label: "Cancelled", value: String(filteredEnrollments.filter((e) => e.status === "CANCELLED").length) },
      { label: "Range", value: `${startISO} → ${endISO}` },
    ];
  }, [activeReport, filteredBookings, filteredPayments, filteredAttendance, filteredEnrollments, startISO, endISO]);

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
            body { font-family: Arial, sans-serif; padding: 18px; }
            h1 { margin: 0 0 6px; font-size: 20px; }
            .meta { margin: 0 0 16px; opacity: 0.8; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
            .card { border: 1px solid #ddd; border-radius: 10px; padding: 10px; }
            .label { font-size: 12px; opacity: 0.75; margin-bottom: 6px; }
            .value { font-size: 18px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
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

  function clearCustomDates() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="repPro">
      <div className="repPro-head">
        <div>
          <h2 className="repPro-title">Reports</h2>
          <p className="repPro-sub">
            Choose a report, preview with date filters, then export.
          </p>
        </div>
      </div>

      {/* cards */}
      <div className="repPro-list">
        {REPORTS.map((r) => (
          <div className="repPro-card" key={r.key}>
            <div>
              <div className="repPro-cardTitle">{r.title}</div>
              <div className="repPro-cardDesc">{r.desc}</div>
            </div>

            <div className="repPro-cardBtns">
              <button className="repPro-btnOutline" type="button" onClick={() => openPreview(r.key)}>
                Preview
              </button>
              <button className="repPro-btnDark" type="button" onClick={() => { openPreview(r.key); exportPDF(); }}>
                Export PDF
              </button>
              <button className="repPro-btnDark" type="button" onClick={() => { openPreview(r.key); exportExcelCSV(); }}>
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* preview */}
      {isPreviewOpen && (
        <div className="repPro-preview">
          <div className="repPro-previewHead">
            <div>
              <div className="repPro-previewTitle">
                Preview: {REPORTS.find((r) => r.key === activeReport)?.title}
              </div>
              <div className="repPro-previewDesc">
                Choose preset OR custom dates, then click Preview Report.
              </div>
            </div>

            <div className="repPro-previewBtns">
              <button className="repPro-btnOutline" type="button" onClick={() => setIsPreviewOpen(false)}>
                Close
              </button>
              <button className="repPro-btnDark" type="button" onClick={exportPDF}>
                Export PDF
              </button>
              <button className="repPro-btnDark" type="button" onClick={exportExcelCSV}>
                Export Excel
              </button>
            </div>
          </div>

          <div className="repPro-controls">
            <div className="repPro-grid">
              <div className="repPro-field">
                <label>Preset Range</label>
                <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                  {PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="repPro-field">
                <label>Start Date (Custom)</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="repPro-field">
                <label>End Date (Custom)</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="repPro-actions">
                <button className="repPro-btnOutline" type="button" onClick={clearCustomDates}>
                  Clear Custom Dates
                </button>
                <button className="repPro-btnDark" type="button" onClick={generatePreview}>
                  Preview Report
                </button>
              </div>
            </div>

            <div className="repPro-range">
              <strong>Selected Range:</strong>{" "}
              {generatedRange.label ? generatedRange.label : "Not generated yet"}
            </div>
          </div>

          <div id="rep-print-area">
            <div className="repPro-summary">
              {summaryCards.map((c) => (
                <div className="repPro-sCard" key={c.label}>
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
                      <tr><td colSpan="6" className="repPro-empty">No data for this range.</td></tr>
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
                      <tr><td colSpan="7" className="repPro-empty">No data for this range.</td></tr>
                    ) : (
                      previewRows.map((p) => (
                        <tr key={p.id}>
                          <td>{p.id}</td>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td>{p.method}</td>
                          <td>{p.amount.toLocaleString()}</td>
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
                      <tr><td colSpan="5" className="repPro-empty">No data for this range.</td></tr>
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
                      <tr><td colSpan="5" className="repPro-empty">No data for this range.</td></tr>
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

          <div className="repPro-note">
            ✅ PDF uses browser Print → Save as PDF. ✅ Excel export downloads CSV (opens in Excel).
          </div>
        </div>
      )}
    </div>
  );
}
