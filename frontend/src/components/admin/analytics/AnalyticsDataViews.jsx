import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const CHART_COLORS = ['#16a34a', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export const AnalyticChart = ({ title, type, data, loading, dataKey = "value" }) => {
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
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || "var(--primary)"} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const AnalyticTable = ({ headers, rows, loading, rowRenderer }) => {
  return (
    <div className="arena-table-container mt-4">
      <table className="arena-table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? [1,2,3,4,5].map(i => (
            <tr key={i}>
              <td colSpan={headers.length} style={{ padding: '16px' }}>
                <div className="loading-shimmer" style={{ height: '24px', width: '100%' }} />
              </td>
            </tr>
          )) : rows.length === 0 ? (
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
