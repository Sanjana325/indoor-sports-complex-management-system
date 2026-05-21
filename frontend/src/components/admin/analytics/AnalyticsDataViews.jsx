import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// predefined color palettes for consistent chart branding across the dashboard
const CHART_COLORS = ['#16a34a', '#86efac', '#065f46', '#34d399', '#022c22'];
const MIXED_COLORS = ['#16a34a', '#facc15', '#065f46', '#eab308', '#34d399'];

// versatile chart wrapper that supports line, bar, donut, and pie visualizations
export const AnalyticChart = ({ title, type, data, loading, dataKey = "value" }) => {
  // shows a skeleton loading state while the analytics are being calculated
  if (loading) {
    return (
      <div className="arena-card" style={{ height: '360px' }}>
        <div className="loading-shimmer" style={{ height: '18px', width: '40%', marginBottom: '20px' }} />
        <div className="loading-shimmer" style={{ height: '240px', width: '100%' }} />
      </div>
    );
  }

  return (
    <div className="arena-card chart-container no-print" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-main)' }}>{title}</h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        {/* container that handles automatic resizing for different screen resolutions */}
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            /* time-series line chart for tracking trends over a period */
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="var(--primary)" 
                strokeWidth={3} 
                dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          ) : type === 'bar' ? (
            /* categorical bar chart for comparing discrete groups */
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} itemStyle={{ color: 'var(--text-main)' }} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || MIXED_COLORS[index % MIXED_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : type === 'donut' ? (
            /* donut chart for showing proportional data with a hollow center */
            <PieChart>
              <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip itemStyle={{ color: 'var(--text-main)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span style={{ color: 'var(--text-main)' }}>{value}</span>} />
            </PieChart>
          ) : (
            /* standard pie chart for full composition ratios */
            <PieChart>
              <Pie data={data} innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip itemStyle={{ color: 'var(--text-main)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span style={{ color: 'var(--text-main)' }}>{value}</span>} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// supporting table view for drilling down into the raw numbers behind the charts
export const AnalyticTable = ({ headers, rows, loading, rowRenderer }) => {
  return (
    <div className="arena-table-container mt-4">
      <table className="arena-table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {/* renders row skeletons while waitng for the dataset to resolve */}
          {loading ? [1,2,3,4,5].map(i => (
            <tr key={i}>
              <td colSpan={headers.length} style={{ padding: '16px' }}>
                <div className="loading-shimmer" style={{ height: '24px', width: '100%' }} />
              </td>
            </tr>
          )) : rows.length === 0 ? (
            /* empty state design for when filters return no results */
            <tr>
              <td colSpan={headers.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>📝</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No records found for this period</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Try adjusting your date range filter above.</div>
              </td>
            </tr>
          ) : rows.map(rowRenderer)}
        </tbody>
      </table>
    </div>
  );
};
