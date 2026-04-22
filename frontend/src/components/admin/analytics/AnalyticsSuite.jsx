import { useNavigate } from "react-router-dom";

// layout header for specific report pages with title, breadcrumbs, and export actions
export const AnalyticHeader = ({ title, subtitle, onExportPDF }) => {
  const navigate = useNavigate();
  return (
    <div className="flex-between mb-4 analytic-header">
      <div>
        {/* navigation back link to return to the root reports index */}
        <button 
          className="btn-back mb-1" 
          onClick={() => navigate("/admin/reports")}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          ← Back to Reports
        </button>
        <h2 className="page-title" style={{ margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* conditional action button for generating a static PDF version of the current view */}
        {onExportPDF && (
          <button className="btn btn-primary" onClick={onExportPDF}>
            Export as PDF
          </button>
        )}
      </div>
    </div>
  );
};

// global filter bar for analytics with date range presets and dynamic categorical selects
export const AnalyticFilters = ({ controls, hasMethodFilter, hasCategoryFilter, hasTargetClassFilter, metadata }) => {
  return (
    <div className="arena-card mb-4 no-print" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
      <div className="flex-between" style={{ gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {/* quick selection for standard time periods like 'This Month' or 'This Year' */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-input" 
            style={{ minWidth: '180px' }} 
            value={controls.preset} 
            onChange={(e) => controls.setPreset(e.target.value)}
          >
            <option value="TODAY">Today</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
            <option value="3_MONTHS">Last 3 Months</option>
            <option value="YEAR">Last 1 Year</option>
          </select>
        </div>
        
        {/* manual override for picking exact start and end dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            className="form-input" 
            type="date" 
            value={controls.customRange.start} 
            onChange={(e) => controls.setCustomRange({ ...controls.customRange, start: e.target.value })} 
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input 
            className="form-input" 
            type="date" 
            value={controls.customRange.end} 
            onChange={(e) => controls.setCustomRange({ ...controls.customRange, end: e.target.value })} 
          />
        </div>
        
        {hasMethodFilter && (
          /* narrows down transaction reports by payment channel */
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-input" 
              style={{ minWidth: '160px' }} 
              value={controls.methodOptions} 
              onChange={(e) => controls.setMethodOptions(e.target.value)}
            >
              <option value="ALL">All Methods</option>
              <option value="ONLINE">Online</option>
              <option value="BANK_SLIP">Bank Transfer</option>
            </select>
          </div>
        )}
        
        {hasCategoryFilter && (
          /* splits revenue or attendance data by module type */
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-input" 
              style={{ minWidth: '160px' }} 
              value={controls.categoryOptions} 
              onChange={(e) => controls.setCategoryOptions(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="CLASSES">Classes</option>
              <option value="BOOKINGS">Bookings</option>
            </select>
          </div>
        )}

        {hasTargetClassFilter && metadata?.classes && (
          /* focuses reports on a specific coaching program */
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-input" 
              style={{ minWidth: '160px' }} 
              value={controls.classIdOptions} 
              onChange={(e) => controls.setClassIdOptions(e.target.value)}
            >
              <option value="ALL">All Classes</option>
              {metadata.classes.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          className="btn btn-secondary" 
          style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
          onClick={controls.updateRange}
        >
          Update Report
        </button>
      </div>
    </div>
  );
};

// summarizes key performance indicators into a high-visibility responsive grid
export const KPIStatsGrid = ({ kpis, loading }) => {
  // helper to convert snake_case or camelCase keys into professional uppercase headers
  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').toUpperCase();
  
  // ensures currency values are correctly prefixed and delimited
  const formatValue = (key, val) => {
    if (key.toLowerCase().includes('revenue')) return `LKR ${val.toLocaleString()}`;
    return val;
  };

  // skeleton screen for KPI cards to prevent layout shifts during fetching
  if (loading) {
     return (
       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: '24px' }}>
         {[1,2,3,4].map(i => (
           <div key={i} className="arena-card skeleton-card" style={{ height: '90px' }}>
             <div className="loading-shimmer" style={{ height: '12px', width: '60%', marginBottom: '12px' }} />
             <div className="loading-shimmer" style={{ height: '24px', width: '40%' }} />
           </div>
         ))}
       </div>
     );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: '24px' }} className="kpi-grid no-print">
      {Object.entries(kpis).map(([key, val]) => (
        /* individual statistic card with side-border branding */
        <div key={key} className="arena-card" style={{ position: 'relative', overflow: 'hidden', padding: '20px' }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: '6px' }}>{formatKey(key)}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-main)" }}>{formatValue(key, val)}</div>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary-gradient)' }} />
        </div>
      ))}
    </div>
  );
};

// informative panel for automated data observations and computed trends
export const InsightPanel = ({ insights, loading }) => {
  if (loading) return null;
  return (
    <div className="arena-card mb-4 no-print" style={{ background: '#f8fafc', borderLeft: '4px solid var(--primary)' }}>
      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
        ✨ Intelligent Insights
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* iterates through calculated observations to provide quick takeaways */}
        {insights.map((ins, i) => (
          <p key={i} style={{ fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--primary)' }}>•</span> {ins}
          </p>
        ))}
      </div>
    </div>
  );
};
