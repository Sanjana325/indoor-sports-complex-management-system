import { useMemo, useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

// backend server address
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// helper for padding single digit numbers for dates
function pad2(n) {
  return String(n).padStart(2, "0");
}

// converts a date object into a YYYY-MM-DD string for the api
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// calculates the time difference between two strings (HH:mm)
function fmtDuration(start, end) {
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

// turns technical status codes into user-friendly labels
function statusLabelBooking(s) {
  if (s === "PENDING_PAYMENT") return "Pending";
  if (s === "CONFIRMED") return "Confirmed";
  if (s === "CANCELLED") return "Cancelled";
  return s;
}

// gets the CSS class name for a booking status
function statusKeyBooking(s) {
  if (s === "CONFIRMED") return "confirmed";
  if (s === "CANCELLED") return "cancelled";
  return "pending";
}

// determines which sport a court belongs to based on its name
function sportKeyFromCourtName(court) {
  const lower = court.toLowerCase();
  if (lower.includes("cricket")) return "cricket";
  if (lower.includes("badminton")) return "badminton";
  if (lower.includes("futsal")) return "futsal";
  return "cricket";
}

// helper to format sport names correctly
function sportLabelFromKey(k) {
  if (k === "cricket") return "Cricket";
  if (k === "badminton") return "Badminton";
  if (k === "futsal") return "Futsal";
  return "Cricket";
}

// the main dashboard page for administrative oversight
export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("MONTH");
  const [data, setData] = useState({
    totals: {
      users: 0,
      bookings: 0,
      revenue: 0,
      pendingActions: 0,
      classes: 0
    },
    charts: {
      revenueTrend: [],
      revenueBySport: [],
      revenueByCourt: []
    }
  });

  // calculates date ranges (start/end) for filtering dashboard stats
  const computeRange = (val) => {
    const today = new Date();
    const toISO = (d) => d.toISOString().split('T')[0];
    
    switch(val) {
      case "TODAY": 
        return { start: toISO(today), end: toISO(today), label: "Today" };
      case "MONTH":
        return { start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), end: toISO(today), label: "This Month" };
      case "3_MONTHS":
        const t3 = new Date(); t3.setMonth(today.getMonth() - 3);
        return { start: toISO(t3), end: toISO(today), label: "Last 3 Months" };
      case "YEAR":
        const ty = new Date(); ty.setFullYear(today.getFullYear() - 1);
        return { start: toISO(ty), end: toISO(today), label: "Last 1 Year" };
      case "5_YEARS":
        const t5 = new Date(); t5.setFullYear(today.getFullYear() - 5);
        return { start: toISO(t5), end: toISO(today), label: "Last 5 Years" };
      default:
        return { start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), end: toISO(today), label: "This Month" };
    }
  };

  const [activeRange, setActiveRange] = useState(() => computeRange("MONTH"));

  // fetches summary totals and chart data whenever a date range is selected
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/admin/reports/dashboard-stats?start=${activeRange.start}&end=${activeRange.end}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await res.json();
        if (d.totals) {
          setData({
            totals: d.totals,
            charts: d.charts || { revenueTrend: [], revenueBySport: [], revenueByCourt: [] }
          });
        }
      } catch (err) {
        console.error("Dashboard stats fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [activeRange]);

  // updates both the UI button state and the date filters
  const handleRangeChange = (val) => {
    setRange(val);
    setActiveRange(computeRange(val));
  };

  const totals = data.totals;
  const charts = data.charts;

  return (
    <div className="admin-content-inner">
      <div className="flex-between mb-4" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Management Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time business intelligence for ArenaPro Operations</p>
        </div>
        
        {/* time range quick-selection buttons */}
        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          {['TODAY', 'MONTH', '3_MONTHS', 'YEAR', '5_YEARS'].map((r) => (
            <button 
              key={r}
              onClick={() => handleRangeChange(r)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: range === r ? 'var(--primary-gradient)' : 'transparent',
                color: range === r ? 'white' : 'var(--text-muted)'
              }}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* dashboard widgets showing top-level totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="arena-card dashboard-stat-card indigo-flat">
           <span className="stat-label-simple">Total Bookings</span>
           <h3 className="stat-value-simple">{loading ? "..." : totals.bookings}</h3>
        </div>

        <div className="arena-card dashboard-stat-card green-flat">
           <span className="stat-label-simple">Total Revenue</span>
           <h3 className="stat-value-simple">{loading ? "..." : `LKR ${totals.revenue.toLocaleString()}`}</h3>
        </div>

        <div className="arena-card dashboard-stat-card rose-flat">
           <span className="stat-label-simple">Pending Actions</span>
           <h3 className="stat-value-simple">{loading ? "..." : totals.pendingActions}</h3>
        </div>
      </div>

      {/* visual line chart showing revenue performance over time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="arena-card" style={{ padding: '24px' }}>
          <div className="flex-between mb-4">
            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>Revenue Trend (LKR)</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily performance overview</span>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(value) => [`Rs ${parseFloat(value).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* breakdown charts for specialized data analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="arena-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Revenue by Sport</h4>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={charts.revenueBySport} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(value) => [`Rs ${parseFloat(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {charts.revenueBySport.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="arena-card" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Revenue by Court</h4>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={charts.revenueByCourt}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(value) => [`Rs ${parseFloat(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                  {charts.revenueByCourt.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-stat-card {
           padding: 32px;
           display: flex;
           flex-direction: column;
           gap: 8px;
           border: none !important;
           border-radius: 20px !important;
           transition: all 0.3s;
        }
        .dashboard-stat-card:hover { transform: scale(1.02); }
        
        .stat-label-simple {
           font-size: 0.85rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 0.05em;
           opacity: 0.9;
        }
        .stat-value-simple {
           font-size: 2.5rem;
           font-weight: 900;
           margin: 0;
        }
        .indigo-flat { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe !important; }
        .indigo-flat .stat-value-simple { color: #3730a3; }
        
        .green-flat { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0 !important; }
        .green-flat .stat-value-simple { color: #166534; }
        
        .rose-flat { background: #ffe4e6; color: #be123c; border: 1px solid #fbcfe8 !important; }
        .rose-flat .stat-value-simple { color: #9f1239; }
        
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .mb-4 { margin-bottom: 32px; }
      `}</style>
    </div>
  );
}
