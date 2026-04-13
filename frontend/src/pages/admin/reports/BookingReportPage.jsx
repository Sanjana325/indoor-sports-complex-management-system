import { useAnalytics } from "../../../hooks/useAnalytics";
import { AnalyticHeader, AnalyticFilters, KPIStatsGrid, InsightPanel } from "../../../components/admin/analytics/AnalyticsSuite";
import { AnalyticChart, AnalyticTable } from "../../../components/admin/analytics/AnalyticsDataViews";

export default function BookingReportPage() {
  const { loading, data, activeRange, controls } = useAnalytics("bookings");

  const insights = [
    `Peak booking hour is ${data.kpis.peakBookingHour || 'N/A'}.`,
    ...(data.charts.bookingsBySport?.length 
      ? [`${[...data.charts.bookingsBySport].sort((a,b) => b.value - a.value)[0].name} is the trending sport.`] 
      : [])
  ];

  return (
    <div className="admin-content-inner">
      <AnalyticHeader 
        title="Booking Analytics" 
        subtitle={`Audit Period: ${activeRange.label}`}
        onExportCSV={() => console.log("CSV Export")}
        onExportPDF={() => window.print()}
      />

      <AnalyticFilters controls={controls} />

      <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: '20px', alignItems: 'start' }}>
        <div>
          <KPIStatsGrid kpis={data.kpis} loading={loading} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <AnalyticChart 
              title="Daily Booking Trend" 
              type="line" 
              data={data.charts.bookingsPerDay} 
              loading={loading} 
              dataKey="count"
            />
            <AnalyticChart 
              title="Bookings By Sport" 
              type="bar" 
              data={data.charts.bookingsBySport} 
              loading={loading} 
              dataKey="value"
            />
          </div>

          <AnalyticTable 
            headers={["ID", "Player", "Court", "Date", "Status"]}
            rows={data.reports}
            loading={loading}
            rowRenderer={(row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.player}</td>
                <td>{row.court}</td>
                <td>{row.date}</td>
                <td>
                  <span className={`status-pill ${row.status === "CONFIRMED" ? "success" : "expired"}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )}
          />
        </div>

        <div className="no-print">
          <InsightPanel insights={insights} loading={loading} />
          
          <div className="arena-card no-print" style={{ background: 'var(--bg-main)', border: '1px dashed var(--primary-light)' }}>
             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>💡 Pro Tip</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
               Filter your reports by "Last 3 Months" to identify seasonal trends and optimize court availability.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
